from typing import Dict, Any, Optional
from core.universal_model import ContentDocument
from utils.logger import get_logger
from utils.http import request_with_retry
import os

logger = get_logger("wp_base")

class BaseWordPressAdapter:
    def __init__(self, site_profile: Dict[str, Any]):
        self.site_url = site_profile['site_url'].rstrip('/')
        self.auth = (site_profile['username'], site_profile['app_password'])
        self.profile = site_profile
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
        
    def upload_media(self, file_path: str) -> Optional[Dict[str, Any]]:
        """Uploads a local image to the WordPress Media Library."""
        if not file_path or not os.path.exists(file_path):
            return None
            
        url = f"{self.site_url}/wp-json/wp/v2/media"
        try:
            filename = os.path.basename(file_path)
            with open(file_path, 'rb') as f:
                files = {'file': (filename, f, 'image/jpeg')}
                response = request_with_retry('POST', url, files=files, headers=self.headers, auth=self.auth, timeout=30)
                
            result = response.json()
            if result.get('id') and result.get('source_url'):
                return {"id": result['id'], "url": result['source_url']}
        except Exception as e:
            logger.error(f"Media upload failed: {e}")
        return None

    def _push_post(self, payload: Dict[str, Any]) -> Optional[str]:
        """Base method to push the compiled payload to WP."""
        url = f"{self.site_url}/wp-json/wp/v2/posts"
        try:
            response = request_with_retry('POST', url, json=payload, headers=self.headers, auth=self.auth, timeout=15)
            data = response.json()
            return str(data.get('id', ''))
        except Exception as e:
            logger.error(f"Failed to push post: {e}")
            return None
            
    def publish(self, doc: ContentDocument) -> Optional[str]:
        """
        Main orchestration method to be overridden by child adapters or executed as base.
        """
        raise NotImplementedError("Subclasses must implement the publish method.")
