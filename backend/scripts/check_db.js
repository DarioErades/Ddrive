import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'files.db');
const db = new Database(dbPath);

console.log('--- Files Table ---');
const files = db.prepare('SELECT id, name, master_key_encrypted FROM files LIMIT 10').all();
files.forEach(f => {
    console.log(`ID: ${f.id}, Name: ${f.name}, MasterKey: ${f.master_key_encrypted?.substring(0, 10)}... (Length: ${f.master_key_encrypted?.length})`);
});

console.log('--- Chunks Table ---');
const chunks = db.prepare('SELECT id, file_id, chunk_index, iv, auth_tag FROM chunks LIMIT 10').all();
chunks.forEach(c => {
    console.log(`ID: ${c.id}, FileID: ${c.file_id}, IV: ${c.iv?.substring(0, 10)} (Length: ${c.iv?.length}), Tag: ${c.auth_tag?.substring(0, 10)} (Length: ${c.auth_tag?.length})`);
});
