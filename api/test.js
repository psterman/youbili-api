import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export default async function handler(req, res) {
    try {
        // 基本信息
        const info = {
            message: 'Test endpoint',
            timestamp: new Date().toISOString(),
            cwd: process.cwd(),
            env: process.env.NODE_ENV,
            vercel: !!process.env.VERCEL
        };

        // 尝试在 /tmp 目录下创建文件
        try {
            fs.writeFileSync('/tmp/test.txt', 'Hello from Vercel!');
            info.tmpWrite = 'success';

            // 列出 /tmp 目录
            const tmpFiles = fs.readdirSync('/tmp');
            info.tmpFiles = tmpFiles;
        } catch (error) {
            info.tmpError = error.message;
        }

        // 尝试执行简单命令
        try {
            const { stdout } = await execAsync('ls -la /tmp');
            info.lsOutput = stdout;
        } catch (error) {
            info.cmdError = error.message;
        }

        res.status(200).json(info);
    } catch (error) {
        res.status(500).json({
            error: error.message,
            stack: error.stack
        });
    }
} 