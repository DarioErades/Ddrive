import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(process.cwd(), 'data');

export class DB {
    public static configDb: Database.Database;
    public static filesDb: Database.Database;

    static init() {
        if (!fs.existsSync(DB_PATH)) {
            fs.mkdirSync(DB_PATH, { recursive: true });
        }
        this.configDb = new Database(path.join(DB_PATH, 'config.db'));
        this.filesDb = new Database(path.join(DB_PATH, 'files.db'));

        // Initialize schemas
        this.configDb.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        `);

        this.filesDb.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        `);

        this.filesDb.exec(`
            CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                parent_id TEXT,
                name TEXT NOT NULL,
                is_starred INTEGER DEFAULT 0,
                is_deleted INTEGER DEFAULT 0,
                color TEXT DEFAULT '#5865F2',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS files (
                id TEXT PRIMARY KEY,
                folder_id TEXT,
                name TEXT NOT NULL,
                size INTEGER NOT NULL,
                mime_type TEXT,
                master_key_encrypted TEXT,
                content_hash TEXT,
                is_starred INTEGER DEFAULT 0,
                is_deleted INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(folder_id) REFERENCES folders(id)
            );
            CREATE TABLE IF NOT EXISTS chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id TEXT,
                chunk_index INTEGER,
                message_id TEXT,
                iv TEXT,
                auth_tag TEXT,
                FOREIGN KEY(file_id) REFERENCES files(id)
            );
        `);

        // Migration: Add color column if missing
        try {
            this.filesDb.prepare("ALTER TABLE folders ADD COLUMN color TEXT DEFAULT '#5865F2'").run();
        } catch (e) {
            // Ignore if column already exists
        }
    }

    static async seed() {
        const { default: argon2 } = await import('argon2');
        const user = this.filesDb.prepare('SELECT * FROM users WHERE username = ?').get('dario');
        if (!user) {
            const hash = await argon2.hash('dArio2006');
            this.filesDb.prepare('INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)').run(
                uuidv4(), 'dario', hash
            );
            console.log('Seeded default user: dario');
        }
    }
}
