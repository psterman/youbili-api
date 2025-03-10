export default function handler(req, res) {
    res.status(200).json({
        message: 'Hello from Vercel API!',
        timestamp: new Date().toISOString(),
        env: {
            vercel: !!process.env.VERCEL,
            nodeEnv: process.env.NODE_ENV
        }
    });
} 