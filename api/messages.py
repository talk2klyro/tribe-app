# /api/messages.py
import os
import json
import psycopg2
from http.server import BaseHTTPRequestHandler
from urllib.parse import urlparse

DB_CONNECTION_STRING = os.environ.get("DB_CONNECTION_STRING")

# This is a helper function to create our messages table if it doesn't exist
def setup_database():
    try:
        conn = psycopg2.connect(DB_CONNECTION_STRING)
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                text VARCHAR(255) NOT NULL,
                sender_email VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Database setup failed: {e}")

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        # 1. Save a new message to the database
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            body = json.loads(post_data.decode('utf-8'))
            text = body.get('text')
            sender_email = body.get('email')

            if not text or not sender_email:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Error: Missing text or email.")
                return

            conn = psycopg2.connect(DB_CONNECTION_STRING)
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO messages (text, sender_email) VALUES (%s, %s)",
                (text, sender_email)
            )
            conn.commit()
            cur.close()
            conn.close()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"status": "success"}')
            
        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f'Error saving message: {str(e)}'.encode('utf-8'))

    def do_GET(self):
        # 2. Fetch all messages from the database
        try:
            conn = psycopg2.connect(DB_CONNECTION_STRING)
            cur = conn.cursor()
            cur.execute("SELECT text, sender_email FROM messages ORDER BY timestamp ASC")
            rows = cur.fetchall()
            messages = [{'text': row[0], 'email': row[1]} for row in rows]
            
            cur.close()
            conn.close()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(messages).encode('utf-8'))

        except Exception as e:
            self.send_response(500)
            self.end_headers()
            self.wfile.write(f'Error fetching messages: {str(e)}'.encode('utf-8'))

# Run the database setup function once to create the table
setup_database()
