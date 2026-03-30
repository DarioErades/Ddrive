import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'data', 'files.db');

const db = new Database(dbPath);

const addColumnIfNotExists = (table, column, type) => {
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    const exists = info.some(col => col.name === column);
    if (!exists) {
        console.log(`Adding column ${column} to ${table}...`);
        db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
    } else {
        console.log(`Column ${column} already exists in ${table}.`);
    }
};

try {
    addColumnIfNotExists('files', 'is_starred', 'INTEGER DEFAULT 0');
    addColumnIfNotExists('files', 'is_deleted', 'INTEGER DEFAULT 0');
    addColumnIfNotExists('folders', 'is_starred', 'INTEGER DEFAULT 0');
    addColumnIfNotExists('folders', 'is_deleted', 'INTEGER DEFAULT 0');
    console.log('Migration successful!');
} catch (error) {
    console.error('Migration failed:', error);
} finally {
    db.close();
}
