import os
import subprocess
import shutil
import sys
from fastapi import FastAPI, BackgroundTasks, File, Form, UploadFile, Depends, HTTPException, status, Response, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional

from utils.db import get_db_connection, init_db
from dashboard.auth import hash_password, verify_password, generate_session_token, get_current_user_id

# Initialize app and DB
init_db()
app = FastAPI(title="SEO Automation Dashboard")

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.getenv("DATA_DIR", os.path.join(BASE_DIR, 'data'))
DB_PATH = os.path.join(DATA_DIR, 'history.db')
STATIC_DIR = os.path.join(os.path.dirname(__file__), 'static')

# Ensure static directory exists
os.makedirs(STATIC_DIR, exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

class RunConfig(BaseModel):
    market: str = "UK"
    volume: int = 2
    dry_run: bool = True

class UserCreate(BaseModel):
    email: str
    password: str

class SettingsUpdate(BaseModel):
    wp_url: str
    wp_username: str
    wp_app_password: str
    theme_type: str = "standard"
    seo_plugin: str = "none"

@app.get("/")
def read_root():
    index_file = os.path.join(STATIC_DIR, 'index.html')
    if os.path.exists(index_file):
        with open(index_file, 'r', encoding='utf-8') as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>Welcome to SEO Automation Dashboard</h1><p>index.html not found in static folder.</p>")

@app.get("/login.html")
def login_page():
    file_path = os.path.join(STATIC_DIR, 'login.html')
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>Not Found</h1>", status_code=404)

@app.get("/register.html")
def register_page():
    file_path = os.path.join(STATIC_DIR, 'register.html')
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>Not Found</h1>", status_code=404)

@app.post("/api/register")
def register_user(user: UserCreate):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            hashed_pw = hash_password(user.password)
            cursor.execute("INSERT INTO users (email, password_hash) VALUES (?, ?)", (user.email, hashed_pw))
            user_id = cursor.lastrowid
            
            # Create empty settings
            cursor.execute("INSERT INTO user_settings (user_id) VALUES (?)", (user_id,))
            conn.commit()
            
            return {"message": "User registered successfully"}
    except Exception as e:
        if "UNIQUE constraint failed" in str(e):
            raise HTTPException(status_code=400, detail="Email already registered")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/login")
def login(user: UserCreate, response: Response):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, password_hash FROM users WHERE email = ?", (user.email,))
        row = cursor.fetchone()
        
        if not row or not verify_password(user.password, row['password_hash']):
            raise HTTPException(status_code=401, detail="Incorrect email or password")
            
        token = generate_session_token()
        cursor.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, row['id']))
        conn.commit()
        
        response.set_cookie(key="session_token", value=token, httponly=True, max_age=604800) # 1 week
        return {"message": "Login successful"}

@app.post("/api/logout")
def logout(response: Response, user_id: int = Depends(get_current_user_id), request: Request = None):
    token = request.cookies.get("session_token")
    if token:
        with get_db_connection() as conn:
            conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
            conn.commit()
    response.delete_cookie("session_token")
    return {"message": "Logout successful"}

@app.post("/api/settings")
def update_settings(settings: SettingsUpdate, user_id: int = Depends(get_current_user_id)):
    with get_db_connection() as conn:
        conn.execute("""
            UPDATE user_settings 
            SET wp_url=?, wp_username=?, wp_app_password=?, theme_type=?, seo_plugin=?
            WHERE user_id=?
        """, (settings.wp_url, settings.wp_username, settings.wp_app_password, settings.theme_type, settings.seo_plugin, user_id))
        conn.commit()
    return {"message": "Settings updated"}

@app.get("/api/settings")
def get_settings(user_id: int = Depends(get_current_user_id)):
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT wp_url, wp_username, wp_app_password, theme_type, seo_plugin FROM user_settings WHERE user_id = ?", (user_id,))
        row = cursor.fetchone()
        return dict(row) if row else {}

@app.get("/api/stats")
def get_stats(user_id: int = Depends(get_current_user_id)):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM publish_history WHERE user_id = ?", (user_id,))
            total_published = cursor.fetchone()[0]
        
        return {"total_published": total_published, "total_facts": 0}
    except Exception as e:
        return {"error": str(e), "total_published": 0, "total_facts": 0}

@app.get("/api/history")
def get_history(user_id: int = Depends(get_current_user_id)):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT game_name, provider, article_id, published_at FROM publish_history WHERE user_id = ? ORDER BY published_at DESC LIMIT 50", (user_id,))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    except Exception as e:
        return {"error": str(e)}

from utils.db_models import SessionLocal, ContentDraft, WordPressSite
import json

@app.get("/api/drafts")
def get_drafts(user_id: int = Depends(get_current_user_id)):
    try:
        with SessionLocal() as db:
            drafts = db.query(ContentDraft).filter(ContentDraft.user_id == user_id, ContentDraft.status == "draft").all()
            return [
                {
                    "id": d.id,
                    "game_name": d.game_name,
                    "provider": d.provider,
                    "created_at": d.created_at,
                    "document": json.loads(d.document_json) if d.document_json else None
                }
                for d in drafts
            ]
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/publish/{draft_id}")
def publish_draft(draft_id: int, user_id: int = Depends(get_current_user_id)):
    try:
        from core.universal_model import ContentDocument
        from agents.wordpress_agent import WordPressPublisher
        
        with SessionLocal() as db:
            draft_record = db.query(ContentDraft).filter(ContentDraft.id == draft_id, ContentDraft.user_id == user_id).first()
            if not draft_record:
                raise HTTPException(status_code=404, detail="Draft not found")
                
            if draft_record.status == "published":
                raise HTTPException(status_code=400, detail="Draft is already published")
                
            site = db.query(WordPressSite).filter(WordPressSite.id == draft_record.site_id).first()
            if not site:
                raise HTTPException(status_code=400, detail="No WordPress site connected to this draft")
                
            doc_data = json.loads(draft_record.document_json)
            doc = ContentDocument(**doc_data)
            
            site_profile = {
                "site_url": site.site_url,
                "username": site.username,
                "app_password": site.app_password,
                "editor_type": site.editor_type,
                "seo_plugin": site.seo_plugin,
                "active_theme": site.active_theme
            }
            
            wp_publisher = WordPressPublisher(site_profile=site_profile)
            article_id = wp_publisher.publish(doc)
            
            if not article_id:
                raise HTTPException(status_code=500, detail="Failed to publish to WordPress. Check logs.")
                
            # Update Draft
            draft_record.status = "published"
            
            # Insert into History
            db.execute(
                "INSERT INTO publish_history (user_id, game_name, provider, article_id) VALUES (?, ?, ?, ?)",
                (user_id, draft_record.game_name, draft_record.provider, article_id)
            )
            
            db.commit()
            
            # Optional: Update Airtable if it was connected (Would need the record ID from candidate)
            # Currently we don't save the airtable record id in ContentDraft, so we skip it for now.
            
            return {"message": f"Successfully published. Post ID: {article_id}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def run_orchestrator(config: RunConfig, user_id: int):
    # Run the orchestrator script using the same Python executable, passing user_id
    cmd = [
        sys.executable, "-m", "scripts.orchestrator",
        "--market", config.market,
        "--volume", str(config.volume),
        "--user-id", str(user_id)
    ]
    if config.dry_run:
        cmd.append("--dry-run")
    log_file = os.path.join(BASE_DIR, 'data', 'orchestrator.log')
    with open(log_file, 'a') as f:
        subprocess.Popen(cmd, cwd=BASE_DIR, stdout=f, stderr=subprocess.STDOUT)

@app.post("/api/run")
def trigger_run(config: RunConfig, background_tasks: BackgroundTasks, user_id: int = Depends(get_current_user_id)):
    background_tasks.add_task(run_orchestrator, config, user_id)
    return {"message": "Automation run triggered in background", "config": config.dict()}

@app.post("/api/links")
async def add_link(
    url: str = Form(...),
    game_name: str = Form(""),
    provider: str = Form(""),
    featured_image: UploadFile = File(None),
    description_image: UploadFile = File(None),
    login_image: UploadFile = File(None),
    transaction_image: UploadFile = File(None),
    user_id: int = Depends(get_current_user_id)
):
    try:
        from dashboard.auth import get_user_settings
        from agents.wordpress_agent import WordPressPublisher
        
        user_settings = get_user_settings(user_id)
        if not user_settings:
            return {"error": "User API settings missing. Please configure settings first."}
            
        site_profile = {
            "site_url": user_settings.get('wp_url', ''),
            "username": user_settings.get('wp_username', ''),
            "app_password": user_settings.get('wp_app_password', ''),
            "editor_type": user_settings.get('editor_type', 'classic'),
            "seo_plugin": user_settings.get('seo_plugin', 'none'),
            "active_theme": user_settings.get('theme_type', 'standard')
        }
            
        wp_publisher = WordPressPublisher(site_profile=site_profile)
        
        # Save temp files and upload to WP to get public URLs
        temp_dir = os.path.join(BASE_DIR, 'data', 'tmp_uploads')
        os.makedirs(temp_dir, exist_ok=True)
        
        def process_upload(upload_file: UploadFile):
            if not upload_file or not upload_file.filename:
                return None
            
            temp_path = os.path.join(temp_dir, upload_file.filename)
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(upload_file.file, buffer)
                
            wp_data = wp_publisher.upload_media(temp_path)
            if wp_data and 'url' in wp_data:
                return wp_data['url']
            return None

        featured_url = process_upload(featured_image) if featured_image else None
        desc_url = process_upload(description_image) if description_image else None
        login_url = process_upload(login_image) if login_image else None
        trans_url = process_upload(transaction_image) if transaction_image else None
        
        with get_db_connection() as conn:
            conn.execute("""
                INSERT INTO links (user_id, url, game_name, provider, featured_image, description_image, login_image, transaction_image)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, url, game_name, provider, featured_url, desc_url, login_url, trans_url))
            conn.commit()
            
        return {"message": "Link and images successfully queued in internal database!"}
    except Exception as e:
        return {"error": f"Failed to save link: {str(e)}"}

@app.get("/api/links/status")
def get_links_status(user_id: int = Depends(get_current_user_id)):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id, url, game_name, provider, status, status_reason, created_at FROM links WHERE user_id = ? ORDER BY created_at DESC LIMIT 50", (user_id,))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/logs")
def get_logs():
    log_file = os.path.join(BASE_DIR, 'data', 'orchestrator.log')
    if not os.path.exists(log_file):
        return {"logs": []}
        
    try:
        # Read the last 100 lines
        with open(log_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        return {"logs": lines[-100:]}
    except Exception as e:
        return {"error": str(e)}
