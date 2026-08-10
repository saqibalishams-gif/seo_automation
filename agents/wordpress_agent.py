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
    def publish(self, doc: ContentDocument, image_assignments: Optional[list] = None, post_status: str = "publish") -> Optional[str]:
        logger.info(f"Starting publish process for '{doc.title}' to {self.site_url}")
        
        # 1. Upload Images and update document references BEFORE formatting
        featured_image_id = None
        for key, path in list(doc.images.items()):
            if not str(path).startswith('http'):
                upload_result = self.upload_media(path)
                if upload_result:
                    doc.images[key] = upload_result['url']
                    if key == 'featured':
                        featured_image_id = upload_result['id']
                else:
                    logger.warning(f"Failed to upload image '{key}', removing from document.")
                    del doc.images[key]
                    
        # 1b. Upload Image Assignments
        if image_assignments:
            for assignment in image_assignments:
                path = assignment.get('file_path')
                if path and not str(path).startswith('http'):
                    upload_result = self.upload_media(path)
                    if upload_result:
                        assignment['url'] = upload_result['url']
                        if assignment.get('section_id') == 'featured':
                            featured_image_id = upload_result['id']
                    else:
                        logger.warning(f"Failed to upload assigned image: {path}")
                        
        # 2. Format Payload using Editor Adapter
        editor_type = self.profile.get('editor_type', 'classic').lower()
        if editor_type == 'gutenberg':
            logger.info("Using Gutenberg Editor Adapter")
            payload = GutenbergAdapter.format_content(doc, image_assignments, post_status=post_status)
        else:
            logger.info("Using Classic Editor Adapter")
            payload = ClassicEditorAdapter.format_content(doc, image_assignments, post_status=post_status)
            
        # Add categories if provided in mapping
        payload["categories"] = doc.categories if doc.categories else [2, 4, 7] 
        
        # Add SEO description to excerpt as a fallback
        if doc.seo_metadata and doc.seo_metadata.meta_description:
            payload["excerpt"] = doc.seo_metadata.meta_description
        
        # Add featured image ID to the post metadata
        if featured_image_id:
            payload["featured_media"] = featured_image_id
            
        # Inject standard SEO Meta Tags if available (at root for REST fields compatibility)
        seo_plugin = self.profile.get('seo_plugin', 'none').lower()
        if seo_plugin != 'none' and doc.seo_metadata:
            if "meta" not in payload:
                payload["meta"] = {}
            if seo_plugin == 'rankmath':
                payload["meta"]["rank_math_focus_keyword"] = doc.seo_metadata.focus_keyword
                payload["meta"]["rank_math_description"] = doc.seo_metadata.meta_description
                if doc.seo_metadata.meta_title:
                    payload["meta"]["rank_math_title"] = doc.seo_metadata.meta_title
            elif seo_plugin == 'yoast':
                payload["meta"]["_yoast_wpseo_focuskw"] = doc.seo_metadata.focus_keyword
                payload["meta"]["_yoast_wpseo_metadesc"] = doc.seo_metadata.meta_description
                if doc.seo_metadata.meta_title:
                    payload["meta"]["_yoast_wpseo_title"] = doc.seo_metadata.meta_title
            
        # 3. Push Base Post
        post_id = self._push_post(payload)
        if not post_id:
            logger.error("Failed to create base post. Aborting metadata application.")
            return None
            
        logger.info(f"Base post created with ID {post_id}")
            
        # 4. Apply SEO Metadata (Keep for backwards compatibility / REST endpoints)
        if seo_plugin == 'rankmath':
            RankMathAdapter.apply_metadata(doc, post_id, self.site_url, self.auth, self.headers)
        elif seo_plugin == 'yoast':
            YoastAdapter.apply_metadata(doc, post_id, self.site_url, self.auth, self.headers)
            
        # 5. Apply Theme Custom Fields
        active_theme = self.profile.get('active_theme', 'unknown').lower()
        if active_theme == 'appyn' or 'appyn' in active_theme:
            AppynAdapter.apply_custom_fields(doc, post_id, self.site_url, self.auth, self.headers)
            
        return post_id
