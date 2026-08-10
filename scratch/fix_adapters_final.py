import sys

# 1. Update classic.py
classic_py = r'd:\Seo_automation\adapters\editors\classic.py'
with open(classic_py, 'r', encoding='utf-8') as f:
    c_content = f.read()

c_content = c_content.replace(
    'def format_content(doc: ContentDocument, image_assignments: list = None) -> Dict[str, Any]:',
    'def format_content(doc: ContentDocument, image_assignments: list = None, post_status: str = "publish") -> Dict[str, Any]:'
)
# Make sure we don't duplicate replace if we already did
if '"status": "publish"' in c_content:
    c_content = c_content.replace(
        '"status": "publish"',
        '"status": post_status'
    )
with open(classic_py, 'w', encoding='utf-8') as f:
    f.write(c_content)

# 2. Update gutenberg.py
gutenberg_py = r'd:\Seo_automation\adapters\editors\gutenberg.py'
with open(gutenberg_py, 'r', encoding='utf-8') as f:
    g_content = f.read()

g_content = g_content.replace(
    'def format_content(doc: ContentDocument, image_assignments: list = None) -> Dict[str, Any]:',
    'def format_content(doc: ContentDocument, image_assignments: list = None, post_status: str = "publish") -> Dict[str, Any]:'
)
if '"status": "publish"' in g_content:
    g_content = g_content.replace(
        '"status": "publish"',
        '"status": post_status'
    )
with open(gutenberg_py, 'w', encoding='utf-8') as f:
    f.write(g_content)

print("Adapters patched successfully!")
