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

// 检查 Python 是否安装
async function checkPython() {
    try {
        await execAsync('python3 --version');
        return 'python3';
    } catch (error) {
        try {
            await execAsync('python --version');
            return 'python';
        } catch (error) {
            throw new Error('未找到 Python，请先安装 Python 3.x');
        }
    }
}

// 检查并安装 yt-dlp
async function ensureYtDlp() {
    try {
        const pythonCmd = await checkPython();
        console.log('Using Python command:', pythonCmd);

        // 检查 yt-dlp 是否已安装
        const ytDlpPath = path.join(process.cwd(), 'yt-dlp');
        if (!fs.existsSync(ytDlpPath)) {
            console.log('Installing yt-dlp...');
            // 下载 yt-dlp
            await execAsync('curl -L https://github.com/yt-dlp/yt-dlp/releases/download/2023.11.16/yt-dlp -o yt-dlp');
            // 设置执行权限
            await execAsync('chmod +x yt-dlp');
            console.log('yt-dlp installed successfully');
        }

        // 测试 yt-dlp 是否可用
        const { stdout } = await execAsync(`${ytDlpPath} --version`);
        console.log('yt-dlp version:', stdout.trim());

        return ytDlpPath;
    } catch (error) {
        console.error('Failed to install or verify yt-dlp:', error);
        throw new Error('无法安装或验证 yt-dlp: ' + error.message);
    }
}

// 获取视频信息
async function getVideoInfo(url) {
    console.log('Getting video info for:', url);

    try {
        // 使用第三方 API 获取视频信息
        const response = await fetch('https://co.wuk.sh/api/json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                url: url,
                vQuality: 'max'
            })
        });

        if (!response.ok) {
            throw new Error('第三方 API 请求失败');
        }

        const data = await response.json();

        // 构建返回数据
        return {
            title: data.title || '未知标题',
            thumbnail: data.thumb || '',
            uploader: data.author || '未知上传者',
            duration: data.duration || 0,
            formats: [
                {
                    quality: 'HD',
                    format: 'mp4',
                    url: data.url,
                    size: '自动检测',
                    vcodec: 'h264',
                    acodec: 'aac'
                }
            ],
            platform: data.platform || '未知平台',
            originalUrl: url
        };
    } catch (error) {
        console.error('Error getting video info:', error);
        throw new Error('获取视频信息失败: ' + error.message);
    }
}

export default async function handler(req, res) {
    console.log('API request received:', req.method);

    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    // 只接受 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: '请使用 POST 方法' });
    }

    try {
        console.log('Request body:', req.body);
        const { url } = req.body;

        if (!url) {
            return res.status(400).json({ error: '请提供视频URL' });
        }

        // 获取视频信息
        const info = await getVideoInfo(url);
        console.log('Video info retrieved successfully');

        // 返回结果
        res.status(200).json(info);
    } catch (error) {
        console.error('API Error:', error);
        const errorResponse = {
            error: error.message || '获取视频信息失败',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        };
        res.status(500).json(errorResponse);
    }
}