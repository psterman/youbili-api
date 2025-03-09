# YouBili 视频下载助手

一个简单易用的网页工具，帮助用户从YouTube和哔哩哔哩(B站)获取视频的下载链接。

## 功能特点

- 支持YouTube和B站视频链接
- 自动识别视频平台
- 提供多种清晰度选项
- 简洁美观的用户界面
- 完全基于前端技术，可部署在GitHub Pages上
- 使用Vercel API获取真实下载链接

## 使用方法

1. 访问网站 [https://你的用户名.github.io/youbili](https://你的用户名.github.io/youbili)
2. 将YouTube或B站视频链接粘贴到输入框中
3. 点击"获取下载链接"按钮
4. 选择所需的视频质量，点击下载按钮

## 支持的链接格式

### YouTube
- 标准链接: https://www.youtube.com/watch?v=VIDEO_ID
- 短链接: https://youtu.be/VIDEO_ID
- 嵌入链接: https://www.youtube.com/embed/VIDEO_ID

### 哔哩哔哩
- 标准链接: https://www.bilibili.com/video/BV1xx411c7mD
- 短链接: https://b23.tv/xxxxx

## 技术说明

本项目是一个前端应用，结合Vercel API服务，使用以下技术：

- HTML5
- CSS3
- JavaScript (ES6+)
- Vercel Serverless Functions

### 使用的API服务

本项目使用以下免费的公共API服务来获取视频下载链接：

#### YouTube视频
- 主要API: Vercel自定义API (基于y2mate和9xbuddy)
- 备用方案: 直接使用第三方下载网站

#### B站视频
- 主要API: Vercel自定义API (基于injahow和BiliGet)
- 备用方案: 直接使用第三方下载网站

**注意**：这些API服务可能会有使用限制或随时变更，如果遇到问题，请参考备用下载方法。

## 项目结构

```
youbili/
├── index.html          # 主页面
├── css/                # 样式文件
│   └── style.css
├── js/                 # 前端脚本
│   └── app.js
├── api/                # API模块
│   ├── index.js        # API入口
│   ├── youtube.js      # YouTube处理
│   └── bilibili.js     # B站处理
└── vercel-api/         # Vercel API项目
    ├── api/
    │   └── video-info.js  # API端点
    ├── package.json
    └── vercel.json
```

## 部署说明

### 前端部署 (GitHub Pages)

请参考 [DEPLOY.md](DEPLOY.md) 文件了解如何部署前端部分。

### API部署 (Vercel)

请参考 [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md) 文件了解如何部署API部分。

## 免责声明

本工具仅用于个人学习和研究目的，请遵守相关法律法规和平台规定。用户应对下载的内容负责，确保不侵犯版权或其他权利。

## 许可证

MIT 