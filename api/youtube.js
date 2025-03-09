// 这是一个示例API文件，用于获取YouTube视频下载链接
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

// 获取YouTube视频信息
export async function getYouTubeVideoInfo(videoId) {
    try {
        // 直接使用y2mate API - 这是一个更可靠的选择
        return await getY2mateLinks(videoId);
    } catch (error) {
        console.error('Y2mate API失败:', error);

        // 尝试使用9xbuddy
        try {
            return await get9xBuddyLinks(videoId);
        } catch (buddyError) {
            console.error('9xbuddy API失败:', buddyError);

            // 尝试使用ssyoutube
            try {
                return await getSSYoutubeLinks(videoId);
            } catch (ssError) {
                console.error('ssyoutube API失败:', ssError);

                // 最后尝试使用savefrom
                try {
                    return await getSaveFromLinks(videoId);
                } catch (saveFromError) {
                    console.error('savefrom API失败:', saveFromError);
                    throw new Error('无法获取YouTube视频下载链接');
                }
            }
        }
    }
}

// 使用Y2mate获取下载链接
async function getY2mateLinks(videoId) {
    const corsProxy = getRandomCorsProxy();
    const apiUrl = `${corsProxy}https://www.y2mate.com/mates/analyzeV2/ajax`;

    const formData = new FormData();
    formData.append('k_query', `https://www.youtube.com/watch?v=${videoId}`);
    formData.append('k_page', 'home');
    formData.append('hl', 'zh');
    formData.append('q_auto', '0');

    const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'X-Requested-With': 'XMLHttpRequest'
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

    // 按质量排序
    formats.sort((a, b) => {
        const qualityA = parseInt(a.quality) || 0;
        const qualityB = parseInt(b.quality) || 0;
        return qualityB - qualityA;
    });

    return {
        id: videoId,
        title: title,
        uploader: 'YouTube',
        thumbnail: thumbnail,
        formats: formats
    };
}

// 使用9xbuddy获取下载链接
async function get9xBuddyLinks(videoId) {
    const corsProxy = getRandomCorsProxy();
    const apiUrl = `${corsProxy}https://9xbuddy.org/process?url=https://www.youtube.com/watch?v=${videoId}`;

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
    const thumbnail = data.data.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

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
        thumbnail: thumbnail,
        formats: formats
    };
}

// 使用ssyoutube获取下载链接
async function getSSYoutubeLinks(videoId) {
    const corsProxy = getRandomCorsProxy();
    const apiUrl = `${corsProxy}https://ssyoutube.com/api/convert`;

    const formData = new FormData();
    formData.append('url', `https://www.youtube.com/watch?v=${videoId}`);

    const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (!response.ok) {
        throw new Error('ssyoutube API请求失败');
    }

    const data = await response.json();

    if (!data.url || !Array.isArray(data.url)) {
        throw new Error('ssyoutube未返回有效的下载链接');
    }

    // 提取视频信息
    const title = data.meta?.title || `YouTube视频 ${videoId}`;
    const thumbnail = data.meta?.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // 提取MP4格式的下载链接
    const formats = data.url
        .filter(item => item.ext === 'mp4' && item.type.includes('video'))
        .map(item => ({
            quality: item.quality || item.subname || '未知',
            format: 'mp4',
            size: item.filesize ? `${Math.round(item.filesize / (1024 * 1024))}MB` : '未知',
            url: item.url || ''
        }));

    return {
        id: videoId,
        title: title,
        uploader: data.meta?.author || 'YouTube',
        thumbnail: thumbnail,
        formats: formats
    };
}

// 使用savefrom获取下载链接
async function getSaveFromLinks(videoId) {
    const corsProxy = getRandomCorsProxy();
    const apiUrl = `${corsProxy}https://sfrom.net/api/convert`;

    const formData = new URLSearchParams();
    formData.append('url', `https://www.youtube.com/watch?v=${videoId}`);

    const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    if (!response.ok) {
        throw new Error('savefrom API请求失败');
    }

    const data = await response.json();

    if (!data.links || !Array.isArray(data.links)) {
        throw new Error('savefrom未返回有效的下载链接');
    }

    // 提取视频信息
    const title = data.title || `YouTube视频 ${videoId}`;
    const thumbnail = data.thumb || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // 提取MP4格式的下载链接
    const formats = data.links
        .filter(item => item.type === 'mp4')
        .map(item => ({
            quality: item.quality || '未知',
            format: 'mp4',
            size: item.size || '未知',
            url: item.url || ''
        }));

    return {
        id: videoId,
        title: title,
        uploader: data.uploader || 'YouTube',
        thumbnail: thumbnail,
        formats: formats
    };
}

// 备用方案：使用直接下载链接
export async function fallbackYouTubeDownload(videoId) {
    // 创建直接下载链接
    // 这些链接会重定向到下载页面
    const formats = [
        {
            quality: '720p',
            format: 'mp4',
            size: '未知',
            url: `https://www.y2mate.com/youtube/${videoId}`
        },
        {
            quality: '1080p',
            format: 'mp4',
            size: '未知',
            url: `https://9xbuddy.org/download?url=https://www.youtube.com/watch?v=${videoId}`
        },
        {
            quality: '最高质量',
            format: 'mp4',
            size: '未知',
            url: `https://ssyoutube.com/watch?v=${videoId}`
        }
    ];

    return {
        id: videoId,
        title: `YouTube视频 ${videoId}`,
        uploader: 'YouTube',
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        formats: formats
    };
}

// 注意：这些函数仅用于演示
// 在实际应用中，你需要：
// 1. 使用真实的API服务
// 2. 处理跨域问题
// 3. 考虑服务器端代理
// 4. 处理错误和异常情况 