import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

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

// 获取YouTube视频信息
async function getYouTubeInfo(videoId) {
    try {
        // 第一步：获取k参数
        const initResponse = await fetch('https://www.y2mate.com/mates/analyzeV2/ajax', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'https://www.y2mate.com',
                'Referer': 'https://www.y2mate.com/'
            },
            body: `k_query=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D${videoId}&k_page=home&hl=en&q_auto=1`
        });

        const initData = await initResponse.json();

        if (!initData.status === 'ok' || !initData.vid) {
            throw new Error('无法获取视频信息');
        }

        // 第二步：获取下载链接
        const convertResponse = await fetch('https://www.y2mate.com/mates/convertV2/index', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'https://www.y2mate.com',
                'Referer': 'https://www.y2mate.com/'
            },
            body: `vid=${initData.vid}&k=${encodeURIComponent(initData.links.mp4['22'].k)}`
        });

        const convertData = await convertResponse.json();

        return {
            title: initData.title || '未知标题',
            thumbnail: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
            uploader: 'YouTube',
            duration: initData.t || 0,
            formats: Object.entries(initData.links.mp4).map(([quality, info]) => ({
                quality: info.q,
                format: 'mp4',
                url: info.k,
                size: info.size,
                vcodec: 'h264',
                acodec: 'aac'
            })),
            platform: 'YouTube',
            originalUrl: `https://www.youtube.com/watch?v=${videoId}`
        };
    } catch (error) {
        console.error('YouTube info error:', error);
        throw new Error('获取YouTube视频信息失败');
    }
}

// 获取Bilibili视频信息
async function getBilibiliInfo(videoId) {
    try {
        // 使用 Bilibili API
        const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Referer': 'https://www.bilibili.com'
            }
        });

        const data = await response.json();

        if (data.code !== 0) {
            throw new Error(data.message || 'Bilibili API 返回错误');
        }

        const info = data.data;

        // 使用 BiliGet API 获取下载链接
        const downloadResponse = await fetch(`https://api.biliget.com/bilibili/video/download?bvid=${videoId}`);
        const downloadData = await downloadResponse.json();

        const formats = [];
        if (downloadData.success && downloadData.data) {
            downloadData.data.forEach(item => {
                formats.push({
                    quality: item.quality,
                    format: 'mp4',
                    url: item.url,
                    size: item.size,
                    vcodec: 'h264',
                    acodec: 'aac'
                });
            });
        }

        return {
            title: info.title,
            thumbnail: info.pic,
            uploader: info.owner?.name || '未知UP主',
            duration: info.duration,
            formats: formats.length > 0 ? formats : [{
                quality: '高清',
                format: 'mp4',
                url: `https://bili.download.download/${videoId}`,
                size: '自动检测',
                vcodec: 'h264',
                acodec: 'aac'
            }],
            platform: 'Bilibili',
            originalUrl: `https://www.bilibili.com/video/${videoId}`
        };
    } catch (error) {
        console.error('Bilibili info error:', error);
        throw new Error('获取B站视频信息失败');
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

        // 提取视频ID和平台信息
        const videoInfo = extractVideoId(url);
        if (!videoInfo) {
            return res.status(400).json({ error: '不支持的视频链接格式' });
        }

        // 根据平台获取视频信息
        let info;
        if (videoInfo.platform === 'youtube') {
            info = await getYouTubeInfo(videoInfo.id);
        } else if (videoInfo.platform === 'bilibili') {
            info = await getBilibiliInfo(videoInfo.id);
        } else {
            return res.status(400).json({ error: '不支持的视频平台' });
        }

        console.log('Video info retrieved successfully');
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