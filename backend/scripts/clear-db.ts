import { DB } from '../db/config.js';

async function clear() {
    try {
        DB.init();
        DB.filesDb.prepare('DELETE FROM chunks').run();
        DB.filesDb.prepare('DELETE FROM files').run();
        DB.filesDb.prepare('DELETE FROM folders').run();
        DB.filesDb.prepare('DELETE FROM users').run();
        console.log('Database tables cleared successfully.');
        await DB.seed();
        console.log('Default user re-seeded.');
    } catch (error) {
        console.error('Error clearing database:', error);
    }
}

clear();
