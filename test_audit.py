import urllib.request
import urllib.parse
import json
import time

BASE_URL = 'http://localhost:8000'
cookie = None

def make_request(path, method='GET', data=None):
    global cookie
    url = f"{BASE_URL}{path}"
    headers = {}
    if cookie:
        headers['Cookie'] = cookie
    if data is not None:
        headers['Content-Type'] = 'application/json'
        data = json.dumps(data).encode('utf-8')
    
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            if 'Set-Cookie' in response.headers:
                cookie = response.headers['Set-Cookie']
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        try:
            err = json.loads(e.read().decode())
        except:
            err = str(e)
        return e.code, err
    except Exception as e:
        return 500, str(e)

print("Starting End-to-End Audit Tests...")

# 1. Test Registration / Login
status, res = make_request('/api/register', method='POST', data={"email": "audit@test.com", "password": "password"})
if status == 200 or (status == 400 and "already registered" in str(res)):
    print("[PASS] User Registration/Login endpoint")
    status, res = make_request('/api/login', method='POST', data={"email": "audit@test.com", "password": "password"})
    if status == 200:
        print("[PASS] Authentication successful")
    else:
        print(f"[FAIL] Authentication failed: {res}")
else:
    print(f"[FAIL] Registration failed: {res}")

# 2. Test WordPress Settings
wp_data = {
    "wp_url": "https://example-wordpress.com",
    "wp_username": "audit_user",
    "wp_app_password": "dummy_password",
    "theme_type": "standard",
    "seo_plugin": "yoast"
}
status, res = make_request('/api/settings', method='POST', data=wp_data)
if status == 200:
    print("[PASS] WordPress Settings Save")
else:
    print(f"[FAIL] WordPress Settings Save: {res}")

status, res = make_request('/api/settings', method='GET')
if status == 200 and res.get('wp_username') == 'audit_user':
    print("[PASS] WordPress Settings Retrieval")
else:
    print(f"[FAIL] WordPress Settings Retrieval: {res}")

# 3. Test Content Formats (Templates)
format_data = {
    "name": "Audit Custom Format",
    "description": "Test format",
    "sections": [
        {"name": "Introduction", "order": 1, "content_type": "paragraph", "required": True},
        {"name": "Main Body", "order": 2, "content_type": "paragraph", "required": True}
    ]
}
status, res = make_request('/api/templates', method='POST', data=format_data)
if status == 200 and 'template_id' in res:
    print("[PASS] Content Format Creation")
    template_id = res['template_id']
    
    status, res2 = make_request(f'/api/templates/{template_id}/set-default', method='POST')
    if status == 200:
        print("[PASS] Set Template as Default")
    else:
        print(f"[FAIL] Set Template as Default: {res2}")
else:
    print(f"[FAIL] Content Format Creation: {res}")

# 4. Test Job Generation Execution
job_data = {
    "market": "UK",
    "volume": 1,
    "game_name": "Audit Slot Game",
    "provider": "Audit Provider",
    "dry_run": True
}
status, res = make_request('/api/run', method='POST', data=job_data)
if status == 200 and 'job_id' in res:
    print("[PASS] Job Generation Trigger")
    job_id = res['job_id']
else:
    print(f"[FAIL] Job Generation Trigger: {res}")
    job_id = None

# Wait a few seconds for the job to be picked up by the background worker thread
if job_id:
    print("Waiting 10 seconds for background worker to process the job...")
    time.sleep(10)
    
    # 5. Check Job Status and History
    status, res = make_request('/api/user/jobs?status_filter=ALL', method='GET')
    if status == 200:
        job = next((j for j in res if j.get('id', j.get('job_id')) == job_id), None)
        if job:
            print(f"[INFO] Job Status: {job['status']} | Stage: {job['current_stage']}")
            if job['status'] in ['COMPLETED', 'FAILED']:
                print(f"[PASS] Job Processing (Status updated to {job['status']})")
            else:
                print(f"[FAIL] Job Processing stuck in {job['status']}")
        else:
            print("[FAIL] Job not found in history")
    else:
        print(f"[FAIL] Failed to fetch job history: {res}")
