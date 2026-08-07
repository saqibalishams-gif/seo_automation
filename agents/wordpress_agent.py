from typing import Dict, Any, Optional
from core.universal_model import ContentDocument
from adapters.wp_base import BaseWordPressAdapter
from adapters.editors.classic import ClassicEditorAdapter
from adapters.editors.gutenberg import GutenbergAdapter
from adapters.seo.rankmath import RankMathAdapter
from adapters.seo.yoast import YoastAdapter
from adapters.themes.appyn import AppynAdapter
from utils.logger import get_logger

logger = get_logger("wordpress_publisher")

class WordPressPublisher(BaseWordPressAdapter):
    """
    Orchestrates the publishing process by dynamically delegating formatting
    and metadata application to the appropriate adapters based on the Site Profile.
    """
    def publish(self, doc: ContentDocument) -> Optional[str]:
        logger.info(f"Starting publish process for '{doc.title}' to {self.site_url}")
        
        # 1. Format Payload using Editor Adapter
        editor_type = self.profile.get('editor_type', 'classic').lower()
        if editor_type == 'gutenberg':
            logger.info("Using Gutenberg Editor Adapter")
            payload = GutenbergAdapter.format_content(doc)
        else:
            logger.info("Using Classic Editor Adapter")
            payload = ClassicEditorAdapter.format_content(doc)
            
        # Add categories if provided in mapping
        # In a full implementation, we'd map string categories to IDs. For now, use doc categories if int, or fallback to default.
        payload["categories"] = doc.categories if doc.categories else [2, 4, 7] # Fallback for backward compatibility
        
        # Add featured image if available
        if 'featured' in doc.images:
            payload["featured_media"] = doc.images['featured'] # Assuming ID is passed here, but Universal Model passes URL currently.
            # We need to upload images first!
            
        # 2. Upload Images and update document references
        for key, path in doc.images.items():
            if not str(path).startswith('http'):
                upload_result = self.upload_media(path)
                if upload_result:
                    if key == 'featured':
                        payload["featured_media"] = upload_result['id']
                    else:
                        # For other images, we would inject their URLs into the payload.
                        # The formatting adapters handle basic injection for featured, but complex injection
                        # should ideally happen after upload.
                        pass
        
        # 3. Push Base Post
        post_id = self._push_post(payload)
        if not post_id:
            logger.error("Failed to create base post. Aborting metadata application.")
            return None
            
        logger.info(f"Base post created with ID {post_id}")
            
        # 4. Apply SEO Metadata
        seo_plugin = self.profile.get('seo_plugin', 'none').lower()
        if seo_plugin == 'rankmath':
            RankMathAdapter.apply_metadata(doc, post_id, self.site_url, self.auth, self.headers)
        elif seo_plugin == 'yoast':
            YoastAdapter.apply_metadata(doc, post_id, self.site_url, self.auth, self.headers)
            
        # 5. Apply Theme Custom Fields
        active_theme = self.profile.get('active_theme', 'unknown').lower()
        if active_theme == 'appyn' or 'appyn' in active_theme:
            AppynAdapter.apply_custom_fields(doc, post_id, self.site_url, self.auth, self.headers)
            
        return post_id
