import fetch from 'node-fetch';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const YT_DLP_PATH = '/app/yt-dlp';

// 平台识别正则表达式
const PLATFORM_PATTERNS = {
    youtube: /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
    bilibili: /(?:bilibili\.com\/video\/(?:av|BV)([a-zA-Z0-9]+))|(?:b23\.tv\/([a-zA-Z0-9]+))/i
};

// 从URL中提取视频ID
function extractVideoId(url) {
    for (const [platform, pattern] of Object.entries(PLATFORM_PATTERNS)) {
        const match = url.match(pattern);
        if (match) {
            return {
                platform,
                id: match[1] || match[2]
            };
        }
    }
    return null;
}

// 检查并安装 yt-dlp
async function ensureYtDlp() {
    try {
        await execAsync('which yt-dlp');
    } catch (error) {
        console.log('Installing yt-dlp...');
        try {
            // 下载旧版本的 yt-dlp (支持 Python 3.7+)
            await execAsync('curl -L https://github.com/yt-dlp/yt-dlp/releases/download/2022.01.21/yt-dlp -o /app/yt-dlp');
            await execAsync('chmod +x /app/yt-dlp');
        } catch (installError) {
            throw new Error('Failed to install yt-dlp');
        }
    }
}

// 获取视频下载链接
async function getVideoDownloadLinks(url) {
    try {
        // 确保 yt-dlp 已安装
        await ensureYtDlp();

        // 使用 yt-dlp 获取视频信息和下载链接
        const { stdout } = await execAsync(`${YT_DLP_PATH} -j "${url}" --no-warnings`);
        const info = JSON.parse(stdout);

        // 过滤并整理下载链接
        const formats = [];

        // 处理视频格式
        if (info.formats) {
            for (const format of info.formats) {
                // 只选择有视频的格式
                if (format.vcodec !== 'none' && format.url) {
                    formats.push({
                        quality: format.height ? `${format.height}p` : '未知',
                        format: format.ext || 'mp4',
                        url: format.url,
                        size: format.filesize ? `${(format.filesize / 1024 / 1024).toFixed(2)} MB` : '未知',
                        vcodec: format.vcodec,
                        acodec: format.acodec
                    });
                }
            }
        }

        // 按质量排序
        formats.sort((a, b) => {
            const heightA = parseInt(a.quality) || 0;
            const heightB = parseInt(b.quality) || 0;
            return heightB - heightA;
        });

    return {
            title: info.title || '未知标题',
            thumbnail: info.thumbnail || '',
            uploader: info.uploader || '未知上传者',
            duration: info.duration || 0,
            formats: formats.slice(0, 5), // 只返回最好的5个格式
            platform: info.extractor_key || '未知平台',
            originalUrl: url
        };
    } catch (error) {
        console.error('获取视频下载链接失败:', error);
        throw new Error('获取视频下载链接失败，请检查视频链接是否有效');
    }
}

export default async function handler(req, res) {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: '请提供视频URL' });
    }

        // 获取视频下载链接
        const info = await getVideoDownloadLinks(url);
        res.json(info);
    } catch (error) {
        console.error('处理失败:', error);
        res.status(500).json({ error: error.message || '获取视频下载链接失败' });
    }
}