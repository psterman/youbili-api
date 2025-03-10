import fetch from 'node-fetch';
import { exec } from 'yt-dlp-exec';
import path from 'path';

// 设置 yt-dlp 路径
const YT_DLP_PATH = process.env.VERCEL ? '.vercel/bin/yt-dlp' : 'yt-dlp';

// 支持的平台
const PLATFORMS = {
    YOUTUBE: 'youtube',
    BILIBILI: 'bilibili'
};

// API 处理函数
export default async function handler(req, res) {
    // 设置 CORS 头和 Content-Type
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    // 处理 OPTIONS 请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 获取 URL 参数
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: '请提供视频URL' });
    }

    console.log('处理视频URL:', url);

    try {
        let videoInfo;
        if (isYouTubeUrl(url)) {
            console.log('检测到YouTube链接');
            videoInfo = await getVideoInfo(url, 'youtube');
        } else if (isBilibiliUrl(url)) {
            console.log('检测到B站链接');
            videoInfo = await getVideoInfo(url, 'bilibili');
        } else {
            return res.status(400).json({ error: '不支持的视频平台，目前仅支持YouTube和B站' });
        }
        return res.status(200).json(videoInfo);
    } catch (error) {
        console.error('获取视频信息失败:', error);
        return res.status(500).json({
            error: '获取视频信息失败',
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}

// 统一的视频信息获取函数
async function getVideoInfo(url, platform) {
    try {
        console.log(`正在获取${platform}视频信息...`);

        // 配置 yt-dlp 参数
        const options = {
            dumpSingleJson: true,
            noWarnings: true,
            noCallHome: true,
            extractorRetries: 3,
            retries: 3,
            format: platform === 'youtube'
                ? 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best'
                : 'best[ext=mp4]/best',
            youtubeSkipDashManifest: true,
            addHeader: [
                'User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            ],
            binPath: YT_DLP_PATH
        };

        // 获取视频信息
        const info = await exec(url, options);
        console.log('成功获取视频信息');

        // 处理格式列表
        let formats = [];
        if (info.formats) {
            formats = info.formats
                .filter(f => f.ext === 'mp4' && f.filesize)
                .map(f => ({
                    quality: getQualityLabel(f),
                    format: 'mp4',
                    size: formatFileSize(f.filesize),
                    url: f.url,
                    vcodec: f.vcodec,
                    acodec: f.acodec,
                    filesize: f.filesize,
                    tbr: f.tbr || 0
                }))
                .sort((a, b) => b.tbr - a.tbr);

            // 去重并保留最佳质量
            formats = deduplicateFormats(formats);
        }

        // 如果没有找到格式，尝试使用备用格式
        if (formats.length === 0) {
            formats = [{
                quality: 'auto',
                format: 'mp4',
                size: '未知',
                url: info.url,
                vcodec: info.vcodec,
                acodec: info.acodec
            }];
        }

        return {
            id: info.id,
            title: info.title,
            uploader: info.uploader || (platform === 'youtube' ? 'YouTube' : 'B站UP主'),
            thumbnail: info.thumbnail,
            duration: info.duration,
            formats: formats.map(f => ({
                quality: f.quality,
                format: f.format,
                size: f.size,
                url: f.url
            })),
            apiSource: 'Vercel API (yt-dlp)'
        };
    } catch (error) {
        console.error(`获取${platform}视频信息失败:`, error);
        throw error;
    }
}

// 获取质量标签
function getQualityLabel(format) {
    if (format.height) {
        return `${format.height}p`;
    }
    if (format.format_note) {
        return format.format_note;
    }
    if (format.resolution !== 'unknown') {
        return format.resolution;
    }
    return '自动';
}

// 格式去重
function deduplicateFormats(formats) {
    const seen = new Set();
    return formats.filter(format => {
        const key = format.quality;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (!bytes) return '未知';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
}

// 辅助函数：检查是否为YouTube链接
function isYouTubeUrl(url) {
    return url.includes('youtube.com') || url.includes('youtu.be');
}

// 辅助函数：检查是否为B站链接
function isBilibiliUrl(url) {
    return url.includes('bilibili.com') || url.includes('b23.tv');
}

// 辅助函数：提取YouTube视频ID
function extractYouTubeVideoId(url) {
    // 处理标准链接 (youtube.com/watch?v=VIDEO_ID)
    let match = url.match(/[?&]v=([^&#]*)/);
    if (match && match[1]) {
        return match[1];
    }

    // 处理短链接 (youtu.be/VIDEO_ID)
    match = url.match(/youtu\.be\/([^?&#]*)/);
    if (match && match[1]) {
        return match[1];
    }

    // 处理嵌入链接 (youtube.com/embed/VIDEO_ID)
    match = url.match(/youtube\.com\/embed\/([^?&#]*)/);
    if (match && match[1]) {
        return match[1];
    }

    return null;
}

// 辅助函数：提取B站视频ID
function extractBilibiliVideoId(url) {
    // 处理标准链接 (bilibili.com/video/BV1xx411c7mD)
    let match = url.match(/bilibili\.com\/video\/([^\/\?]+)/);
    if (match && match[1]) {
        return match[1];
    }

    // 处理短链接 (b23.tv/xxxxx)
    match = url.match(/b23\.tv\/([^\/\?]+)/);
    if (match && match[1]) {
        return match[1];
    }

    return null;
} 