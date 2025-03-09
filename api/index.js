// API入口文件
// 导入各平台的API处理函数
import { fallbackYouTubeDownload } from './youtube.js';
import { fallbackBilibiliDownload } from './bilibili.js';

// Vercel API端点 - 使用根目录部署的API
const VERCEL_API_ENDPOINT = 'https://youbili.vercel.app/api/video-info';

// 视频信息API
export async function getVideoInfo(url) {
    try {
        console.log('正在处理视频链接:', url);

        // 尝试使用Vercel API
        try {
            console.log('正在请求Vercel API:', VERCEL_API_ENDPOINT);

            // 调用Vercel API
            const apiUrl = `${VERCEL_API_ENDPOINT}?url=${encodeURIComponent(url)}`;
            console.log('完整API请求URL:', apiUrl);

            const response = await fetch(apiUrl);
            console.log('API响应状态:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Vercel API请求失败:', errorText);
                throw new Error(`API请求失败: ${response.status}`);
            }

            const data = await response.json();
            console.log('Vercel API返回数据:', data);

            // 如果API返回了有效数据
            if (data && data.formats && data.formats.length > 0) {
                // 添加API来源信息
                data.apiSource = 'Vercel API';
                return data;
            }

            // 如果没有返回有效数据，抛出错误
            throw new Error('Vercel API未返回有效的下载链接');
        } catch (apiError) {
            console.error('Vercel API调用失败，使用备用方法:', apiError);

            // 使用备用方法
            if (isYouTubeUrl(url)) {
                console.log('检测到YouTube链接，使用备用下载服务');
                const videoId = extractYouTubeVideoId(url);
                if (!videoId) {
                    throw new Error('无法识别YouTube视频ID，请确保链接格式正确');
                }
                return await getYouTubeDirectLinks(videoId);
            } else if (isBilibiliUrl(url)) {
                console.log('检测到B站链接，使用备用下载服务');
                const videoId = extractBilibiliVideoId(url);
                if (!videoId) {
                    throw new Error('无法识别B站视频ID，请确保链接格式正确');
                }
                return await getBilibiliDirectLinks(videoId);
            } else {
                throw new Error('不支持的视频平台，目前仅支持YouTube和B站');
            }
        }
    } catch (error) {
        console.error('获取视频信息失败:', error);

        // 尝试使用备用方法
        console.log('尝试使用备用方法获取下载链接');

        if (isYouTubeUrl(url)) {
            const videoId = extractYouTubeVideoId(url);
            if (videoId) {
                return await fallbackYouTubeDownload(videoId);
            }
        } else if (isBilibiliUrl(url)) {
            const videoId = extractBilibiliVideoId(url);
            if (videoId) {
                return await fallbackBilibiliDownload(videoId);
            }
        }

        throw error;
    }
}

// 获取YouTube直接下载链接
async function getYouTubeDirectLinks(videoId) {
    // 创建直接下载链接
    const formats = [
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
    ];

    return {
        id: videoId,
        title: `YouTube视频 (ID: ${videoId})`,
        uploader: 'YouTube',
        formats: formats,
        apiSource: '直接下载服务'
    };
}

// 获取B站直接下载链接
async function getBilibiliDirectLinks(videoId) {
    // 创建直接下载链接
    const formats = [
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
    ];

    return {
        id: videoId,
        title: `B站视频 (ID: ${videoId})`,
        uploader: 'B站UP主',
        formats: formats,
        apiSource: '直接下载服务'
    };
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

    // 处理其他可能的格式
    match = url.match(/youtube\.com\/.*[?&]v=([^&#]*)/);
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