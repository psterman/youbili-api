const fetch = require('node-fetch');

// 支持的平台
const PLATFORMS = {
    YOUTUBE: 'youtube',
    BILIBILI: 'bilibili'
};

// 简单的内存缓存
const cache = new Map();
const CACHE_TTL = 3600000; // 1小时

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
    try {
        // 使用y2mate API
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
            formats: formats
        };
    } catch (error) {
        console.error('获取YouTube视频信息失败:', error);

        // 尝试使用9xbuddy
        try {
            const apiUrl = `https://9xbuddy.org/process?url=https://www.youtube.com/watch?v=${videoId}`;

            const response = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!response.ok) {
                throw new Error('9xbuddy API请求失败');
            }

            const data = await response.json();

            if (!data.data || !data.data.mp4) {
                throw new Error('9xbuddy未返回有效的下载链接');
            }

            // 提取视频信息
            const title = data.data.title || `YouTube视频 ${videoId}`;

            // 提取MP4格式的下载链接
            const formats = data.data.mp4.map(item => ({
                quality: item.quality || '未知',
                format: 'mp4',
                size: item.size || '未知',
                url: item.url || ''
            }));

            return {
                id: videoId,
                title: title,
                uploader: 'YouTube',
                formats: formats
            };
        } catch (buddyError) {
            console.error('9xbuddy API失败:', buddyError);

            // 返回备用下载链接
            return {
                id: videoId,
                title: `YouTube视频 ${videoId}`,
                uploader: 'YouTube',
                formats: [
                    {
                        quality: '高清',
                        format: 'mp4',
                        size: '未知',
                        url: `https://www.y2mate.com/youtube/${videoId}`
                    },
                    {
                        quality: '标清',
                        format: 'mp4',
                        size: '未知',
                        url: `https://9xbuddy.org/download?url=https://www.youtube.com/watch?v=${videoId}`
                    },
                    {
                        quality: '原始质量',
                        format: 'mp4',
                        size: '未知',
                        url: `https://ssyoutube.com/watch?v=${videoId}`
                    }
                ]
            };
        }
    }
}

// 获取B站视频信息
async function getBilibiliVideoInfo(videoId) {
    try {
        // 使用第三方API
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
            formats
        };
    } catch (error) {
        console.error('获取B站视频信息失败:', error);

        // 尝试使用BiliGet
        try {
            const apiUrl = `https://bili.iiilab.com/api/video/info?bvid=${videoId}`;

            const response = await fetch(apiUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            if (!response.ok) {
                throw new Error('BiliGet API请求失败');
            }

            const data = await response.json();

            if (data.code !== 0 || !data.data) {
                throw new Error('BiliGet未返回有效的下载链接');
            }

            // 提取视频信息
            const videoInfo = data.data;
            const title = videoInfo.title || `B站视频 ${videoId}`;
            const uploader = videoInfo.owner?.name || 'B站UP主';

            // 获取下载链接
            const formats = [];

            if (videoInfo.pages && videoInfo.pages.length > 0) {
                const page = videoInfo.pages[0];
                const cid = page.cid;

                // 获取视频播放地址
                const playUrl = `https://bili.iiilab.com/api/video/download?bvid=${videoId}&cid=${cid}&qn=80&type=mp4`;

                const playResponse = await fetch(playUrl);
                const playData = await playResponse.json();

                if (playData.code === 0 && playData.data && playData.data.url) {
                    formats.push({
                        quality: '高清',
                        format: 'mp4',
                        size: '未知',
                        url: playData.data.url
                    });
                }
            }

            if (formats.length > 0) {
                return {
                    id: videoId,
                    title,
                    uploader,
                    formats
                };
            }

            throw new Error('无法获取下载链接');
        } catch (biliGetError) {
            console.error('BiliGet API失败:', biliGetError);

            // 返回备用下载链接
            return {
                id: videoId,
                title: `B站视频 ${videoId}`,
                uploader: 'B站UP主',
                formats: [
                    {
                        quality: '高清',
                        format: 'mp4',
                        size: '未知',
                        url: `https://xbeibeix.com/api/bilibili/biliplayer/?url=https://www.bilibili.com/video/${videoId}`
                    },
                    {
                        quality: '标清',
                        format: 'mp4',
                        size: '未知',
                        url: `https://bili.iiilab.com/?bvid=${videoId}`
                    },
                    {
                        quality: '原始质量',
                        format: 'mp4',
                        size: '未知',
                        url: `https://injahow.com/bparse/?url=https://www.bilibili.com/video/${videoId}`
                    }
                ]
            };
        }
    }
}

// 主处理函数
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

    // 检查缓存
    const cacheKey = `video:${url}`;
    if (cache.has(cacheKey)) {
        const { data, timestamp } = cache.get(cacheKey);
        if (Date.now() - timestamp < CACHE_TTL) {
            return res.status(200).json(data);
        }
        cache.delete(cacheKey); // 缓存过期，删除
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

        // 存入缓存
        cache.set(cacheKey, {
            data: videoInfo,
            timestamp: Date.now()
        });

        return res.status(200).json(videoInfo);
    } catch (error) {
        console.error('处理视频信息请求失败:', error);
        return res.status(500).json({ error: '获取视频信息失败', message: error.message });
    }
}; 