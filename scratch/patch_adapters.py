import sys

# 1. Update wordpress_agent.py
wp_agent_py = r'd:\Seo_automation\agents\wordpress_agent.py'
with open(wp_agent_py, 'r', encoding='utf-8') as f:
    wp_content = f.read()

wp_content = wp_content.replace(
    'def publish(self, document: ContentDocument, image_assignments: Optional[List[Dict[str, Any]]] = None) -> Optional[int]:',
    'def publish(self, document: ContentDocument, image_assignments: Optional[List[Dict[str, Any]]] = None, post_status: str = "publish") -> Optional[int]:'
)

wp_content = wp_content.replace(
    'payload = self.adapter.format_content(document, image_assignments)',
    'payload = self.adapter.format_content(document, image_assignments, post_status=post_status)'
)

with open(wp_agent_py, 'w', encoding='utf-8') as f:
    f.write(wp_content)

# 2. Update classic.py
classic_py = r'd:\Seo_automation\adapters\editors\classic.py'
with open(classic_py, 'r', encoding='utf-8') as f:
    c_content = f.read()

c_content = c_content.replace(
    'def format_content(self, doc: ContentDocument, image_assignments: list = None) -> Dict[str, Any]:',
    'def format_content(self, doc: ContentDocument, image_assignments: list = None, post_status: str = "publish") -> Dict[str, Any]:'
)
c_content = c_content.replace(
    '"status": "publish"',
    '"status": post_status'
)
with open(classic_py, 'w', encoding='utf-8') as f:
    f.write(c_content)

# 3. Update gutenberg.py
gutenberg_py = r'd:\Seo_automation\adapters\editors\gutenberg.py'
with open(gutenberg_py, 'r', encoding='utf-8') as f:
    g_content = f.read()

g_content = g_content.replace(
    'def format_content(self, doc: ContentDocument, image_assignments: list = None) -> Dict[str, Any]:',
    'def format_content(self, doc: ContentDocument, image_assignments: list = None, post_status: str = "publish") -> Dict[str, Any]:'
)
g_content = g_content.replace(
    '"status": "publish"',
    '"status": post_status'
)
with open(gutenberg_py, 'w', encoding='utf-8') as f:
    f.write(g_content)

# 4. Update app.js
app_js = r'd:\Seo_automation\dashboard\static\app.js'
with open(app_js, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Change button in app.js
old_button = '<button class="btn-publish" onclick="publishDraft(${d.id}, this)">🚀 Publish to Site</button>'
new_button = '<button class="btn-publish" onclick="publishDraft(${d.id}, this, \'publish\')">🚀 Publish to Site</button> <button class="btn-publish" onclick="publishDraft(${d.id}, this, \'draft\')" style="background-color:#f0ad4e;">📝 Send as WP Draft</button>'
js_content = js_content.replace(old_button, new_button)

# Change function signature
old_func = 'window.publishDraft = async function(id, btn) {'
new_func = 'window.publishDraft = async function(id, btn, action) {'
js_content = js_content.replace(old_func, new_func)

# Change fetch call
old_fetch = 'const res = await fetch(`/api/publish/${id}`, { method: "POST" });'
new_fetch = 'const res = await fetch(`/api/publish/${id}?action=${action}`, { method: "POST" });'
js_content = js_content.replace(old_fetch, new_fetch)

with open(app_js, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Patching complete!")
