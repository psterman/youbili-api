import ytdl from 'ytdl-core';

export default async function handler(req, res) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { videoId, quality } = req.query;

    if (!videoId) {
        return res.status(400).json({ error: '缺少视频ID' });
    }

    try {
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // 获取视频信息
        const info = await ytdl.getInfo(videoUrl);

        // 根据请求的质量选择合适的格式
        let format;
        switch (quality) {
            case '360':
                format = ytdl.chooseFormat(info.formats, { quality: 'lowest' });
                break;
            case '720':
                format = ytdl.chooseFormat(info.formats, { quality: 'high' });
                break;
            case '1080':
                format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
                break;
            case 'auto':
                format = ytdl.chooseFormat(info.formats, { quality: 'highest' });
                break;
            default:
                return res.status(400).json({ error: '不支持的视频质量' });
        }

        if (!format || !format.url) {
            throw new Error('无法获取下载链接');
        }

        // 返回直接下载链接
        return res.json({
            url: format.url,
            quality: format.qualityLabel || quality,
            format: format.container,
            size: format.contentLength ? `${(format.contentLength / 1024 / 1024).toFixed(2)} MB` : '未知'
        });
    } catch (error) {
        console.error('获取下载链接失败:', error);
        return res.status(500).json({
            error: '获取下载链接失败',
            message: error.message
        });
    }
} 