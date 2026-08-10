from typing import Dict, Any
from core.universal_model import ContentDocument
from core.rendering_engine import RenderingEngine
import re

class GutenbergAdapter:
    @staticmethod
    def format_content(doc: ContentDocument, image_assignments: list = None, post_status: str = "publish") -> Dict[str, Any]:
        """
        Formats the ContentDocument into Gutenberg Block markup.
        Currently falls back to Classic HTML blocks for complex nested sections,
        but wraps top level elements in standard Gutenberg blocks for better editor compatibility.
        """
        # For a basic Gutenberg implementation, we can render classic HTML
        # and wrap it in a Custom HTML block or Classic block, but native paragraph/heading blocks are better.
        
        # A simple block parser:
        blocks = []
        
        if 'featured' in doc.images:
            url = doc.images["featured"]
            blocks.append(f'<!-- wp:image {{"align":"center","sizeSlug":"large"}} -->\n<figure class="wp-block-image aligncenter size-large"><img src="{url}" alt="{doc.title} Featured"/></figure>\n<!-- /wp:image -->')
            
        if doc.introduction:
            blocks.append(f'<!-- wp:paragraph -->\n<p>{doc.introduction}</p>\n<!-- /wp:paragraph -->')
            
        # To avoid complex recursive block parsing right now, we can render the rest of the sections as classic HTML
        # and wrap them in a Freeform (Classic) block, which Gutenberg handles natively.
        html_content = RenderingEngine.render_classic_html(doc, image_assignments)
        
        # Strip out the stuff we already added manually (intro and featured image)
        # This is simplified; ideally we recursively generate proper wp:heading and wp:list blocks.
        # For Phase 1 of Gutenberg support, we wrap the whole body in a Classic block.
        
        gutenberg_content = f'<!-- wp:freeform -->\n{html_content}\n<!-- /wp:freeform -->'
        
        return {
            "title": doc.title,
            "content": gutenberg_content,
            "excerpt": doc.seo_metadata.meta_description,
            "status": post_status
        }
