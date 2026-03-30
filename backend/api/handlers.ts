import { Request, Response } from 'express';
import { Crypt } from '../security/crypt.js';
import { DB } from '../db/config.js';
import { DiscordClient } from '../discord/client.js';
import { DiscordQueue } from '../discord/queue.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import fs from 'fs';

const CHUNK_SIZE = 9.5 * 1024 * 1024; // 9.5 MB to be safe

export class FileHandlers {
    static async upload(req: Request, res: Response) {
        let tempPath = '';
        try {
            const { name, folderId } = req.body;
            const file = req.file;
            if (!file) return res.status(400).send('No file uploaded');
            
            tempPath = file.path;
            const fileId = uuidv4();
            const masterKey = Crypt.generateRandomKey();
            const hash = crypto.createHash('sha256');
            
            const stats = fs.statSync(tempPath);
            const fileSize = stats.size;

            const finalName = name || file.originalname;
            const cleanFolderId = (folderId && folderId.trim() !== '') ? folderId : null;

            // Insert file record FIRST to satisfy foreign key in 'chunks'
            DB.filesDb.prepare(`
                INSERT INTO files (id, folder_id, name, size, mime_type, master_key_encrypted, content_hash)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(fileId, cleanFolderId, finalName, fileSize, file.mimetype, masterKey.toString('hex'), 'pending');

            let currentIdx = 0;
            const stream = fs.createReadStream(tempPath, { highWaterMark: CHUNK_SIZE });
            
            for await (const chunkData of stream) {
                hash.update(chunkData);
                const { ciphertext, iv, authTag } = Crypt.encrypt(chunkData, masterKey);
                
                // Queued upload
                const messageId = await DiscordQueue.add<string>(() => 
                    DiscordClient.uploadChunk(ciphertext, `${fileId}_${currentIdx}.enc`)
                );
                
                DB.filesDb.prepare(`
                    INSERT INTO chunks (file_id, chunk_index, message_id, iv, auth_tag)
                    VALUES (?, ?, ?, ?, ?)
                `).run(fileId, currentIdx, messageId, iv.toString('hex'), authTag.toString('hex'));
                
                currentIdx++;
            }

            const contentHash = hash.digest('hex');
            
            DB.filesDb.prepare(`UPDATE files SET content_hash = ? WHERE id = ?`).run(contentHash, fileId);

            fs.unlinkSync(tempPath);
            res.json({ id: fileId });
        } catch (error: any) {
            console.error('Upload handler failed');
            console.error(error.stack || error);
            if (tempPath && fs.existsSync(tempPath)) {
                try { fs.unlinkSync(tempPath); } catch (e) {}
            }
            if (!res.headersSent) res.status(500).json({ error: error.message || 'Upload failed' });
        }
    }

    static async download(req: Request, res: Response) {
        try {
            const { fileId } = req.params;
            const file = DB.filesDb.prepare('SELECT * FROM files WHERE id = ?').get(fileId) as any;
            if (!file) return res.status(404).send('File not found');

            const chunks = DB.filesDb.prepare('SELECT * FROM chunks WHERE file_id = ? ORDER BY chunk_index ASC').all(fileId) as any[];
            const masterKey = Buffer.from(file.master_key_encrypted, 'hex');

            res.setHeader('Content-Disposition', `attachment; filename="${file.name}"`);
            res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
            res.setHeader('Content-Length', file.size);

            for (const chunk of chunks) {
                // Queued download
                const ciphertext = await DiscordQueue.add<Buffer>(() => 
                    DiscordClient.downloadChunk(chunk.message_id)
                );
                
                const iv = Buffer.from(chunk.iv, 'hex');
                const authTag = Buffer.from(chunk.auth_tag, 'hex');
                
                const decrypted = Crypt.decrypt(ciphertext, masterKey, iv, authTag);
                res.write(decrypted);
            }
            res.end();
        } catch (error) {
            console.error(error);
            if (!res.headersSent) res.status(500).send('Download failed');
        }
    }

    static listFiles(req: Request, res: Response) {
        const folderId = req.query.folderId as string || null;
        const view = req.query.view as string || 'home';
        
        let folders, files;
        if (view === 'starred') {
            folders = DB.filesDb.prepare('SELECT * FROM folders WHERE is_starred = 1 AND is_deleted = 0').all();
            files = DB.filesDb.prepare('SELECT * FROM files WHERE is_starred = 1 AND is_deleted = 0').all();
        } else if (view === 'trash') {
            folders = DB.filesDb.prepare('SELECT * FROM folders WHERE is_deleted = 1').all();
            files = DB.filesDb.prepare('SELECT * FROM files WHERE is_deleted = 1').all();
        } else if (folderId) {
            folders = DB.filesDb.prepare('SELECT * FROM folders WHERE parent_id = ? AND is_deleted = 0').all(folderId);
            files = DB.filesDb.prepare('SELECT * FROM files WHERE folder_id = ? AND is_deleted = 0').all(folderId);
        } else {
            folders = DB.filesDb.prepare('SELECT * FROM folders WHERE parent_id IS NULL AND is_deleted = 0').all();
            files = DB.filesDb.prepare('SELECT * FROM files WHERE folder_id IS NULL AND is_deleted = 0').all();
        }
        
        const totalStorage = DB.filesDb.prepare('SELECT SUM(size) as total FROM files WHERE is_deleted = 0').get() as any;
        res.json({ folders, files, totalStorageUsed: totalStorage?.total || 0 });
    }

    static toggleStar(req: Request, res: Response) {
        const { id, type } = req.body;
        if (!id || !type) return res.status(400).json({ error: 'Missing id or type' });

        try {
            const table = type === 'folder' ? 'folders' : 'files';
            DB.filesDb.prepare(`UPDATE ${table} SET is_starred = 1 - is_starred WHERE id = ?`).run(id);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Failed to toggle star' });
        }
    }

    static moveFile(req: Request, res: Response) {
        const { fileId, folderId } = req.body;
        if (!fileId) return res.status(400).json({ error: 'Missing fileId' });

        try {
            DB.filesDb.prepare('UPDATE files SET folder_id = ? WHERE id = ?').run(folderId || null, fileId);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Failed to move file' });
        }
    }

    static createFolder(req: Request, res: Response) {
        const { name, parentId } = req.body;
        if (!name) return res.status(400).json({ error: 'Name required' });

        const id = uuidv4();
        DB.filesDb.prepare('INSERT INTO folders (id, name, parent_id) VALUES (?, ?, ?)').run(id, name, parentId || null);
        res.json({ id, name });
    }

    static rename(req: Request, res: Response) {
        const { id, type, newName } = req.body;
        if (!id || !type || !newName) return res.status(400).json({ error: 'Missing parameters' });

        try {
            const table = type === 'folder' ? 'folders' : 'files';
            DB.filesDb.prepare(`UPDATE ${table} SET name = ? WHERE id = ?`).run(newName, id);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Failed to rename' });
        }
    }

    static toggleDelete(req: Request, res: Response) {
        const { id, type } = req.body;
        if (!id || !type) return res.status(400).json({ error: 'Missing id or type' });

        try {
            const table = type === 'folder' ? 'folders' : 'files';
            DB.filesDb.prepare(`UPDATE ${table} SET is_deleted = 1 - is_deleted WHERE id = ?`).run(id);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Failed to toggle delete' });
        }
    }

    static updateFolder(req: Request, res: Response) {
        const { id, name, color } = req.body;
        if (!id) return res.status(400).json({ error: 'Missing id' });
        try {
            if (name) DB.filesDb.prepare('UPDATE folders SET name = ? WHERE id = ?').run(name, id);
            if (color) DB.filesDb.prepare('UPDATE folders SET color = ? WHERE id = ?').run(color, id);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Failed to update folder' });
        }
    }

    static deleteFolder(req: Request, res: Response) {
        const { id } = req.body;
        if (!id) return res.status(400).json({ error: 'Missing id' });
        try {
            const folder = DB.filesDb.prepare('SELECT * FROM folders WHERE id = ?').get(id) as any;
            if (!folder) return res.status(404).json({ error: 'Folder not found' });
            
            const newParentId = folder.parent_id || null;
            DB.filesDb.prepare('UPDATE files SET folder_id = ? WHERE folder_id = ?').run(newParentId, id);
            DB.filesDb.prepare('UPDATE folders SET parent_id = ? WHERE parent_id = ?').run(newParentId, id);
            DB.filesDb.prepare('DELETE FROM folders WHERE id = ?').run(id);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: 'Failed to delete folder' });
        }
    }
}
