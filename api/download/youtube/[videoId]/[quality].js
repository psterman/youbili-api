import fetch from 'node-fetch';

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
        // 根据不同的质量选择不同的下载服务
        let downloadUrl;
        switch (quality) {
            case '360':
                downloadUrl = `https://www.y2mate.com/youtube/${videoId}`;
                break;
            case '720':
                downloadUrl = `https://9xbuddy.org/download?url=https://www.youtube.com/watch?v=${videoId}`;
                break;
            case '1080':
                downloadUrl = `https://ssyoutube.com/watch?v=${videoId}`;
                break;
            case 'auto':
                downloadUrl = `https://www.y2mate.com/youtube/${videoId}`;
                break;
            default:
                return res.status(400).json({ error: '不支持的视频质量' });
        }

        // 重定向到实际的下载链接
        res.redirect(302, downloadUrl);
    } catch (error) {
        console.error('处理下载请求失败:', error);
        return res.status(500).json({
            error: '处理下载请求失败',
            message: error.message
        });
    }
} 