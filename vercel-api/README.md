# YouBili API

这是一个用于获取YouTube和B站视频下载链接的API服务，部署在Vercel上。

## 功能

- 支持YouTube和B站视频
- 提供多种格式和质量的下载链接
- 实现缓存机制减少API调用
- 多重备用下载方案

## API端点

### 获取视频信息

```
GET /api/video-info?url={视频URL}
```

#### 参数

- `url`: YouTube或B站视频链接

#### 响应

```json
{
  "id": "视频ID",
  "title": "视频标题",
  "uploader": "上传者",
  "thumbnail": "缩略图URL",
  "formats": [
    {
      "quality": "720p",
      "format": "mp4",
      "size": "120MB",
      "url": "下载链接"
    },
    {
      "quality": "480p",
      "format": "mp4",
      "size": "80MB",
      "url": "下载链接"
    }
  ],
  "apiSource": "Vercel API"
}
```

## 部署

1. 克隆仓库
2. 安装依赖: `npm install`
3. 部署到Vercel: `vercel --prod`

## 使用限制

- 请合理使用API，避免频繁请求
- 仅用于个人学习和研究目的

## 许可证

MIT 