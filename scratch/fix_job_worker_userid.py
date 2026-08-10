import sys

file_path = r'd:\Seo_automation\workers\job_worker.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """            if not tmpl:
                # Mimic UI fallback so image assignment section_ids perfectly match generated draft section_ids
                tmpl = db.query(ContentTemplate).filter(ContentTemplate.is_default == True).first()
                if not tmpl:
                    tmpl = db.query(ContentTemplate).first()"""

new_logic = """            if not tmpl:
                # Mimic UI fallback so image assignment section_ids perfectly match generated draft section_ids
                tmpl = db.query(ContentTemplate).filter(ContentTemplate.user_id == user_id, ContentTemplate.is_default == True).first()
                if not tmpl:
                    tmpl = db.query(ContentTemplate).filter(ContentTemplate.user_id == user_id).first()
                if not tmpl:
                    tmpl = db.query(ContentTemplate).first()"""

content = content.replace(old_logic, new_logic)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("job_worker.py updated to filter template by user_id.")
