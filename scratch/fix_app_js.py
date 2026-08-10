import re
import sys

app_js = r'd:\Seo_automation\dashboard\static\app.js'
with open(app_js, 'r', encoding='utf-8') as f:
    js_content = f.read()

# 1. Replace the single publish button with two buttons
old_button = '<button class="btn-primary publish-draft-btn" data-id="${d.id}" style="padding:8px 16px;font-size:0.9rem;">🚀 Publish to WordPress</button>'
new_buttons = '''
                            <button class="btn-primary publish-draft-btn" data-id="${d.id}" data-action="publish" style="padding:8px 16px;font-size:0.9rem;">🚀 Publish Live</button>
                            <button class="btn-secondary publish-draft-btn" data-id="${d.id}" data-action="draft" style="padding:8px 16px;font-size:0.9rem;background-color:#f0ad4e;color:white;">📝 Send as Draft</button>
'''
js_content = js_content.replace(old_button, new_buttons.strip())

# 2. Fix the event listener
# from: const id = btn.getAttribute("data-id");
# to: const id = btn.getAttribute("data-id"); const action = btn.getAttribute("data-action");
old_get_id = 'const id = btn.getAttribute("data-id");'
new_get_id = 'const id = btn.getAttribute("data-id");\n                    const action = btn.getAttribute("data-action");'

# Only replace the one inside the publish-draft-btn event listener
# We can find it by looking for the confirm
old_confirm_block = '''const id = btn.getAttribute("data-id");
                    if (!confirm("Publish this draft to WordPress?")) return;'''
new_confirm_block = '''const id = btn.getAttribute("data-id");
                    const action = btn.getAttribute("data-action");
                    if (!confirm(action === 'publish' ? "Publish live to WordPress?" : "Send to WordPress as a Draft?")) return;'''

js_content = js_content.replace(old_confirm_block, new_confirm_block)

# Remove the bad replacements we might have done in previous patches
js_content = js_content.replace(
    '<button class="btn-publish" onclick="publishDraft(${d.id}, this, \'publish\')">🚀 Publish to Site</button> <button class="btn-publish" onclick="publishDraft(${d.id}, this, \'draft\')" style="background-color:#f0ad4e;">📝 Send as WP Draft</button>',
    ''
)
js_content = js_content.replace('window.publishDraft = async function(id, btn, action) {', '')

with open(app_js, 'w', encoding='utf-8') as f:
    f.write(js_content)

print("app.js fixed!")
