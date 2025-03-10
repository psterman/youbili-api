import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

// 平台识别正则表达式
const PLATFORM_PATTERNS = {
    youtube: /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    bilibili: /(?:bilibili\.com\/video\/(?:av|BV)([a-zA-Z0-9]+))|(?:b23\.tv\/([a-zA-Z0-9]+))/i
};

// 从URL中提取视频ID
function extractVideoId(url) {
    for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
        const match = url.match(pattern);
        if (match) {
            return {
                platform,
                id: match[1] || match[2]
            };
        }
    }
    return null;
}

// 检查并安装 yt-dlp
async function ensureYtDlp() {
    try {
        // 检查 yt-dlp 是否已安装
        const ytDlpPath = path.join(process.cwd(), 'yt-dlp');
        if (!fs.existsSync(ytDlpPath)) {
            console.log('Installing yt-dlp...');
            // 下载 yt-dlp
            await execAsync('curl -L https://github.com/yt-dlp/yt-dlp/releases/download/2023.11.16/yt-dlp -o yt-dlp');
            // 设置执行权限
            await execAsync('chmod +x yt-dlp');
        }
        return ytDlpPath;
    } catch (error) {
        console.error('Failed to install yt-dlp:', error);
        throw new Error('无法安装 yt-dlp');
    }
}

// 获取视频信息
async function getVideoInfo(url, ytDlpPath) {
    try {
        // 使用 yt-dlp 获取视频信息
        const { stdout } = await execAsync(`${ytDlpPath} --no-warnings --dump-json "${url}"`);
        const info = JSON.parse(stdout);

        // 处理视频格式
        const formats = [];
        if (info.formats) {
            for (const format of info.formats) {
                if (format.vcodec !== 'none' && format.acodec !== 'none') {
                    formats.push({
                        quality: format.height ? `${format.height}p` : '未知',
                        format: format.ext || 'mp4',
                        url: format.url,
                        size: format.filesize ? `${(format.filesize / 1024 / 1024).toFixed(2)} MB` : '未知',
                        vcodec: format.vcodec,
                        acodec: format.acodec
                    });
                }
            }
        }

        // 按质量排序
        formats.sort((a, b) => {
            const heightA = parseInt(a.quality) || 0;
            const heightB = parseInt(b.quality) || 0;
            return heightB - heightA;
        });

        return {
            title: info.title || '未知标题',
            thumbnail: info.thumbnail || '',
            uploader: info.uploader || '未知上传者',
            duration: info.duration || 0,
            formats: formats.slice(0, 5), // 只返回最好的5个格式
            platform: info.extractor_key || '未知平台',
            originalUrl: url
        };
    } catch (error) {
        console.error('获取视频信息失败:', error);
        throw new Error('获取视频信息失败，请检查视频链接是否有效');
    }
}

export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: '请提供视频URL' });
        }

        // 确保 yt-dlp 已安装
        const ytDlpPath = await ensureYtDlp();

        // 获取视频信息
        const info = await getVideoInfo(url, ytDlpPath);

        res.json(info);
    } catch (error) {
        console.error('处理失败:', error);
        res.status(500).json({
            error: error.message || '获取视频信息失败',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}