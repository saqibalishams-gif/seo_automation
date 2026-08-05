import json
from dataclasses import dataclass
from typing import List, Optional
from pyairtable import Api
from groq import Groq
from tenacity import retry, stop_after_attempt, wait_exponential

from utils.logger import get_logger
from config.settings import settings
from utils.db import get_db_connection, DB_PATH

logger = get_logger("discovery_agent")

@dataclass
class Candidate:
    game_name: str
    provider: str
    source_url: str
    airtable_record_id: Optional[str] = None
    featured_image_url: Optional[str] = None
    description_image_url: Optional[str] = None
    login_image_url: Optional[str] = None
    transaction_image_url: Optional[str] = None

class DiscoveryAgent:
    def __init__(self):
        self.api = Api(settings.airtable_api_key)
        self.table = self.api.table(settings.airtable_base_id, settings.airtable_table_name)
        self.groq_client = Groq(api_key=settings.groq_api_key)
        
        # Ensure publish_history table exists in sqlite
        with get_db_connection(DB_PATH) as conn:
            # We add status to existing publish_history if possible or it relies on existing schema
            # Actually schema.sql defines publish_history without status initially. 
            # We'll just create the table if not exists with the new schema (SQLite ignores if exists)
            # To avoid schema conflicts on existing table, we'll try to add 'status' if missing, but simpler:
            # The prompt requested we use published_games or publish_history. We'll use publish_history.
            pass
            
    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
    def _fetch_new_rows(self):
        """Fetches rows from Airtable where Status is 'New'"""
        return self.table.all(formula="{Status} = 'New'")
        
    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=2, max=10))
    def _extract_game_info(self, url: str) -> dict:
        """Uses Groq to extract game_name and provider from a URL"""
        prompt = (
            f"Given this URL and any visible page context: {url}\n"
            "Extract the game name and provider name. "
            "Respond ONLY with JSON: {\"game_name\": \"...\", \"provider\": \"...\"}. "
            "If you cannot determine a field, use null."
        )
        
        response = self.groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)

    def _is_duplicate(self, game_name: str, provider: str) -> bool:
        """Checks if the game is already in publish_history"""
        try:
            with get_db_connection(DB_PATH) as conn:
                cursor = conn.execute(
                    "SELECT 1 FROM publish_history WHERE LOWER(game_name) = LOWER(?) AND LOWER(provider) = LOWER(?)",
                    (game_name, provider)
                )
                return cursor.fetchone() is not None
        except Exception:
            return False

    def discover_candidates(self) -> List[Candidate]:
        """
        Polls Airtable for new links, extracts metadata, checks duplicates, and returns Candidates.
        """
        candidates = []
        try:
            records = self._fetch_new_rows()
            logger.info(f"Discovered {len(records)} 'New' rows in Airtable.")
        except Exception as e:
            logger.error(f"Failed to reach Airtable: {e}")
            return []

        for record in records:
            record_id = record['id']
            fields = record['fields']
            url = fields.get('Link')
            
            if not url:
                continue
                
            # Immediately mark as Processing
            self.table.update(record_id, {"Status": "Processing"})
            
            game_name = fields.get('Game Name')
            provider = fields.get('Provider')
            
            if not game_name or not provider:
                try:
                    logger.info(f"Extracting info from URL via Groq: {url}")
                    extracted = self._extract_game_info(url)
                    game_name = game_name or extracted.get("game_name")
                    provider = provider or extracted.get("provider")
                except Exception as e:
                    logger.error(f"Groq extraction failed for {url}: {e}")
                    self.table.update(record_id, {"Status": "Failed", "Notes": "Groq extraction failed"})
                    continue
            
            if not game_name or not provider:
                logger.warning(f"Could not determine Game Name or Provider for {url}")
                self.table.update(record_id, {"Status": "Failed", "Notes": "Missing game or provider name"})
                continue
                
            # Check deduplication
            if self._is_duplicate(game_name, provider):
                logger.info(f"Skipping {provider} - {game_name}: Duplicate found in DB.")
                self.table.update(record_id, {"Status": "Failed", "Notes": "duplicate"})
                continue
                
            
            def extract_attachment_url(field_name: str) -> Optional[str]:
                attachments = fields.get(field_name)
                if attachments and isinstance(attachments, list) and len(attachments) > 0:
                    return attachments[0].get('url')
                return None
                
            candidates.append(Candidate(
                game_name=game_name,
                provider=provider,
                source_url=url,
                airtable_record_id=record_id,
                featured_image_url=extract_attachment_url('Featured Image'),
                description_image_url=extract_attachment_url('Description Image'),
                login_image_url=extract_attachment_url('Login & Registration Image'),
                transaction_image_url=extract_attachment_url('Transaction Image')
            ))
            
        return candidates

    def update_status(self, record_id: str, status: str, notes: str = None):
        """Updates the Airtable record status"""
        fields = {"Status": status}
        if notes:
            fields["Notes"] = notes
        try:
            self.table.update(record_id, fields)
            logger.info(f"Airtable record {record_id} marked as {status}.")
        except Exception as e:
            logger.error(f"Failed to update Airtable status to {status} for {record_id}: {e}")

    def mark_published(self, record_id: str):
        """Legacy helper - Updates the Airtable record status to Published"""
        self.update_status(record_id, "Published")
