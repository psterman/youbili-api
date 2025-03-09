const fetch = require('node-fetch');

// 支持的平台
const PLATFORMS = {
    YOUTUBE: 'youtube',
    BILIBILI: 'bilibili'
};

// 检测视频平台
function detectPlatform(url) {
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return PLATFORMS.YOUTUBE;
    } else if (url.includes('bilibili.com') || url.includes('b23.tv')) {
        return PLATFORMS.BILIBILI;
    }
    return null;
}

// 提取YouTube视频ID
function extractYouTubeVideoId(url) {
    let match = url.match(/[?&]v=([^&#]*)/);
    if (match && match[1]) {
        return match[1];
    }

    match = url.match(/youtu\.be\/([^?&#]*)/);
    if (match && match[1]) {
        return match[1];
    }

    match = url.match(/youtube\.com\/embed\/([^?&#]*)/);
    if (match && match[1]) {
        return match[1];
    }

    return null;
}

// 提取B站视频ID
function extractBilibiliVideoId(url) {
    let match = url.match(/bilibili\.com\/video\/([^\/\?]+)/);
    if (match && match[1]) {
        return match[1];
    }

    match = url.match(/b23\.tv\/([^\/\?]+)/);
    if (match && match[1]) {
        return match[1];
    }

    return null;
}

// 获取YouTube视频信息
async function getYouTubeVideoInfo(videoId) {
    // 简化版，直接返回固定格式
    return {
        id: videoId,
        title: `YouTube视频 (ID: ${videoId})`,
        uploader: 'YouTube',
        formats: [
            {
                quality: '高清 (720p)',
                format: 'mp4',
                size: '自动检测',
                url: `https://www.y2mate.com/youtube/${videoId}`
            },
            {
                quality: '超清 (1080p)',
                format: 'mp4',
                size: '自动检测',
                url: `https://9xbuddy.org/download?url=https://www.youtube.com/watch?v=${videoId}`
            }
        ]
    };
}

// 获取B站视频信息
async function getBilibiliVideoInfo(videoId) {
    // 简化版，直接返回固定格式
    return {
        id: videoId,
        title: `B站视频 (ID: ${videoId})`,
        uploader: 'B站UP主',
        formats: [
            {
                quality: '高清',
                format: 'mp4',
                size: '自动检测',
                url: `https://xbeibeix.com/api/bilibili/biliplayer/?url=https://www.bilibili.com/video/${videoId}`
            },
            {
                quality: '原始质量',
                format: 'mp4',
                size: '自动检测',
                url: `https://bili.iiilab.com/?bvid=${videoId}`
            }
        ]
    };
}

// API处理函数
module.exports = async (req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理OPTIONS请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 获取URL参数
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: '请提供视频URL' });
    }

    try {
        // 检测平台
        const platform = detectPlatform(url);

        if (!platform) {
            return res.status(400).json({ error: '不支持的视频平台，目前仅支持YouTube和B站' });
        }

        let videoInfo;

        if (platform === PLATFORMS.YOUTUBE) {
            const videoId = extractYouTubeVideoId(url);
            if (!videoId) {
                return res.status(400).json({ error: '无法提取YouTube视频ID' });
            }
            videoInfo = await getYouTubeVideoInfo(videoId);
        } else if (platform === PLATFORMS.BILIBILI) {
            const videoId = extractBilibiliVideoId(url);
            if (!videoId) {
                return res.status(400).json({ error: '无法提取B站视频ID' });
            }
            videoInfo = await getBilibiliVideoInfo(videoId);
        }

        // 添加API来源信息
        videoInfo.apiSource = 'Vercel API';

        return res.status(200).json(videoInfo);
    } catch (error) {
        console.error('处理视频信息请求失败:', error);
        return res.status(500).json({ error: '获取视频信息失败', message: error.message });
    }
}; 