export declare class Crypt {
    static deriveKey(password: string, salt: Buffer): Promise<Buffer>;
    static encrypt(data: Buffer, key: Buffer): {
        ciphertext: Buffer;
        iv: Buffer;
        authTag: Buffer;
    };
    static decrypt(ciphertext: Buffer, key: Buffer, iv: Buffer, authTag: Buffer): Buffer;
    static hash(data: Buffer): string;
    static generateRandomKey(): Buffer;
}
//# sourceMappingURL=crypt.d.ts.map