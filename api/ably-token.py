# /api/ably-token.py
import os
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse
from ably import AblyRest

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # 1. Get the Ably API key from the secure environment variable.
        ABLY_API_KEY = os.environ.get("ABLY_API_KEY")

        if not ABLY_API_KEY:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(b"Error: ABLY_API_KEY not set.")
            return

        # 2. Initialize the Ably client with the private key.
        ably = AblyRest(ABLY_API_KEY)

        try:
            # 3. Request a temporary token from Ably.
            token_details = ably.auth.request_token()
            token = token_details.token

            # 4. Send the token back as a JSON response.
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(f'{{"token": "{token}"}}'.encode('utf-8'))
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f'Error generating token: {str(e)}'.encode('utf-8'))

# To run this, you will need to install the Ably Python SDK: `pip install ably`.
