import requests
from requests.auth import HTTPBasicAuth
import json

url = 'https://apkgetin.com.pk/wp-json/rankmath/v1/updateMeta'
auth = HTTPBasicAuth('admin', 'vquA sOMd S8Va zggU rA21 hcSL')
headers = {'Content-Type': 'application/json'}

payload = {
    "objectType": "post",
    "objectID": 445,
    "meta": {
        "rank_math_focus_keyword": "TEST KEYWORD",
        "rank_math_description": "TEST DESCRIPTION"
    }
}

print('Sending payload:', json.dumps(payload))
resp = requests.post(url, json=payload, headers=headers, auth=auth)
print('Status:', resp.status_code)
print('Response text:', resp.text)
