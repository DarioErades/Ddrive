import { Request, Response } from 'express';
import { DB } from '../db/config.js';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-drivecord-key';

export class AuthHandlers {
    static async login(req: Request, res: Response) {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });

        try {
            const user = DB.filesDb.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
            if (!user) return res.status(401).json({ error: 'Invalid credentials' });

            const valid = await argon2.verify(user.password_hash, password);
            if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

            const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
            res.json({ token, user: { id: user.id, username: user.username } });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Login failed' });
        }
    }

    static async me(req: Request, res: Response) {
        res.json((req as any).user);
    }
}
