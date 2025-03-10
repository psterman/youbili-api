import fetch from 'node-fetch';

// API 处理函数
export default async function handler(req, res) {
    try {
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

        // 检测平台
        if (isYouTubeUrl(url)) {
            console.log('检测到YouTube链接');
            const videoId = extractYouTubeVideoId(url);
            if (!videoId) {
                return res.status(400).json({ error: '无法识别YouTube视频ID，请确保链接格式正确' });
            }
            const videoInfo = await getYouTubeInfo(videoId, url);
            return res.status(200).json(videoInfo);
        } else if (isBilibiliUrl(url)) {
            console.log('检测到B站链接');
            const videoId = extractBilibiliVideoId(url);
            if (!videoId) {
                return res.status(400).json({ error: '无法识别B站视频ID，请确保链接格式正确' });
            }
            const videoInfo = await getBilibiliInfo(videoId, url);
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
async function getYouTubeInfo(videoId, originalUrl) {
    try {
        // 1. 获取视频标题和上传者
        let title = `YouTube视频 ${videoId}`;
        let uploader = 'YouTube';
        let thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

        try {
            const oembedResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            if (oembedResponse.ok) {
                const oembedData = await oembedResponse.json();
                title = oembedData.title || title;
                uploader = oembedData.author_name || uploader;
            }
        } catch (e) {
            console.warn('获取YouTube视频元数据失败:', e);
        }

        // 2. 尝试使用 Cobalt API 获取真实下载链接
        let formats = [];
        try {
            const cobaltUrl = `https://co.wuk.sh/api/json`;
            const cobaltResponse = await fetch(cobaltUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    url: `https://www.youtube.com/watch?v=${videoId}`,
                    vCodec: 'h264',
                    aFormat: 'mp3',
                    filenamePattern: 'basic',
                    isAudioOnly: false,
                    isNoTTWatermark: true,
                    isTTFullAudio: false,
                    isAudioMuted: false,
                    dubLang: false
                })
            });

            if (cobaltResponse.ok) {
                const cobaltData = await cobaltResponse.json();
                if (cobaltData.url) {
                    formats.push({
                        quality: '高清',
                        format: 'mp4',
                        size: '自动检测',
                        url: cobaltData.url,
                        isDirectLink: true
                    });
                }
            }
        } catch (e) {
            console.warn('使用Cobalt获取下载链接失败:', e);
        }

        // 3. 如果没有获取到真实链接，提供备用下载服务
        if (formats.length === 0) {
            formats = [
                {
                    quality: '1080p',
                    format: 'mp4',
                    size: '自动检测',
                    url: `https://cobalt.tools/api/json?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`,
                    isDirectLink: false
                },
                {
                    quality: '720p',
                    format: 'mp4',
                    size: '自动检测',
                    url: `https://9xbuddy.com/process?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`,
                    isDirectLink: false
                },
                {
                    quality: '480p',
                    format: 'mp4',
                    size: '自动检测',
                    url: `https://www.y2mate.com/youtube/${videoId}`,
                    isDirectLink: false
                }
            ];
        }

        return {
            id: videoId,
            title: title,
            uploader: uploader,
            thumbnail: thumbnail,
            formats: formats,
            originalUrl: originalUrl,
            apiSource: 'Vercel API'
        };
    } catch (error) {
        console.error('获取YouTube视频信息失败:', error);

        // 返回备用下载选项
        return {
            id: videoId,
            title: `YouTube视频 ${videoId}`,
            uploader: 'YouTube',
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            formats: [
                {
                    quality: '高清',
                    format: 'mp4',
                    size: '自动检测',
                    url: `https://9xbuddy.com/process?url=https://www.youtube.com/watch?v=${videoId}`,
                    isDirectLink: false
                }
            ],
            originalUrl: originalUrl,
            apiSource: 'Vercel API (备用)'
        };
    }
}

// 获取B站视频信息
async function getBilibiliInfo(videoId, originalUrl) {
    try {
        // 尝试使用第三方 API 获取B站视频信息
        let title = `B站视频 ${videoId}`;
        let uploader = 'B站UP主';
        let thumbnail = '';
        let formats = [];

        try {
            // 尝试使用 injahow API 获取视频信息
            const apiUrl = `https://api.injahow.cn/bparse/?url=https://www.bilibili.com/video/${videoId}&type=json`;
            const response = await fetch(apiUrl);

            if (response.ok) {
                const data = await response.json();
                if (data.title) title = data.title;
                if (data.author) uploader = data.author;
                if (data.pic) thumbnail = data.pic;

                // 如果有直接下载链接
                if (data.data && data.data.durl && data.data.durl.length > 0) {
                    data.data.durl.forEach((item, index) => {
                        let quality = '未知';
                        if (index === 0) quality = '高清';
                        else if (index === 1) quality = '标清';

                        formats.push({
                            quality: quality,
                            format: 'mp4',
                            size: '自动检测',
                            url: item.url,
                            isDirectLink: true
                        });
                    });
                }
            }
        } catch (e) {
            console.warn('获取B站视频信息失败:', e);
        }

        // 如果没有获取到直接链接，提供备用下载服务
        if (formats.length === 0) {
            formats = [
                {
                    quality: '高清',
                    format: 'mp4',
                    size: '自动检测',
                    url: `https://bilibili.iiilab.com/?bvid=${videoId}`,
                    isDirectLink: false
                },
                {
                    quality: '标清',
                    format: 'mp4',
                    size: '自动检测',
                    url: `https://xbeibeix.com/api/bilibili/biliplayer/?url=https://www.bilibili.com/video/${videoId}`,
                    isDirectLink: false
                }
            ];
        }

        return {
            id: videoId,
            title: title,
            uploader: uploader,
            thumbnail: thumbnail,
            formats: formats,
            originalUrl: originalUrl,
            apiSource: 'Vercel API'
        };
    } catch (error) {
        console.error('获取B站视频信息失败:', error);

        // 返回备用下载选项
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
                    url: `https://bilibili.iiilab.com/?bvid=${videoId}`,
                    isDirectLink: false
                }
            ],
            originalUrl: originalUrl,
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