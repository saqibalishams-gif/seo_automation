from typing import Dict, Any
from core.universal_model import ContentDocument
from core.rendering_engine import RenderingEngine

class ClassicEditorAdapter:
    @staticmethod
    def format_content(doc: ContentDocument) -> Dict[str, Any]:
        """
        Formats the ContentDocument into standard semantic HTML suitable for the Classic Editor.
        Returns the payload dictionary for the WordPress REST API.
        """
        html_content = RenderingEngine.render_classic_html(doc)
        
        return {
            "title": doc.title,
            "content": html_content,
            "excerpt": doc.seo_metadata.meta_description,
            "status": "draft"
        }
