import re
import sys

# 1. Update app.py
app_py = r'd:\Seo_automation\dashboard\app.py'
with open(app_py, 'r', encoding='utf-8') as f:
    content = f.read()

# Add action query parameter to publish_draft
content = content.replace(
    'def publish_draft(draft_id: int, user_id: int = Depends(get_current_user_id)):',
    'def publish_draft(draft_id: int, action: str = "publish", user_id: int = Depends(get_current_user_id)):'
)

content = content.replace(
    'article_id = wp_publisher.publish(doc, image_assignments)',
    'article_id = wp_publisher.publish(doc, image_assignments, post_status=action)'
)

with open(app_py, 'w', encoding='utf-8') as f:
    f.write(content)

# 2. Update job_worker.py to pass template
worker_py = r'd:\Seo_automation\workers\job_worker.py'
with open(worker_py, 'r', encoding='utf-8') as f:
    w_content = f.read()

# Get template in job_worker.py
template_retrieval = """
        # Load Template
        from utils.db_models import UserSettings, ContentTemplate
        with SessionLocal() as db:
            settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
            template_id = settings.active_template_id if settings else None
            template_dict = None
            if template_id:
                tmpl = db.query(ContentTemplate).filter(ContentTemplate.id == template_id).first()
                if tmpl:
                    import json
                    template_dict = {
                        "id": tmpl.id,
                        "name": tmpl.name,
                        "sections": json.loads(tmpl.sections_json)
                    }

        # 4. Content Generation Stage (Calls Groq with prompt instructions)"""

w_content = w_content.replace(
    '# 4. Content Generation Stage (Calls Groq with prompt instructions)',
    template_retrieval
)

w_content = w_content.replace(
    'draft_doc = content_agent.draft_article(candidate, context, trusted_facts)',
    'draft_doc = content_agent.draft_article(candidate, context, trusted_facts, template=template_dict)'
)

with open(worker_py, 'w', encoding='utf-8') as f:
    f.write(w_content)

print("Patch applied to backend!")
