"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const config_1 = require("./db/config");
const client_1 = require("./discord/client");
const handlers_1 = require("./api/handlers");
dotenv_1.default.config();
const app = (0, express_1.default)();
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: 1024 * 1024 * 1024 } // 1GB limit for memory storage (be careful in production)
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.get('/api/files', handlers_1.FileHandlers.list);
app.post('/api/upload', upload.single('file'), handlers_1.FileHandlers.upload);
app.get('/api/download/:fileId', handlers_1.FileHandlers.download);
app.post('/api/folders', handlers_1.FileHandlers.createFolder);
const PORT = process.env.PORT || 3001;
async function start() {
    try {
        config_1.DB.init();
        await client_1.DiscordClient.init();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    }
    catch (err) {
        console.error('Failed to start server:', err);
    }
}
start();
