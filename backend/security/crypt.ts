import crypto from 'node:crypto';
import argon2 from 'argon2';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; 
const AUTH_TAG_LENGTH = 16;

export class Crypt {
    // Derive a key using Argon2id
    static async deriveKey(password: string, salt: Buffer): Promise<Buffer> {
        return argon2.hash(password, {
            type: argon2.argon2id,
            salt: salt,
            raw: true,
            hashLength: 32, // 256 bits
        });
    }

    // Encrypt a chunk of data
    static encrypt(data: Buffer, key: Buffer): { ciphertext: Buffer; iv: Buffer; authTag: Buffer } {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
        const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return { ciphertext, iv, authTag };
    }

    // Decrypt a chunk of data
    static decrypt(ciphertext: Buffer, key: Buffer, iv: Buffer, authTag: Buffer): Buffer {
        // Le meto este log por si acaso, si el archivo es muy pequeño puede que sea un error de Discord
        if (ciphertext.length < 500) {
            console.log(`Hmm, este chunk es super pequeño (${ciphertext.length} bytes), igual es un error de Discord`);
        }

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
        decipher.setAuthTag(authTag);
        
        try {
            return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
        } catch (error: any) {
            console.error('Error al desencriptar el chunk:', error.message);
            // Esto falla si el tag no coincide, probablemente clave mal o archivo corrupto
            throw error;
        }
    }

    // Generate SHA-256 hash
    static hash(data: Buffer): string {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    // Generate random key
    static generateRandomKey(): Buffer {
        return crypto.randomBytes(32);
    }
}
