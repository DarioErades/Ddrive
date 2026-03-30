"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DB = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const node_path_1 = __importDefault(require("node:path"));
const DB_PATH = node_path_1.default.join(__dirname, '..', '..', 'data');
class DB {
    static configDb;
    static filesDb;
    static init() {
        this.configDb = new better_sqlite3_1.default(node_path_1.default.join(DB_PATH, 'config.db'));
        this.filesDb = new better_sqlite3_1.default(node_path_1.default.join(DB_PATH, 'files.db'));
        // Initialize schemas
        this.configDb.exec(`
            CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT
            )
        `);
        this.filesDb.exec(`
            CREATE TABLE IF NOT EXISTS folders (
                id TEXT PRIMARY KEY,
                parent_id TEXT,
                name TEXT NOT NULL,
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
    }
}
exports.DB = DB;
//# sourceMappingURL=config.js.map