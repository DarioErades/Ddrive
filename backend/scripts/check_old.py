import sqlite3
import os

db_path = 'data/files.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("--- Odest (id, name, created_at, key_len) ---")
cursor.execute('SELECT id, name, created_at, length(master_key_encrypted) FROM files ORDER BY created_at ASC LIMIT 10')
for row in cursor.fetchall():
    print(row)

print("\n--- Chunks for oldest (id, iv_len, tag_len) ---")
cursor.execute('''
    SELECT c.file_id, length(c.iv), length(c.auth_tag) 
    FROM chunks c 
    JOIN files f ON f.id = c.file_id 
    ORDER BY f.created_at ASC 
    LIMIT 10
''')
for row in cursor.fetchall():
    print(row)

conn.close()
