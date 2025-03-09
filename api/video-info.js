import fetch from 'node-fetch';

// 支持的平台
const PLATFORMS = {
    YOUTUBE: 'youtube',
    BILIBILI: 'bilibili'
};

// API 处理函数
export default async function handler(req, res) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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
            const videoInfo = await getYouTubeDirectLinks(videoId);
            return res.status(200).json(videoInfo);
        } else if (isBilibiliUrl(url)) {
            console.log('检测到B站链接');
            const videoId = extractBilibiliVideoId(url);
            if (!videoId) {
                return res.status(400).json({ error: '无法识别B站视频ID，请确保链接格式正确' });
            }
            const videoInfo = await getBilibiliDirectLinks(videoId);
            return res.status(200).json(videoInfo);
        } else {
            return res.status(400).json({ error: '不支持的视频平台，目前仅支持YouTube和B站' });
        }
    } catch (error) {
        console.error('获取视频信息失败:', error);
        return res.status(500).json({ error: '获取视频信息失败', message: error.message });
    }
}

// 获取YouTube直接下载链接
async function getYouTubeDirectLinks(videoId) {
    try {
        // 使用 y2mate API 获取视频信息
        const apiUrl = `https://www.y2mate.com/mates/analyzeV2/ajax`;

        const formData = new URLSearchParams();
        formData.append('k_query', `https://www.youtube.com/watch?v=${videoId}`);
        formData.append('k_page', 'home');
        formData.append('hl', 'en');
        formData.append('q_auto', '0');

        const response = await fetch(apiUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-Requested-With': 'XMLHttpRequest',
                'Origin': 'https://www.y2mate.com',
                'Referer': 'https://www.y2mate.com/'
            }
        });

        if (!response.ok) {
            throw new Error('Y2mate API请求失败');
        }

        const data = await response.json();

        if (!data.links || !data.links.mp4) {
            throw new Error('Y2mate未返回有效的下载链接');
        }

        // 提取视频信息
        const title = data.title || `YouTube视频 ${videoId}`;
        const thumbnail = data.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        // 提取MP4格式的下载链接
        const formats = [];
        const mp4Links = data.links.mp4;

        Object.keys(mp4Links).forEach(key => {
            const item = mp4Links[key];
            if (item.f === 'mp4') {
                formats.push({
                    quality: item.q || '未知',
                    format: 'mp4',
                    size: item.size || '未知',
                    url: item.url || ''
                });
            }
        });

        return {
            id: videoId,
            title: title,
            uploader: data.a || 'YouTube',
            thumbnail: thumbnail,
            formats: formats,
            apiSource: 'Vercel API'
        };
    } catch (error) {
        console.error('获取YouTube视频信息失败:', error);

        // 返回备用下载链接
        return {
            id: videoId,
            title: `YouTube视频 ${videoId}`,
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
                },
                {
                    quality: '原始质量',
                    format: 'mp4',
                    size: '自动检测',
                    url: `https://ssyoutube.com/watch?v=${videoId}`
                }
            ],
            apiSource: 'Vercel API (备用)'
        };
    }
}

// 获取B站直接下载链接
async function getBilibiliDirectLinks(videoId) {
    try {
        // 使用第三方 API
        const apiUrl = `https://api.injahow.cn/bparse/?url=https://www.bilibili.com/video/${videoId}&type=mp4`;

        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error('获取B站视频信息失败');
        }

        const data = await response.json();

        if (!data.data || !data.data.durl) {
            throw new Error('未返回有效的下载链接');
        }

        // 提取视频信息
        const title = data.title || `B站视频 ${videoId}`;
        const uploader = data.author || 'B站UP主';

        // 提取下载链接
        const formats = data.data.durl.map((item, index) => {
            let quality = '未知';
            if (index === 0) quality = '高清';
            else if (index === 1) quality = '标清';

            return {
                quality,
                format: 'mp4',
                size: '未知',
                url: item.url
            };
        });

        return {
            id: videoId,
            title,
            uploader,
            formats,
            apiSource: 'Vercel API'
        };
    } catch (error) {
        console.error('获取B站视频信息失败:', error);

        // 返回备用下载链接
        return {
            id: videoId,
            title: `B站视频 ${videoId}`,
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
                },
                {
                    quality: '标清',
                    format: 'mp4',
                    size: '自动检测',
                    url: `https://injahow.com/bparse/?url=https://www.bilibili.com/video/${videoId}`
                }
            ],
            apiSource: 'Vercel API (备用)'
        };
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