import json
import requests
from typing import Dict, Any, Optional
from utils.logger import get_logger

logger = get_logger("wp_discovery")

class WordPressDiscovery:
    def __init__(self, wp_url: str, username: str, app_password: str):
        self.wp_url = wp_url.rstrip('/')
        self.auth = (username, app_password)
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json'
        }
        
    def probe_site(self) -> Dict[str, Any]:
        """
        Probes the WordPress site to detect capabilities, active theme, and plugins.
        """
        logger.info(f"Starting site discovery for {self.wp_url}")
        profile = {
            "active_theme": "unknown",
            "editor_type": "classic",
            "seo_plugin": "none",
            "capabilities": {
                "rest_api": False,
                "media_upload": False,
                "posts": False
            }
        }
        
        # Check basic REST API access and user capability
        try:
            r = requests.get(f"{self.wp_url}/wp-json/wp/v2/users/me", headers=self.headers, auth=self.auth, timeout=10)
            if r.status_code == 200:
                profile["capabilities"]["rest_api"] = True
        except Exception as e:
            logger.warning(f"REST API probe failed: {e}")
            return profile

        # Check Active Theme (requires elevated privileges, but we can infer from frontend or /themes endpoint if available)
        try:
            r = requests.get(f"{self.wp_url}/wp-json/wp/v2/themes?status=active", headers=self.headers, auth=self.auth, timeout=10)
            if r.status_code == 200 and r.json():
                profile["active_theme"] = r.json()[0].get("stylesheet", "unknown")
        except Exception:
            pass
            
        # Detect SEO Plugins via namespace sniffing
        try:
            r = requests.get(f"{self.wp_url}/wp-json/", headers=self.headers, auth=self.auth, timeout=10)
            if r.status_code == 200:
                namespaces = r.json().get("namespaces", [])
                if "rankmath/v1" in namespaces:
                    profile["seo_plugin"] = "rankmath"
                elif "yoast/v1" in namespaces:
                    profile["seo_plugin"] = "yoast"
                
                if "wp/v2" in namespaces:
                    profile["capabilities"]["posts"] = True
                    profile["capabilities"]["media_upload"] = True
        except Exception:
            pass
            
        logger.info(f"Discovery complete. Profile: {profile}")
        return profile
