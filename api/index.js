// API入口文件
// 导入各平台的API处理函数
import { fallbackYouTubeDownload } from './youtube.js';
import { fallbackBilibiliDownload } from './bilibili.js';

// Vercel API端点 - 部署后替换为您的实际URL
const VERCEL_API_ENDPOINT = 'https://youbili-api.vercel.app/api/video-info';

// 视频信息API
export async function getVideoInfo(url) {
    try {
        // 调用Vercel API
        const apiUrl = `${VERCEL_API_ENDPOINT}?url=${encodeURIComponent(url)}`;

        console.log('正在请求Vercel API:', apiUrl);

        const response = await fetch(apiUrl);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '获取视频信息失败');
        }

        const data = await response.json();

        // 如果没有获取到格式信息，尝试使用备用方法
        if (!data.formats || data.formats.length === 0) {
            console.log('Vercel API未返回有效的下载链接，尝试使用备用方法');

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
            throw new Error('无法获取视频下载链接');
        }

        return data;
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

// 生成下载链接API
export async function generateDownloadLink(url, quality) {
    try {
        // 判断视频平台
        if (isYouTubeUrl(url)) {
            const videoId = extractYouTubeVideoId(url);
            if (!videoId) {
                throw new Error('无法识别YouTube视频ID');
            }
            return await generateYouTubeDownloadLink(videoId, quality);
        } else if (isBilibiliUrl(url)) {
            // 处理B站短链接
            if (url.includes('b23.tv')) {
                const resolved = await resolveBilibiliShortLink(url);
                url = resolved.resolvedUrl;
            }

            const videoId = extractBilibiliVideoId(url);
            if (!videoId) {
                throw new Error('无法识别B站视频ID');
            }
            return await generateBilibiliDownloadLink(videoId, quality);
        } else {
            throw new Error('不支持的视频平台');
        }
    } catch (error) {
        console.error('生成下载链接时出错:', error);
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