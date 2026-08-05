import os
import sqlite3
import subprocess
import shutil
import sys
from fastapi import FastAPI, BackgroundTasks, File, Form, UploadFile
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

# Initialize app
app = FastAPI(title="SEO Automation Dashboard")

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, 'data', 'history.db')
STATIC_DIR = os.path.join(os.path.dirname(__file__), 'static')

# Ensure static directory exists
os.makedirs(STATIC_DIR, exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

class RunConfig(BaseModel):
    market: str = "UK"
    volume: int = 2
    dry_run: bool = True

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.get("/")
def read_root():
    index_file = os.path.join(STATIC_DIR, 'index.html')
    if os.path.exists(index_file):
        with open(index_file, 'r', encoding='utf-8') as f:
            return HTMLResponse(content=f.read())
    return HTMLResponse("<h1>Welcome to SEO Automation Dashboard</h1><p>index.html not found in static folder.</p>")

@app.get("/api/stats")
def get_stats():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM publish_history")
        total_published = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM trusted_facts")
        total_facts = cursor.fetchone()[0]
        
        conn.close()
        return {"total_published": total_published, "total_facts": total_facts}
    except Exception as e:
        return {"error": str(e), "total_published": 0, "total_facts": 0}

@app.get("/api/history")
def get_history():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT game_name, provider, article_id, published_at FROM publish_history ORDER BY published_at DESC LIMIT 50")
        rows = cursor.fetchall()
        conn.close()
        return [dict(row) for row in rows]
    except Exception as e:
        return {"error": str(e)}

def run_orchestrator(config: RunConfig):
    # Run the orchestrator script using the same Python executable
    cmd = [
        sys.executable, "-m", "scripts.orchestrator",
        "--market", config.market,
        "--volume", str(config.volume)
    ]
    if config.dry_run:
        cmd.append("--dry-run")
        
    subprocess.Popen(cmd, cwd=BASE_DIR)

@app.post("/api/run")
def trigger_run(config: RunConfig, background_tasks: BackgroundTasks):
    background_tasks.add_task(run_orchestrator, config)
    return {"message": "Automation run triggered in background", "config": config.dict()}

@app.post("/api/airtable/link")
async def add_airtable_link(
    url: str = Form(...),
    game_name: str = Form(""),
    provider: str = Form(""),
    featured_image: UploadFile = File(None),
    description_image: UploadFile = File(None),
    login_image: UploadFile = File(None),
    transaction_image: UploadFile = File(None)
):
    try:
        from config.settings import settings
        from pyairtable import Api
        from agents.wordpress_agent import WordPressAgent
        
        wp_agent = WordPressAgent()
        
        # Save temp files and upload to WP to get public URLs
        temp_dir = os.path.join(BASE_DIR, 'data', 'tmp_uploads')
        os.makedirs(temp_dir, exist_ok=True)
        
        def process_upload(upload_file: UploadFile):
            if not upload_file or not upload_file.filename:
                return None
            
            temp_path = os.path.join(temp_dir, upload_file.filename)
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(upload_file.file, buffer)
                
            wp_data = wp_agent.upload_media(temp_path)
            if wp_data and 'url' in wp_data:
                return [{"url": wp_data['url']}]
            return None

        fields = {
            "Link": url,
            "Game Name": game_name,
            "Provider": provider,
            "Status": "New"
        }
        
        if featured_image: fields["Featured Image"] = process_upload(featured_image)
        if description_image: fields["Description Image"] = process_upload(description_image)
        if login_image: fields["Login & Registration Image"] = process_upload(login_image)
        if transaction_image: fields["Transaction Image"] = process_upload(transaction_image)
        
        # Remove empty keys
        fields = {k: v for k, v in fields.items() if v is not None}
        
        api = Api(settings.airtable_api_key)
        table = api.table(settings.airtable_base_id, settings.airtable_table_name)
        table.create(fields)
        return {"message": "Link and images successfully added to Airtable!"}
    except Exception as e:
        return {"error": f"Failed to add to Airtable: {str(e)}"}

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
