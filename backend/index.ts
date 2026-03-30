import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { DB } from './db/config.js';
import { DiscordClient } from './discord/client.js';
import { FileHandlers } from './api/handlers.js';

dotenv.config();

// Ensure uploads directory exists
const uploadDir = 'data/uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const app = express();
const upload = multer({ 
    storage: multer.diskStorage({
        destination: uploadDir,
        filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
    }),
    limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB limit
});

app.use(cors());
app.use(express.json({ limit: '1000mb' }));
app.use(express.urlencoded({ limit: '1000mb', extended: true }));

import { AuthHandlers } from './api/auth.js';
import { authMiddleware } from './middleware/auth.js';

// Public routes
app.post('/api/login', AuthHandlers.login);

// Protected routes
app.use('/api', (req, res, next) => {
    if (req.path === '/login') return next(); // Allow /api/login to pass through without authMiddleware
    authMiddleware(req, res, next);
});

app.get('/api/files', FileHandlers.listFiles);
app.post('/api/upload', upload.single('file'), FileHandlers.upload);
app.post('/api/folders', FileHandlers.createFolder);
app.post('/api/move-file', FileHandlers.moveFile);
app.post('/api/toggle-star', FileHandlers.toggleStar);
app.post('/api/toggle-delete', FileHandlers.toggleDelete);
app.post('/api/rename', FileHandlers.rename);
app.post('/api/update-folder', FileHandlers.updateFolder);
app.post('/api/delete-folder', FileHandlers.deleteFolder);
app.get('/api/download/:fileId', FileHandlers.download);
app.get('/api/system/health', (req, res) => res.json(DiscordClient.getStatus()));
app.get('/api/me', AuthHandlers.me);

const PORT = process.env.PORT || 3001;

async function start() {
    DB.init();
    await DB.seed();
    await DiscordClient.init();

    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

start().catch(err => {
    console.error('Failed to start server:', err);
});
