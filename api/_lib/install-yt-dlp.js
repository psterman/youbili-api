import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const YT_DLP_PATH = path.join(process.cwd(), 'api', '_lib', 'yt-dlp');

try {
    // 下载最新版本的 yt-dlp
    console.log('正在下载 yt-dlp...');
    execSync(`curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o ${YT_DLP_PATH}`);

    // 设置执行权限
    console.log('设置执行权限...');
    execSync(`chmod +x ${YT_DLP_PATH}`);

    console.log('yt-dlp 安装成功！');
} catch (error) {
    console.error('安装失败:', error);
    process.exit(1);
} 