import json
import os
import re
import random
from typing import Dict, Any, Optional
from bs4 import BeautifulSoup
from utils.logger import get_logger
from utils.http import request_with_retry
from config.settings import settings
from agents.content_agent import ArticleDraft

logger = get_logger("wordpress_agent")

class WordPressAgent:
    def __init__(self, user_settings: dict):
        if not user_settings.get('wp_url') or not user_settings.get('wp_username') or not user_settings.get('wp_app_password'):
            raise ValueError("WordPress credentials not fully configured for this user.")
        self.wp_url = user_settings['wp_url'].rstrip('/')
        self.auth = (user_settings['wp_username'], user_settings['wp_app_password'])
        self.theme_type = user_settings.get('theme_type', 'standard')
        self.seo_plugin = user_settings.get('seo_plugin', 'none')
        
    def upload_media(self, file_path: str) -> Optional[Dict[str, Any]]:
        """
        Uploads a local image to the WordPress Media Library.
        Returns a dict with 'id' and 'url' of the uploaded media, or None if failed.
        """
        if not file_path or not os.path.exists(file_path):
            return None
            
        url = f"{self.wp_url}/wp-json/wp/v2/media"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
        
        try:
            filename = os.path.basename(file_path)
            with open(file_path, 'rb') as f:
                files = {'file': (filename, f, 'image/jpeg')}
                response = request_with_retry('POST', url, files=files, headers=headers, auth=self.auth, timeout=30)
                
            result = response.json()
            
            media_id = result.get('id')
            media_url = result.get('source_url')
            
            if media_id and media_url:
                logger.info(f"Successfully uploaded media: {filename} -> ID: {media_id}")
                return {"id": media_id, "url": media_url}
        except Exception as e:
            logger.error(f"Failed to upload media {filename} to WordPress: {e}")
            
        return None
        
    def push_draft(self, draft: ArticleDraft, images: Dict[str, str] = None) -> Optional[str]:
        """
        Pushes an ArticleDraft to WordPress.
        Uploads images, injects them into the content, and sets the featured image.
        Returns the new Article ID or None if failed.
        """
        logger.info(f"Pushing draft to WordPress for: {draft.title}")
        
        if images is None:
            images = {}
            
        # 1. Upload Images to WordPress
        wp_images = {}
        for key, path in images.items():
            result = self.upload_media(path)
            if result:
                wp_images[key] = result
                
        rg_notice = "\n\n<hr/>\n<p><strong>Responsible Gambling Notice:</strong> Please gamble responsibly. Only bet what you can afford to lose. If you need help, seek professional advice.</p>"
        final_body = draft.body + rg_notice
        
        # 2. Inject Images using BeautifulSoup
        soup = BeautifulSoup(final_body, 'html.parser')
        
        def create_img_tag(url: str, alt: str):
            tag = soup.new_tag('img', src=url, alt=alt, width='87', height='172')
            tag['style'] = 'display: block; margin: 0 auto; margin-bottom: 20px; border-radius: 8px;'
            return tag
            
        # Description Image: bottom of "What is {game_name}?" section.
        if 'description' in wp_images:
            # Find the "What is..." h2, then find the next h2, insert before it
            h2_tags = soup.find_all('h2')
            target_h2 = None
            next_h2 = None
            for i, tag in enumerate(h2_tags):
                if "what is" in tag.get_text().lower():
                    target_h2 = tag
                    if i + 1 < len(h2_tags):
                        next_h2 = h2_tags[i + 1]
                    break
            
            if target_h2:
                img_tag = create_img_tag(wp_images['description']['url'], f"{draft.title} Description")
                if next_h2:
                    next_h2.insert_before(img_tag)
                else:
                    soup.append(img_tag)
                    
        # Login Image: immediately below "How to Get Started on..."
        if 'login' in wp_images:
            for tag in soup.find_all('h2'):
                if "how to get started" in tag.get_text().lower():
                    img_tag = create_img_tag(wp_images['login']['url'], f"{draft.title} Login")
                    tag.insert_after(img_tag)
                    break
                    
        # Transaction Image: immediately below "How to Deposit & Withdraw Money"
        if 'transaction' in wp_images:
            for tag in soup.find_all('h2'):
                if "deposit & withdraw" in tag.get_text().lower() or "transaction" in tag.get_text().lower():
                    img_tag = create_img_tag(wp_images['transaction']['url'], f"{draft.title} Transaction")
                    tag.insert_after(img_tag)
                    break
                    
        final_body = str(soup)
        
        # Featured Image: embed at the top of the article
        if 'featured' in wp_images:
            img_tag = create_img_tag(wp_images['featured']['url'], f"{draft.title} Featured")
            final_body = str(img_tag) + final_body
        
        payload = {
            "title": draft.title,
            "content": final_body,
            "status": "draft",
            "categories": [2, 4, 7],
            "excerpt": draft.excerpt if hasattr(draft, 'excerpt') and draft.excerpt else ""
        }
        
        if 'featured' in wp_images:
            payload['featured_media'] = wp_images['featured']['id']
        
        url = f"{self.wp_url}/wp-json/wp/v2/posts"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        
        try:
            response = request_with_retry('POST', url, json=payload, headers=headers, auth=self.auth, timeout=15)
            
            try:
                data = response.json()
            except Exception as e:
                logger.error(f"Failed to parse JSON from WordPress. Status: {response.status_code}, Response: {response.text[:500]}")
                return None
                
            article_id = str(data.get('id', ''))
            
            # Theme Specific Meta Updates
            if self.theme_type == 'appyn':
                appyn_desc = draft.excerpt if hasattr(draft, 'excerpt') and draft.excerpt else ""
                p_match = re.search(r'<p>(.*?)</p>', final_body, re.IGNORECASE | re.DOTALL)
                if p_match:
                    clean_p = re.sub(r'<[^>]+>', '', p_match.group(1)).strip()
                    if clean_p:
                        appyn_desc = clean_p[:300] + ('...' if len(clean_p) > 300 else '')

                # Flatten the dictionary for PHP $_POST array syntax
                meta_payload = {
                    "post_id": int(article_id),
                    "datos_informacion[app_status]": "new",
                    "datos_informacion[descripcion]": appyn_desc,
                    "datos_informacion[version]": random.choice(["1.2", "1.5.4", "2.0.1", "3.1.2", "4.0"]),
                    "datos_informacion[tamano]": random.choice(["15MB", "32MB", "48MB", "Varies with device", "64MB"]),
                    "datos_informacion[fecha_actualizacion]": "Just now",
                    "datos_informacion[requerimientos]": "Android",
                    "datos_informacion[descargas]": random.choice(["10k+", "50k+", "100k+", "500k+", "1M+"]),
                    "datos_informacion[categoria_app]": "GAMES",
                    "datos_informacion[os]": "ANDROID",
                    "datos_informacion[offer][amount]": "",
                    "datos_informacion[offer][currency]": "USD",
                    "datos_download[option]": "links",
                    "datos_download[type]": "apk",
                    "datos_download[0][link]": "#",
                    "datos_download[0][texto]": "DOWNLOAD APK"
                }
                meta_url = f"{self.wp_url}/wp-json/appyn/v1/update-meta"
                try:
                    # Use data= instead of json= to force application/x-www-form-urlencoded
                    # This ensures $_POST is populated on the PHP side.
                    request_with_retry('POST', meta_url, data=meta_payload, headers=headers, auth=self.auth, timeout=15)
                    logger.info("Successfully updated Appyn meta.")
                except Exception as e:
                    logger.warning(f"Failed to update Appyn meta (Does this site have the Appyn theme?): {e}")
            else:
                logger.info(f"Skipping Appyn meta update. Theme is set to {self.theme_type}.")
            
            # SEO Plugin Specific Updates
            if hasattr(draft, 'focus_keyword') and draft.focus_keyword:
                meta_desc = draft.excerpt if hasattr(draft, 'excerpt') and draft.excerpt else ""
                if self.seo_plugin == 'rankmath':
                    rankmath_payload = {
                        "objectType": "post",
                        "objectID": int(article_id),
                        "meta": {
                            "rank_math_focus_keyword": draft.focus_keyword,
                            "rank_math_description": meta_desc
                        }
                    }
                    rankmath_url = f"{self.wp_url}/wp-json/rankmath/v1/updateMeta"
                    try:
                        rm_resp = request_with_retry('POST', rankmath_url, json=rankmath_payload, headers=headers, auth=self.auth, timeout=15)
                        logger.info(f"RankMath updateMeta response: {rm_resp.status_code}")
                    except Exception as e:
                        logger.error(f"Failed to update RankMath meta: {e}")
                elif self.seo_plugin == 'yoast':
                    yoast_url = f"{self.wp_url}/wp-json/wp/v2/posts/{article_id}"
                    yoast_payload = {
                        "meta": {
                            "yoast_wpseo_focuskw": draft.focus_keyword,
                            "yoast_wpseo_metadesc": meta_desc
                        }
                    }
                    try:
                        request_with_retry('POST', yoast_url, json=yoast_payload, headers=headers, auth=self.auth, timeout=15)
                        logger.info("Successfully updated Yoast focus keyword.")
                    except Exception as e:
                        logger.error(f"Failed to update Yoast meta: {e}")
                else:
                    logger.info(f"Skipping SEO meta update. Plugin is set to {self.seo_plugin}.")
            logger.info(f"Successfully pushed draft. WP Post ID: {article_id}")
            return article_id
        except Exception as e:
            logger.error(f"Failed to push draft to WordPress: {e}")
            return None
