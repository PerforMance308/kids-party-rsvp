import urllib.request
import urllib.error
import json

base_url = 'http://127.0.0.1:3000'
endpoints = [
    ('/', 200),
    ('/api/health', 200),
    ('/api/contact', 405), # POST only maybe?
    ('/api/db-test', 401),
    ('/api/payment/debug', 401),
    ('/api/cron/daily', 401),
    ('/en/login', 200),
    ('/en/privacy', 200)
]

print('Testing endpoints...')
for path, expected in endpoints:
    url = base_url + path
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
    except urllib.error.HTTPError as e:
        status = e.code
    except Exception as e:
        status = str(e)
    
    status_str = f'{status}'
    if status == expected:
        print(f'✅ {path:<25} -> {status_str:<5} (Expected: {expected})')
    else:
        print(f'❌ {path:<25} -> {status_str:<5} (Expected: {expected})')
