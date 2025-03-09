# 视频下载API服务说明

本文档提供了关于YouBili视频下载助手使用的API服务的详细信息，以及如何替换或更新这些服务。

## 当前使用的API服务

### YouTube视频

1. **主要API**: ytdl-api.vercel.app
   - 用途: 获取YouTube视频信息和下载链接
   - 请求格式: `https://ytdl-api.vercel.app/api/info?id={VIDEO_ID}`
   - 返回格式: JSON，包含视频标题、作者、格式列表等

2. **备用API**: api.vevioz.com
   - 用途: 当主要API失败时的备用方案
   - 请求格式: `https://api.vevioz.com/api/info?v={VIDEO_ID}`
   - 返回格式: 类似主要API

3. **备用方案**: savefrom.net API
   - 用途: 当其他API都失败时的最后方案
   - 请求格式: `https://api.savefrom.net/api/info?url=https://www.youtube.com/watch?v={VIDEO_ID}`
   - 返回格式: 不同于前两种API，需要特殊处理

### B站视频

1. **主要API**: weibomiaopai.com
   - 用途: 获取B站视频信息和下载链接
   - 请求格式: `https://weibomiaopai.com/online-video-downloader/bilibili-api-server/api/video/?server={SERVER_NUM}&video=https://www.bilibili.com/video/{VIDEO_ID}`
   - 返回格式: JSON，包含视频URL列表
   - 特点: 有多个服务器可选(0-16)，可以随机选择以分散负载

2. **备用API**: bili-api.vercel.app
   - 用途: 当主要API失败时的备用方案
   - 请求格式: `https://bili-api.vercel.app/api/video?id={VIDEO_ID}`
   - 返回格式: JSON，包含视频信息和下载链接

3. **备用方案**: B站官方API
   - 用途: 当其他API都失败时的最后方案
   - 步骤:
     1. 获取视频信息: `https://api.bilibili.com/x/web-interface/view?bvid={VIDEO_ID}`
     2. 获取视频播放地址: `https://api.bilibili.com/x/player/playurl?bvid={VIDEO_ID}&cid={CID}&qn=80&type=mp4`
   - 特点: 直接使用B站官方API，但可能有更多限制

## 替代API服务

如果当前使用的API服务不可用，可以考虑以下替代方案：

### YouTube替代API

1. **y2mate API**
   - 请求格式: `https://www.y2mate.com/mates/analyze/ajax`
   - 方法: POST
   - 数据: `url=https://www.youtube.com/watch?v={VIDEO_ID}`

2. **9xbuddy API**
   - 请求格式: `https://9xbuddy.com/process?url=https://www.youtube.com/watch?v={VIDEO_ID}`

3. **自建API服务**
   - 使用youtube-dl或yt-dlp搭建自己的API服务
   - 可以部署在Vercel、Netlify等平台上

### B站替代API

1. **解析网站API**
   - 多个视频解析网站提供API服务
   - 例如: `https://api.injahow.cn/bparse/?url=https://www.bilibili.com/video/{VIDEO_ID}`

2. **第三方开源项目**
   - 使用如bilibili-api等开源项目
   - GitHub上有多个B站视频下载的开源项目

## 实现自己的API服务

如果想要更稳定的服务，可以考虑实现自己的API服务：

1. **使用Vercel部署Serverless函数**
   - 创建基于Node.js的API函数
   - 使用youtube-dl-exec或similar-youtube-dl等库
   - 部署到Vercel获得免费的API端点

2. **使用Cloudflare Workers**
   - 创建轻量级的Worker脚本
   - 可以作为代理转发请求到其他服务

3. **使用GitHub Actions**
   - 创建定时任务抓取视频信息
   - 将结果存储在GitHub Pages上

## 注意事项

1. **API使用限制**
   - 大多数免费API都有使用限制
   - 考虑实现请求缓存机制减少API调用

2. **跨域问题**
   - 前端直接调用某些API可能会遇到跨域问题
   - 可以使用CORS代理或自己的API服务解决

3. **合法性考虑**
   - 确保遵守相关法律法规和平台规定
   - 仅用于个人学习和研究目的

4. **API变更**
   - 第三方API可能随时变更或关闭
   - 实现多个备用方案并定期检查API状态 