import sys

file_path = r'd:\Seo_automation\workers\job_worker.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """            template_dict = None
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
                    }"""

new_logic = """            template_dict = None
            tmpl = None
            if template_id:
                tmpl = db.query(ContentTemplate).filter(ContentTemplate.id == template_id).first()
            if not tmpl:
                # Mimic UI fallback so image assignment section_ids perfectly match generated draft section_ids
                tmpl = db.query(ContentTemplate).filter(ContentTemplate.is_default == True).first()
                if not tmpl:
                    tmpl = db.query(ContentTemplate).first()
                    
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
                }"""

content = content.replace(old_logic, new_logic)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("job_worker.py updated for template fallback mapping!")
