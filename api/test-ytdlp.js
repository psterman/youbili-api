import { exec } from 'yt-dlp-exec';

// 设置 yt-dlp 路径
const YT_DLP_PATH = process.env.VERCEL ? '.vercel/bin/yt-dlp' : 'yt-dlp';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
        // 测试 yt-dlp 版本
        const options = {
            version: true,
            binPath: YT_DLP_PATH
        };

        console.log('正在检查 yt-dlp...');
        console.log('yt-dlp 路径:', YT_DLP_PATH);

        const result = await exec('', options);

        return res.status(200).json({
            status: 'success',
            message: 'yt-dlp 安装成功',
            version: result,
            binPath: YT_DLP_PATH,
            env: {
                vercel: !!process.env.VERCEL,
                nodeEnv: process.env.NODE_ENV,
                pwd: process.cwd()
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
                pwd: process.cwd()
            }
        });
    }
} 