import sys

wp_agent_py = r'd:\Seo_automation\agents\wordpress_agent.py'
with open(wp_agent_py, 'r', encoding='utf-8') as f:
    wp_content = f.read()

# 1. Update publish signature
wp_content = wp_content.replace(
    'def publish(self, doc: ContentDocument, image_assignments: Optional[list] = None) -> Optional[str]:',
    'def publish(self, doc: ContentDocument, image_assignments: Optional[list] = None, post_status: str = "publish") -> Optional[str]:'
)

# 2. Pass post_status to GutenbergAdapter
wp_content = wp_content.replace(
    'payload = GutenbergAdapter.format_content(doc, image_assignments)',
    'payload = GutenbergAdapter.format_content(doc, image_assignments, post_status=post_status)'
)

# 3. Pass post_status to ClassicEditorAdapter
wp_content = wp_content.replace(
    'payload = ClassicEditorAdapter.format_content(doc, image_assignments)',
    'payload = ClassicEditorAdapter.format_content(doc, image_assignments, post_status=post_status)'
)

with open(wp_agent_py, 'w', encoding='utf-8') as f:
    f.write(wp_content)

print("wordpress_agent.py patched!")
