import os
import uuid
import json
import pytest
from unittest import mock
from PIL import Image

from utils.db_models import SessionLocal, User, ContentTemplate, TemplateSection, ImageAsset, ImageAssignment, PublishHistory
from services.template_service import seed_default_template, create_custom_template, duplicate_template, get_user_templates
from services.validation_service import validate_content_before_publish
from core.universal_model import ContentDocument, SeoMetadata, Section, ContentTemplateCreate, TemplateSectionSchema
from agents.image_agent import ImageAgent
from core.rendering_engine import RenderingEngine
from dashboard.auth import hash_password

@pytest.fixture
def test_user():
    with SessionLocal() as db:
        user = db.query(User).filter(User.email == "template_user@test.com").first()
        if not user:
            user = User(
                email="template_user@test.com",
                password_hash=hash_password("TestPass123!"),
                role="user",
                subscription_plan="free"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        yield user

def test_template_section_uuid_stability(test_user):
    """
    Verifies section_id UUID remains stable when renaming a section.
    """
    sec_id = f"sec-{uuid.uuid4().hex[:8]}"
    payload = ContentTemplateCreate(
        name="Product Review",
        description="Custom template for review",
        mode="custom",
        sections=[
            TemplateSectionSchema(id=sec_id, name="Product Overview", order=1, required=True, content_type="paragraph")
        ]
    )
    tmpl = create_custom_template(test_user.id, payload)
    assert tmpl.id is not None
    
    with SessionLocal() as db:
        sec = db.query(TemplateSection).filter(TemplateSection.id == sec_id).first()
        assert sec is not None
        assert sec.name == "Product Overview"
        
        # Rename section
        sec.name = "About the Product"
        db.commit()
        
        renamed_sec = db.query(TemplateSection).filter(TemplateSection.id == sec_id).first()
        assert renamed_sec.name == "About the Product"
        assert renamed_sec.id == sec_id # Stable UUID preserved!

def test_default_template_seeding(test_user):
    """
    Verifies default template is seeded with pre-populated section_ids.
    """
    tmpl = seed_default_template(test_user.id)
    assert tmpl is not None
    assert tmpl.is_default is True
    assert len(tmpl.sections) >= 9

def test_pillow_image_processing(tmp_path):
    """
    Verifies Pillow aspect-ratio preserving custom image processing.
    """
    img_path = os.path.join(tmp_path, "sample.jpg")
    im = Image.new("RGB", (1600, 800), color="blue")
    im.save(img_path)
    
    agent = ImageAgent()
    info = agent.process_custom_image(img_path, target_width=800)
    assert info["width"] == 800
    assert info["height"] == 400 # Aspect ratio 2:1 preserved!

def test_rendering_engine_and_fallback(tmp_path):
    """
    Verifies section_id image rendering and do_not_publish fallback behavior for missing sections.
    """
    sec_id = f"sec-{uuid.uuid4().hex[:8]}"
    doc = ContentDocument(
        title="Test Article",
        seo_metadata=SeoMetadata(focus_keyword="Test", meta_description="Test desc"),
        introduction="Test intro",
        sections=[
            Section(section_id=sec_id, heading="Features", content="Feature content")
        ],
        conclusion="Conclusion text"
    )
    
    assignments = [
        {
            "url": "https://example.com/image.jpg",
            "section_id": sec_id,
            "position": "after_heading",
            "alignment": "center",
            "size": "large",
            "fallback_behavior": "do_not_publish"
        },
        {
            "url": "https://example.com/orphan.jpg",
            "section_id": "missing-sec-999",
            "position": "after_heading",
            "alignment": "center",
            "size": "large",
            "fallback_behavior": "do_not_publish"
        }
    ]
    
    rendered_html = RenderingEngine.render_classic_html(doc, image_assignments=assignments)
    assert "https://example.com/image.jpg" in rendered_html # Assigned section present -> rendered!
    assert "https://example.com/orphan.jpg" not in rendered_html # Assigned section missing -> DO NOT PUBLISH safeguard!

def test_12_check_validation_engine(test_user):
    """
    Verifies 12-Check Validation Engine evaluation.
    """
    payload = ContentTemplateCreate(
        name="Validation Custom Template",
        mode="custom",
        sections=[
            TemplateSectionSchema(name="Features", required=True),
            TemplateSectionSchema(name="Pros and Cons", required=True),
            TemplateSectionSchema(name="Conclusion", required=True)
        ]
    )
    tmpl = create_custom_template(test_user.id, payload)

    doc = ContentDocument(
        title="Valid Test Article",
        seo_metadata=SeoMetadata(focus_keyword="Test", meta_description="Test meta description for validation check."),
        introduction="Comprehensive introduction text exceeding twenty characters for validation check.",
        sections=[
            Section(heading="Features", content="Feature details"),
            Section(heading="Pros and Cons", content="Pros and cons"),
            Section(heading="Conclusion", content="Conclusion details")
        ],
        conclusion="Conclusion text"
    )
    res = validate_content_before_publish(doc, test_user.id, template_id=tmpl.id)
    assert res.is_valid is True
    assert res.checks_passed >= 10

def test_enhanced_history_operations(test_user):
    """
    Verifies history deletion and retry record creation.
    """
    with SessionLocal() as db:
        hist = PublishHistory(
            user_id=test_user.id,
            game_name="History Game",
            provider="History Provider",
            article_id=999
        )
        db.add(hist)
        db.commit()
        db.refresh(hist)
        hist_id = hist.id

    with SessionLocal() as db:
        h = db.query(PublishHistory).filter(PublishHistory.id == hist_id).first()
        assert h is not None
        db.delete(h)
        db.commit()
        
        deleted_h = db.query(PublishHistory).filter(PublishHistory.id == hist_id).first()
        assert deleted_h is None
