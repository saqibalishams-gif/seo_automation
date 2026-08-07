from typing import Dict, Any, Tuple
from core.universal_model import ContentDocument
from utils.logger import get_logger
from utils.http import request_with_retry

logger = get_logger("seo_yoast")

class YoastAdapter:
    @staticmethod
    def apply_metadata(doc: ContentDocument, post_id: str, site_url: str, auth: Tuple[str, str], headers: Dict[str, str]) -> bool:
        """
        Pushes SEO metadata using the native WordPress REST API extension provided by Yoast.
        """
        payload = {
            "meta": {
                "yoast_wpseo_focuskw": doc.seo_metadata.focus_keyword,
                "yoast_wpseo_metadesc": doc.seo_metadata.meta_description
            }
        }
        
        if doc.seo_metadata.meta_title:
            payload["meta"]["yoast_wpseo_title"] = doc.seo_metadata.meta_title
            
        url = f"{site_url.rstrip('/')}/wp-json/wp/v2/posts/{post_id}"
        try:
            resp = request_with_retry('POST', url, json=payload, headers=headers, auth=auth, timeout=15)
            if resp.status_code in [200, 201]:
                logger.info(f"Yoast metadata successfully applied for Post {post_id}.")
                return True
            else:
                logger.warning(f"Yoast update failed with status {resp.status_code}")
        except Exception as e:
            logger.error(f"Failed to update Yoast meta: {e}")
            
        return False
