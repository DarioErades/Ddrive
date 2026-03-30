"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Crypt = void 0;
const node_crypto_1 = __importDefault(require("node:crypto"));
const argon2_1 = __importDefault(require("argon2"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
class Crypt {
    // Derive a key using Argon2id
    static async deriveKey(password, salt) {
        return argon2_1.default.hash(password, {
            type: argon2_1.default.argon2id,
            salt: salt,
            raw: true,
            hashLength: 32, // 256 bits
        });
    }
    // Encrypt a chunk of data
    static encrypt(data, key) {
        const iv = node_crypto_1.default.randomBytes(IV_LENGTH);
        const cipher = node_crypto_1.default.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
        const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
        const authTag = cipher.getAuthTag();
        return { ciphertext, iv, authTag };
    }
    // Decrypt a chunk of data
    static decrypt(ciphertext, key, iv, authTag) {
        const decipher = node_crypto_1.default.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
        decipher.setAuthTag(authTag);
        return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    }
    // Generate SHA-256 hash
    static hash(data) {
        return node_crypto_1.default.createHash('sha256').update(data).digest('hex');
    }
    // Generate random key
    static generateRandomKey() {
        return node_crypto_1.default.randomBytes(32);
    }
}
exports.Crypt = Crypt;
