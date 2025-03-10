import fetch from 'node-fetch';

// API 处理函数
export default async function handler(req, res) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
        // 检测平台
        if (isYouTubeUrl(url)) {
            console.log('检测到YouTube链接');
            const videoId = extractYouTubeVideoId(url);
            if (!videoId) {
                return res.status(400).json({ error: '无法识别YouTube视频ID，请确保链接格式正确' });
            }
            const videoInfo = await getYouTubeInfo(videoId);
            return res.status(200).json(videoInfo);
        } else if (isBilibiliUrl(url)) {
            console.log('检测到B站链接');
            const videoId = extractBilibiliVideoId(url);
            if (!videoId) {
                return res.status(400).json({ error: '无法识别B站视频ID，请确保链接格式正确' });
            }
            const videoInfo = await getBilibiliInfo(videoId);
            return res.status(200).json(videoInfo);
        } else {
            return res.status(400).json({ error: '不支持的视频平台，目前仅支持YouTube和B站' });
        }
    } catch (error) {
        console.error('获取视频信息失败:', error);
        return res.status(500).json({
            error: '获取视频信息失败',
            message: error.message
        });
    }
}

// 获取YouTube视频信息
async function getYouTubeInfo(videoId) {
    try {
        // 获取视频标题
        let title = `YouTube视频 ${videoId}`;
        let uploader = 'YouTube';
        
        try {
            const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (response.ok) {
                const data = await response.json();
                title = data.title;
                uploader = data.author_name;
            }
        } catch (e) {
            console.warn('获取YouTube视频标题失败:', e);
        }
        
        // 返回视频信息
        return {
            id: videoId,
            title: title,
            uploader: uploader,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
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
                    url: `https://9xbuddy.com/process?url=https://www.youtube.com/watch?v=${videoId}`
                },
                {
                    quality: '原始质量',
                    format: 'mp4',
                    size: '自动检测',
                    url: `https://ssyoutube.com/watch?v=${videoId}`
                }
            ],
            apiSource: 'Vercel API'
        };
    } catch (error) {
        console.error('获取YouTube视频信息失败:', error);
        throw error;
    }
}

// 获取B站视频信息
async function getBilibiliInfo(videoId) {
    try {
        // 返回视频信息
        return {
            id: videoId,
            title: `B站视频 ${videoId}`,
            uploader: 'B站UP主',
            thumbnail: '',
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
                },
                {
                    quality: '标清',
                    format: 'mp4',
                    size: '自动检测',
                    url: `https://injahow.com/bparse/?url=https://www.bilibili.com/video/${videoId}`
                }
            ],
            apiSource: 'Vercel API'
        };
    } catch (error) {
        console.error('获取B站视频信息失败:', error);
        throw error;
    }
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