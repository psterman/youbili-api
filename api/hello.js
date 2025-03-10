export default function handler(req, res) {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    // 返回简单响应
    res.status(200).json({
        message: 'Hello from YouBili API!',
        timestamp: new Date().toISOString(),
        env: {
            nodeEnv: process.env.NODE_ENV,
            vercel: !!process.env.VERCEL
        }
    });
} 