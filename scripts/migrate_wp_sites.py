import os
import sys

# Add project root to sys path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.db_models import SessionLocal, UserSettings, WordPressSite

def migrate_settings():
    db = SessionLocal()
    try:
        settings_list = db.query(UserSettings).all()
        migrated_count = 0
        
        for settings in settings_list:
            if settings.wp_url and settings.wp_username and settings.wp_app_password:
                # Check if site already exists for this user
                existing_site = db.query(WordPressSite).filter(
                    WordPressSite.user_id == settings.user_id,
                    WordPressSite.site_url == settings.wp_url
                ).first()
                
                if not existing_site:
                    new_site = WordPressSite(
                        user_id=settings.user_id,
                        site_url=settings.wp_url,
                        username=settings.wp_username,
                        app_password=settings.wp_app_password,
                        active_theme="unknown",
                        editor_type="classic",
                        seo_plugin="none",
                        capabilities="{}"
                    )
                    db.add(new_site)
                    migrated_count += 1
        
        db.commit()
        print(f"Migration completed successfully. Migrated {migrated_count} legacy WordPress configurations.")
    except Exception as e:
        print(f"Migration failed: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    migrate_settings()
