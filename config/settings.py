import os
from dotenv import load_dotenv

# Load environment variables from .env file (if exists)
load_dotenv()

def get_env_var(key: str, required: bool = True) -> str:
    """
    Get an environment variable, failing fast if required and missing.
    """
    value = os.getenv(key)
    if required and not value:
        raise ValueError(f"CRITICAL ERROR: Required environment variable '{key}' is missing or empty.")
    return value or ""

class Settings:
    @property
    def groq_api_key(self) -> str:
        return get_env_var("GROQ_API_KEY", required=True)
    
    @property
    def wp_url(self) -> str:
        return get_env_var("WP_URL", required=True)
        
    @property
    def wp_username(self) -> str:
        return get_env_var("WP_USERNAME", required=True)
        
    @property
    def wp_app_password(self) -> str:
        return get_env_var("WP_APP_PASSWORD", required=True)

    @property
    def casino_data_api_key(self) -> str:
        return get_env_var("CASINO_DATA_API_KEY", required=True)

    @property
    def discovery_sources(self) -> list:
        # Configurable list of official discovery sources
        return [
            "https://www.pragmaticplay.com/en/news/",
            "https://www.playngo.com/news",
            "https://netent.com/en/news/",
            "https://relax-gaming.com/news",
            "https://www.hacksawgaming.com/news",
            "https://firstlookgames.com/releases" # If available
        ]
        
    @property
    def airtable_api_key(self) -> str:
        return get_env_var("AIRTABLE_API_KEY", required=True)
        
    @property
    def airtable_base_id(self) -> str:
        return get_env_var("AIRTABLE_BASE_ID", required=True)
        
    @property
    def airtable_table_name(self) -> str:
        value = os.getenv("AIRTABLE_TABLE_NAME")
        return value if value else "Links"

# Global settings instance
settings = Settings()
