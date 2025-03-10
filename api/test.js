export default function handler(req, res) {
    try {
        // 设置 CORS 头
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Type', 'application/json');

        // 返回简单响应
        return res.status(200).json({
            message: 'Test endpoint is working!',
            timestamp: new Date().toISOString(),
            query: req.query,
            method: req.method,
            headers: {
                host: req.headers.host,
                userAgent: req.headers['user-agent']
            }
        });
    } catch (error) {
        console.error('Test API错误:', error);
        return res.status(500).json({
            error: '服务器内部错误',
            message: error.message
        });
    }
} 