import sys

worker_py = r'd:\Seo_automation\workers\job_worker.py'
with open(worker_py, 'r', encoding='utf-8') as f:
    w_content = f.read()

correct_retrieval = """
        # Load Template
        from utils.db_models import UserSettings, ContentTemplate, TemplateSection
        with SessionLocal() as db:
            settings = db.query(UserSettings).filter(UserSettings.user_id == user_id).first()
            template_id = settings.active_template_id if settings else None
            template_dict = None
            if template_id:
                tmpl = db.query(ContentTemplate).filter(ContentTemplate.id == template_id).first()
                if tmpl:
                    secs = []
                    for s in tmpl.sections:
                        secs.append({
                            "id": str(s.id),
                            "name": s.name,
                            "required": s.required,
                            "content_type": s.content_type,
                            "ai_instruction": s.ai_instruction
                        })
                    template_dict = {
                        "id": tmpl.id,
                        "name": tmpl.name,
                        "sections": secs
                    }

        # 4. Content Generation Stage (Calls Groq with prompt instructions)"""

w_content = w_content.replace(
    """
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

        # 4. Content Generation Stage (Calls Groq with prompt instructions)""",
    correct_retrieval
)

with open(worker_py, 'w', encoding='utf-8') as f:
    f.write(w_content)

print("Fixed job_worker.py template retrieval!")
