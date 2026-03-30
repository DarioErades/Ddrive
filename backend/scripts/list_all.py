import sqlite3
import os

db_path = 'data/files.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute('SELECT COUNT(*) FROM files')
print(f"Total files: {cursor.fetchone()[0]}")

cursor.execute('SELECT id, name, created_at FROM files ORDER BY created_at DESC')
for row in cursor.fetchall():
    print(row)

conn.close()
