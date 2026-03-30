"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileHandlers = void 0;
const express_1 = require("express");
const crypt_1 = require("../security/crypt");
const config_1 = require("../db/config");
const client_1 = require("../discord/client");
const uuid_1 = require("uuid");
const CHUNK_SIZE = 9.5 * 1024 * 1024; // 9.5 MB to be safe
class FileHandlers {
    static async upload(req, res) {
        try {
            const { name, folderId } = req.body;
            const file = req.file;
            if (!file)
                return res.status(400).send('No file uploaded');
            const fileId = (0, uuid_1.v4)();
            const masterKey = crypt_1.Crypt.generateRandomKey();
            const contentHash = crypt_1.Crypt.hash(file.buffer);
            const totalChunks = Math.ceil(file.buffer.length / CHUNK_SIZE);
            config_1.DB.filesDb.prepare(`
                INSERT INTO files (id, folder_id, name, size, mime_type, master_key_encrypted, content_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(fileId, folderId || null, name || file.originalname, file.size, file.mimetype, masterKey.toString('hex'), contentHash);
            for (let i = 0; i < totalChunks; i++) {
                const chunkData = file.buffer.subarray(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                const { ciphertext, iv, authTag } = crypt_1.Crypt.encrypt(chunkData, masterKey);
                const messageId = await client_1.DiscordClient.uploadChunk(ciphertext, `${fileId}_${i}.enc`);
                config_1.DB.filesDb.prepare(`
                    INSERT INTO chunks (file_id, chunk_index, message_id, iv, auth_tag)
                    VALUES (?, ?, ?, ?, ?)
                `).run(fileId, i, messageId, iv.toString('hex'), authTag.toString('hex'));
            }
            res.json({ id: fileId });
        }
        catch (error) {
            console.error(error);
            res.status(500).send('Upload failed');
        }
    }
    static async download(req, res) {
        try {
            const { fileId } = req.params;
            const file = config_1.DB.filesDb.prepare('SELECT * FROM files WHERE id = ?').get(fileId);
            if (!file)
                return res.status(404).send('File not found');
            const chunks = config_1.DB.filesDb.prepare('SELECT * FROM chunks WHERE file_id = ? ORDER BY chunk_index ASC').all(fileId);
            const masterKey = Buffer.from(file.master_key_encrypted, 'hex');
            res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
            res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
            res.setHeader('Content-Length', file.size);
            for (const chunk of chunks) {
                const ciphertext = await client_1.DiscordClient.downloadChunk(chunk.message_id);
                const iv = Buffer.from(chunk.iv, 'hex');
                const authTag = Buffer.from(chunk.auth_tag, 'hex');
                const decrypted = crypt_1.Crypt.decrypt(ciphertext, masterKey, iv, authTag);
                res.write(decrypted);
            }
            res.end();
        }
        catch (error) {
            console.error(error);
            if (!res.headersSent)
                res.status(500).send('Download failed');
        }
    }
    static async list(req, res) {
        const folderId = req.query.folderId || null;
        const folders = config_1.DB.filesDb.prepare('SELECT * FROM folders WHERE parent_id IS ?').all(folderId);
        const files = config_1.DB.filesDb.prepare('SELECT * FROM files WHERE folder_id IS ?').all(folderId);
        res.json({ folders, files });
    }
    static async createFolder(req, res) {
        const { name, parentId } = req.body;
        const id = (0, uuid_1.v4)();
        config_1.DB.filesDb.prepare('INSERT INTO folders (id, parent_id, name) VALUES (?, ?, ?)').run(id, parentId || null, name);
        res.json({ id });
    }
}
exports.FileHandlers = FileHandlers;
//# sourceMappingURL=handlers.js.map