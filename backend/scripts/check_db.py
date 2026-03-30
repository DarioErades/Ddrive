import sqlite3
import os

db_path = 'data/files.db'
if not os.path.exists(db_path):
    print(f"Error: {db_path} not found")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    print("--- Files Table Sample (id, name, created_at, key_len) ---")
    cursor.execute('SELECT id, name, created_at, length(master_key_encrypted) FROM files ORDER BY created_at DESC LIMIT 20')
    for row in cursor.fetchall():
        print(row)

    print("\n--- Chunks Table Sample (file_id, iv_len, tag_len) ---")
    cursor.execute('SELECT file_id, length(iv), length(auth_tag) FROM chunks LIMIT 20')
    for row in cursor.fetchall():
        print(row)
except Exception as e:
    print(f"SQL Error: {e}")

conn.close()
