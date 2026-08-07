from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class FAQ(BaseModel):
    question: str
    answer: str

class Section(BaseModel):
    heading: str
    content: str # Can contain paragraphs, lists, tables (safe HTML/Markdown)
    subsections: List['Section'] = Field(default_factory=list)

class SeoMetadata(BaseModel):
    focus_keyword: str
    meta_description: str
    meta_title: Optional[str] = None

class ContentDocument(BaseModel):
    """
    Universal Content Model
    This represents the purely structured format of an article, completely disconnected from WordPress formatting.
    """
    title: str
    slug: str = ""
    seo_metadata: SeoMetadata
    
    introduction: str
    sections: List[Section]
    conclusion: str
    faqs: List[FAQ] = Field(default_factory=list)
    
    # Internal metadata
    images: Dict[str, str] = Field(default_factory=dict) # e.g., {'featured': '/path', 'description': '/path'}
    custom_fields: Dict[str, Any] = Field(default_factory=dict) # Catch-all for Appyn data, etc.
    categories: List[str] = Field(default_factory=list)
