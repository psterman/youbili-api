// 这是一个API文件，用于获取B站视频下载链接
// 使用公共API服务

// CORS代理列表
const corsProxies = [
    'https://corsproxy.io/?',
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/raw?url='
];

// 获取随机CORS代理
function getRandomCorsProxy() {
    return corsProxies[Math.floor(Math.random() * corsProxies.length)];
}

// 获取B站视频信息
export async function getBilibiliVideoInfo(videoId) {
    try {
        // 尝试使用injahow的API - 这是一个更可靠的选择
        return await getInjahowLinks(videoId);
    } catch (error) {
        console.error('injahow API失败:', error);

        // 尝试使用BiliGet
        try {
            return await getBiliGetLinks(videoId);
        } catch (biliGetError) {
            console.error('BiliGet API失败:', biliGetError);

            // 尝试使用weibomiaopai
            try {
                return await getWeibomiaopaiLinks(videoId);
            } catch (weiboError) {
                console.error('weibomiaopai API失败:', weiboError);

                // 最后尝试使用B站官方API
                try {
                    return await getBilibiliOfficialLinks(videoId);
                } catch (officialError) {
                    console.error('B站官方API失败:', officialError);
                    throw new Error('无法获取B站视频下载链接');
                }
            }
        }
    }
}

// 使用injahow的API获取下载链接
async function getInjahowLinks(videoId) {
    const corsProxy = getRandomCorsProxy();
    const apiUrl = `${corsProxy}https://api.injahow.cn/bparse/?url=https://www.bilibili.com/video/${videoId}&type=mp4`;

    const response = await fetch(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (!response.ok) {
        throw new Error('injahow API请求失败');
    }

    const data = await response.json();

    if (!data.data || !data.data.durl) {
        throw new Error('injahow未返回有效的下载链接');
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
}

// 使用BiliGet获取下载链接
async function getBiliGetLinks(videoId) {
    const corsProxy = getRandomCorsProxy();
    const apiUrl = `${corsProxy}https://bili.iiilab.com/api/video/info?bvid=${videoId}`;

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
        const corsProxy2 = getRandomCorsProxy(); // 使用新的代理避免缓存问题
        const playUrl = `${corsProxy2}https://bili.iiilab.com/api/video/download?bvid=${videoId}&cid=${cid}&qn=80&type=mp4`;

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

    if (formats.length === 0) {
        throw new Error('BiliGet未返回有效的下载链接');
    }

    return {
        id: videoId,
        title,
        uploader,
        formats
    };
}

// 使用weibomiaopai获取下载链接
async function getWeibomiaopaiLinks(videoId) {
    // 选择一个随机服务器
    const serverNum = Math.floor(Math.random() * 16);
    const corsProxy = getRandomCorsProxy();
    const apiUrl = `${corsProxy}https://weibomiaopai.com/online-video-downloader/bilibili-api-server/api/video/?server=${serverNum}&video=https://www.bilibili.com/video/${videoId}`;

    const response = await fetch(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://weibomiaopai.com/'
        }
    });

    if (!response.ok) {
        throw new Error('weibomiaopai API请求失败');
    }

    const data = await response.json();

    if (!data.urls || !Array.isArray(data.urls) || data.urls.length === 0) {
        throw new Error('weibomiaopai未返回有效的下载链接');
    }

    // 提取视频信息
    const title = data.title || `B站视频 ${videoId}`;
    const uploader = data.author || 'B站UP主';

    // 提取下载链接
    const formats = data.urls.map((url, index) => {
        let quality = '未知';
        if (index === 0) quality = '1080p';
        else if (index === 1) quality = '720p';
        else if (index === 2) quality = '480p';

        return {
            quality,
            format: 'mp4',
            size: '未知',
            url
        };
    });

    return {
        id: videoId,
        title,
        uploader,
        formats
    };
}

// 使用B站官方API获取下载链接
async function getBilibiliOfficialLinks(videoId) {
    // 使用CORS代理
    const corsProxy = getRandomCorsProxy();
    const apiUrl = `${corsProxy}https://api.bilibili.com/x/web-interface/view?bvid=${videoId}`;

    const response = await fetch(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (!response.ok) {
        throw new Error('B站官方API请求失败');
    }

    const data = await response.json();

    if (data.code !== 0 || !data.data) {
        throw new Error('B站官方API未返回有效数据');
    }

    const videoInfo = data.data;
    const cid = videoInfo.cid;

    // 获取视频播放地址
    const corsProxy2 = getRandomCorsProxy(); // 使用新的代理避免缓存问题
    const playUrl = `${corsProxy2}https://api.bilibili.com/x/player/playurl?bvid=${videoId}&cid=${cid}&qn=80&type=mp4`;

    const playResponse = await fetch(playUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.bilibili.com/video/' + videoId
        }
    });

    if (!playResponse.ok) {
        throw new Error('B站播放地址API请求失败');
    }

    const playData = await playResponse.json();

    if (playData.code !== 0 || !playData.data || !playData.data.durl) {
        throw new Error('B站播放地址API未返回有效数据');
    }

    // 提取下载链接
    const formats = playData.data.durl.map((item, index) => {
        let quality = '未知';
        if (playData.data.quality === 112) quality = '1080p+';
        else if (playData.data.quality === 80) quality = '1080p';
        else if (playData.data.quality === 64) quality = '720p';
        else if (playData.data.quality === 32) quality = '480p';
        else if (playData.data.quality === 16) quality = '360p';

        return {
            quality,
            format: 'mp4',
            size: item.size ? `${Math.round(item.size / (1024 * 1024))}MB` : '未知',
            url: item.url
        };
    });

    return {
        id: videoId,
        title: videoInfo.title || `B站视频 ${videoId}`,
        uploader: videoInfo.owner?.name || 'B站UP主',
        formats
    };
}

// 处理B站短链接
export async function resolveBilibiliShortLink(shortUrl) {
    try {
        // 使用CORS代理
        const corsProxy = getRandomCorsProxy();
        const proxyUrl = `${corsProxy}${shortUrl}`;

        // 发送HEAD请求获取重定向URL
        const response = await fetch(proxyUrl, {
            method: 'HEAD',
            redirect: 'manual'
        });

        // 获取重定向URL
        const location = response.headers.get('location');

        if (location) {
            // 从重定向URL中提取视频ID
            const match = location.match(/bilibili\.com\/video\/([^\/\?]+)/);
            const videoId = match ? match[1] : null;

            return {
                originalUrl: shortUrl,
                resolvedUrl: location,
                videoId: videoId
            };
        }

        throw new Error('无法解析B站短链接');
    } catch (error) {
        console.error('解析B站短链接时出错:', error);

        // 备用方案：使用另一种方法解析短链接
        try {
            // 直接访问短链接，让浏览器处理重定向
            const corsProxy = getRandomCorsProxy();
            const proxyUrl = `${corsProxy}${shortUrl}`;

            const response = await fetch(proxyUrl, {
                redirect: 'follow'
            });

            // 获取最终URL
            const finalUrl = response.url;

            if (finalUrl && finalUrl.includes('bilibili.com/video/')) {
                const match = finalUrl.match(/bilibili\.com\/video\/([^\/\?]+)/);
                const videoId = match ? match[1] : null;

                return {
                    originalUrl: shortUrl,
                    resolvedUrl: finalUrl,
                    videoId: videoId
                };
            }
        } catch (backupError) {
            console.error('备用短链接解析也失败:', backupError);
        }

        throw new Error('无法解析B站短链接');
    }
}

// 备用方案：提供直接下载链接
export async function fallbackBilibiliDownload(videoId) {
    // 创建直接下载链接
    // 这些链接会重定向到下载页面
    const formats = [
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
            url: `https://bilibili.iiilab.com/?bvid=${videoId}`
        }
    ];

    return {
        id: videoId,
        title: `B站视频 ${videoId}`,
        uploader: 'B站UP主',
        formats: formats
    };
}

// 格式化时长
function formatDuration(seconds) {
    if (!seconds) return '未知';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
} 