import re

file_path = r'd:\Seo_automation\agents\content_agent.py'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update the JSON schema prompt
old_schema = """            '      "section_id": "sec-xxx",\\n'
            '      "heading": "Features of Game",\\n'"""
new_schema = """            '      "section_id": "MUST exactly match the section_id provided in the instructions",\\n'
            '      "heading": "Must exactly match the Heading provided in the instructions",\\n'"""

content = content.replace(old_schema, new_schema)

# 2. Add an explicit check in parsing to try to fix changed section_ids
# From: sec_id = sec.get("section_id") or sec.get("id") or tmpl_secs_by_name.get(heading_text.lower().strip(), "")
# To: 
new_sec_id_logic = """
                sec_id_from_ai = sec.get("section_id") or sec.get("id") or ""
                # Force heading match if available
                sec_id = tmpl_secs_by_name.get(heading_text.lower().strip(), "")
                if not sec_id:
                    # If heading didn't match, maybe AI kept the section_id but changed heading
                    if str(sec_id_from_ai) in [str(x) for x in tmpl_secs_by_name.values()]:
                        sec_id = str(sec_id_from_ai)
                    else:
                        sec_id = sec_id_from_ai
"""
old_sec_id_logic = 'sec_id = sec.get("section_id") or sec.get("id") or tmpl_secs_by_name.get(heading_text.lower().strip(), "")'

content = content.replace(old_sec_id_logic, new_sec_id_logic.strip())

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("content_agent.py updated for image assignment linking.")
