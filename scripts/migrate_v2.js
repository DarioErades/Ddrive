import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '../backend/data/files.db'));

try {
    db.prepare("ALTER TABLE folders ADD COLUMN color TEXT DEFAULT '#5865F2'").run();
    console.log('Added color column to folders');
} catch (e) {
    if (e.message.includes('duplicate column name')) {
        console.log('Color column already exists');
    } else {
        console.error('Migration error:', e.message);
    }
}
