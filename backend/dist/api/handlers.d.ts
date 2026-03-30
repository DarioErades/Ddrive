import { Request, Response } from 'express';
export declare class FileHandlers {
    static upload(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static download(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    static list(req: Request, res: Response): Promise<void>;
    static createFolder(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=handlers.d.ts.map