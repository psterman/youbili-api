export default function handler(req, res) {
  try {
    // 设置 CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    // 返回简单响应
    return res.status(200).json({
      message: 'Hello from YouBili API!',
      timestamp: new Date().toISOString(),
      env: {
        nodeEnv: process.env.NODE_ENV || 'unknown'
      }
    });
  } catch (error) {
    console.error('Hello API错误:', error);
    return res.status(500).json({
      error: '服务器内部错误',
      message: error.message
    });
  }
} 