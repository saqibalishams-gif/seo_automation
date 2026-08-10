import sys

wp_agent_py = r'd:\Seo_automation\agents\wordpress_agent.py'
with open(wp_agent_py, 'r', encoding='utf-8') as f:
    wp_content = f.read()

# Replace the SEO root injection with meta injection
old_seo_inject = """        if seo_plugin != 'none' and doc.seo_metadata:
            if seo_plugin == 'rankmath':
                payload["rank_math_focus_keyword"] = doc.seo_metadata.focus_keyword
                payload["rank_math_description"] = doc.seo_metadata.meta_description
                if doc.seo_metadata.meta_title:
                    payload["rank_math_title"] = doc.seo_metadata.meta_title
            elif seo_plugin == 'yoast':
                payload["yoast_wpseo_focuskw"] = doc.seo_metadata.focus_keyword
                payload["yoast_wpseo_metadesc"] = doc.seo_metadata.meta_description
                if doc.seo_metadata.meta_title:
                    payload["yoast_wpseo_title"] = doc.seo_metadata.meta_title"""

new_seo_inject = """        if seo_plugin != 'none' and doc.seo_metadata:
            if "meta" not in payload:
                payload["meta"] = {}
            if seo_plugin == 'rankmath':
                payload["meta"]["rank_math_focus_keyword"] = doc.seo_metadata.focus_keyword
                payload["meta"]["rank_math_description"] = doc.seo_metadata.meta_description
                if doc.seo_metadata.meta_title:
                    payload["meta"]["rank_math_title"] = doc.seo_metadata.meta_title
            elif seo_plugin == 'yoast':
                payload["meta"]["_yoast_wpseo_focuskw"] = doc.seo_metadata.focus_keyword
                payload["meta"]["_yoast_wpseo_metadesc"] = doc.seo_metadata.meta_description
                if doc.seo_metadata.meta_title:
                    payload["meta"]["_yoast_wpseo_title"] = doc.seo_metadata.meta_title"""

wp_content = wp_content.replace(old_seo_inject, new_seo_inject)

with open(wp_agent_py, 'w', encoding='utf-8') as f:
    f.write(wp_content)

print("wordpress_agent.py updated for SEO meta injection!")
