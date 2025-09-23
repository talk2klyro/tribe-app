# /api/upload.py
import os
import json
import cloudinary
import cloudinary.uploader
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse

# This line is crucial. It pulls your CLOUDINARY_URL from the environment.
cloudinary.config(
  cloud_name = os.environ.get('CLOUDINARY_URL').split('@')[1],
  api_key = os.environ.get('CLOUDINARY_URL').split('//')[1].split(':')[0],
  api_secret = os.environ.get('CLOUDINARY_URL').split(':')[2].split('@')[0],
  secure = True
)

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # 1. Get the file data from the request
            content_length = int(self.headers['Content-Length'])
            file_data = self.rfile.read(content_length)

            # 2. Upload the file to Cloudinary
            upload_result = cloudinary.uploader.upload(file_data, resource_type="auto")

            # 3. Send back the secure URL in a JSON response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            response_data = {'url': upload_result['secure_url']}
            self.wfile.write(json.dumps(response_data).encode('utf-8'))
        
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f'Error uploading file: {str(e)}'.encode('utf-8'))
