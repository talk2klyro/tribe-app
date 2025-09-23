# /api/magic-login.py
import os
import json
from http.server import BaseHTTPRequestHandler
from magic_admin import Magic

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # 1. Get the DID Token from the request body.
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        body = json.loads(post_data.decode('utf-8'))
        did_token = body.get('didToken')

        # 2. Get the Magic Secret Key from the environment variables.
        MAGIC_SECRET_KEY = os.environ.get("MAGIC_SECRET_KEY")

        if not did_token or not MAGIC_SECRET_KEY:
            self.send_response(400)
            self.end_headers()
            self.wfile.write(b"Error: Missing DID token or API key.")
            return

        try:
            # 3. Initialize Magic Admin SDK and validate the token.
            magic = Magic(api_secret_key=MAGIC_SECRET_KEY)
            issuer = magic.Token.get_issuer(did_token=did_token)

            # 4. Get the user's metadata from Magic.
            user_info = magic.User.get_metadata_by_issuer(issuer=issuer)
            
            # 5. Send a success response with the user's info.
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response_data = {
                'issuer': user_info['issuer'],
                'public_address': user_info['public_address'],
                'email': user_info['email']
            }
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
        
        except Exception as e:
            self.send_response(401)
            self.end_headers()
            self.wfile.write(f'Error validating token: {str(e)}'.encode('utf-8'))
