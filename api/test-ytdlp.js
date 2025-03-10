import { exec } from 'yt-dlp-exec';
import path from 'path';

// 设置 yt-dlp 路径
const YT_DLP_PATH = path.join(process.cwd(), 'api', '_lib', 'yt-dlp');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
        console.log('正在检查 yt-dlp...');
        console.log('yt-dlp 路径:', YT_DLP_PATH);

        // 测试 yt-dlp 版本
        const options = {
            version: true,
            binPath: YT_DLP_PATH
        };

        const result = await exec('', options);

        return res.status(200).json({
            status: 'success',
            message: 'yt-dlp 安装成功',
            version: result,
            binPath: YT_DLP_PATH,
            env: {
                vercel: !!process.env.VERCEL,
                nodeEnv: process.env.NODE_ENV,
                pwd: process.cwd(),
                files: await listFiles(process.cwd())
            }
        });
    } catch (error) {
        console.error('yt-dlp 测试失败:', error);
        return res.status(500).json({
            status: 'error',
            message: 'yt-dlp 测试失败',
            error: error.message,
            binPath: YT_DLP_PATH,
            env: {
                vercel: !!process.env.VERCEL,
                nodeEnv: process.env.NODE_ENV,
                pwd: process.cwd(),
                files: await listFiles(process.cwd())
            }
        });
    }
}

// 辅助函数：列出目录内容
async function listFiles(dir) {
    try {
        const { readdir } = await import('fs/promises');
        const files = await readdir(dir, { withFileTypes: true });
        return files.map(file => ({
            name: file.name,
            isDirectory: file.isDirectory()
        }));
    } catch (error) {
        return ['Error listing files: ' + error.message];
    }
} 