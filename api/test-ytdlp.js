import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const exec = promisify(execCallback);

// 使用 /tmp 目录
const YT_DLP_PATH = '/tmp/yt-dlp';

async function ensureYtDlp() {
    try {
        // 检查是否已经存在
        try {
            await fs.access(YT_DLP_PATH);
            console.log('yt-dlp 已存在');
            return;
        } catch {
            console.log('yt-dlp 不存在，开始下载');
        }

        // 下载 yt-dlp
        await exec(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${YT_DLP_PATH}`);
        await exec(`chmod +x ${YT_DLP_PATH}`);
        console.log('yt-dlp 安装完成');
    } catch (error) {
        console.error('安装 yt-dlp 失败:', error);
        throw error;
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
        // 确保 yt-dlp 已安装
        await ensureYtDlp();

        console.log('测试 yt-dlp...');

        // 直接使用命令行测试版本
        const { stdout: version } = await exec(`${YT_DLP_PATH} --version`);

        // 列出 /tmp 目录内容
        const tmpFiles = await fs.readdir('/tmp');

        return res.status(200).json({
            status: 'success',
            message: 'yt-dlp 安装并测试成功',
            version: version.trim(),
            binPath: YT_DLP_PATH,
            env: {
                vercel: !!process.env.VERCEL,
                nodeEnv: process.env.NODE_ENV,
                pwd: process.cwd(),
                tmpFiles
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