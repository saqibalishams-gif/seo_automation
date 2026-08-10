import sqlite3
import requests
from requests.auth import HTTPBasicAuth
import sys

db_path = r'd:\Seo_automation\data\history.db'
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()

cursor.execute('SELECT * FROM wordpress_sites LIMIT 1')
site = cursor.fetchone()
if site:
    url = f"{site['site_url'].rstrip('/')}/wp-json/wp/v2/posts"
    params = {'per_page': 1, 'status': 'any'}
    auth = HTTPBasicAuth(site['username'], site['app_password'])
    print('Fetching from', url)
    res = requests.get(url, params=params, auth=auth)
    if res.status_code == 200:
        post = res.json()[0]
        print('Post ID:', post['id'])
        print('Post Status:', post['status'])
        print('Meta keys available:', list(post.get('meta', {}).keys()))
        print('RankMath Focus Keyword:', post.get('meta', {}).get('rank_math_focus_keyword'))
        
        html = post.get('content', {}).get('rendered', '')
        print('Content Length:', len(html))
        print('Images inside Content HTML:', html.count('<img'))
    else:
        print('Failed:', res.status_code, res.text)
