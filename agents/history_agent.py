import sqlite3
import datetime
import os
from utils.logger import get_logger
from utils.db import get_db_connection, init_db, DB_PATH

logger = get_logger("history_agent")

def check_candidate(game_name: str, provider: str, user_id: int, db_path=DB_PATH) -> bool:
    """
    Pre-research gate: check if a game from a provider was published within the last 180 days for a specific user.
    Returns False (skip) if already covered within 180 days.
    Returns True (proceed) if not covered, or covered > 180 days ago.
    """
    cutoff_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=180)
    
    with get_db_connection(db_path) as conn:
        cursor = conn.execute(
            '''SELECT published_at FROM publish_history 
               WHERE user_id = ? AND LOWER(game_name) = LOWER(?) AND LOWER(provider) = LOWER(?)''',
            (user_id, game_name, provider)
        )
        row = cursor.fetchone()
        
        if row:
            published_at = row['published_at']
            # If the database stored a naive datetime, assume UTC for comparison
            if published_at.tzinfo is None:
                published_at = published_at.replace(tzinfo=datetime.timezone.utc)
            
            if published_at >= cutoff_date:
                logger.info(f"Skipping {provider} - {game_name}: Published within 180 days ({published_at.date()}).")
                return False
            else:
                logger.info(f"Proceeding {provider} - {game_name}: Last published > 180 days ago ({published_at.date()}).")
                return True
                
    logger.info(f"Proceeding {provider} - {game_name}: New candidate.")
    return True

def record_publish(game_name: str, provider: str, article_id: str, published_at: datetime.datetime, user_id: int = 1, db_path=DB_PATH):
    """
    Post-publish logger: Record the game publish event.
    Upserts the record to ensure idempotency.
    """
    if published_at.tzinfo is None:
         published_at = published_at.replace(tzinfo=datetime.timezone.utc)
         
    with get_db_connection(db_path) as conn:
        conn.execute(
            '''INSERT INTO publish_history (user_id, game_name, provider, article_id, published_at) 
               VALUES (?, ?, ?, ?, ?)
               ON CONFLICT(user_id, game_name, provider) 
               DO UPDATE SET article_id=excluded.article_id, published_at=excluded.published_at''',
            (user_id, game_name, provider, article_id, published_at)
        )
        conn.commit()
    logger.info(f"Recorded publish event for {provider} - {game_name} (Article ID: {article_id}).")
