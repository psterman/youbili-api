# Vercel API部署指南

本文档提供了将YouBili API部署到Vercel的详细步骤。

## 准备工作

1. **GitHub账号**：如果没有，请在[GitHub官网](https://github.com/)注册
2. **Vercel账号**：使用GitHub账号在[Vercel官网](https://vercel.com/)注册

## 部署步骤

### 1. 准备API项目

项目文件已经准备好，位于`vercel-api`文件夹中。这个文件夹包含了所有需要部署的文件：

- `api/video-info.js`：主要API端点
- `package.json`：项目依赖
- `vercel.json`：Vercel配置文件

### 2. 创建GitHub仓库

1. 登录GitHub
2. 点击右上角的"+"图标，选择"New repository"
3. 仓库名称填写：`youbili-api`
4. 描述（可选）：`YouTube和B站视频下载API`
5. 选择"Public"（公开）
6. 点击"Create repository"按钮

### 3. 上传API项目到GitHub

#### 使用GitHub Desktop（推荐）

1. 打开GitHub Desktop
2. 选择"File" > "Clone repository"
3. 选择您刚创建的`youbili-api`仓库
4. 选择本地保存位置
5. 点击"Clone"按钮
6. 将`vercel-api`文件夹中的所有文件复制到克隆的仓库文件夹中
7. 在GitHub Desktop中，您会看到所有添加的文件
8. 添加提交信息，如："初始化API项目"
9. 点击"Commit to main"按钮
10. 点击"Push origin"按钮

#### 或使用命令行

```bash
# 克隆仓库
git clone https://github.com/您的用户名/youbili-api.git
cd youbili-api

# 复制文件
cp -r /path/to/vercel-api/* .

# 提交更改
git add .
git commit -m "初始化API项目"
git push origin main
```

### 4. 部署到Vercel

1. 登录[Vercel](https://vercel.com/)
2. 点击"Add New..." > "Project"
3. 在"Import Git Repository"部分，找到并选择您的`youbili-api`仓库
4. 点击"Import"按钮
5. 在配置页面上，保持默认设置不变
6. 点击"Deploy"按钮

部署完成后，Vercel会提供一个URL，例如：`https://youbili-api.vercel.app`

### 5. 更新前端代码

部署成功后，您需要更新前端代码中的API端点URL：

1. 打开`api/index.js`文件
2. 找到以下行：
   ```javascript
   const VERCEL_API_ENDPOINT = 'https://youbili-api.vercel.app/api/video-info';
   ```
3. 将URL替换为您的Vercel部署URL，例如：
   ```javascript
   const VERCEL_API_ENDPOINT = 'https://your-project-name.vercel.app/api/video-info';
   ```
4. 保存文件并提交更改

## 测试API

部署完成后，您可以通过以下URL测试API：

```
https://your-project-name.vercel.app/api/video-info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

如果一切正常，您应该能看到返回的JSON数据，包含视频信息和下载链接。

## 故障排除

### 问题1：部署失败

**解决方案**：
1. 检查Vercel部署日志，查看具体错误
2. 确保`package.json`和`vercel.json`格式正确
3. 尝试在本地运行`npm install`检查依赖是否有问题

### 问题2：API返回错误

**解决方案**：
1. 检查API代码中的错误处理
2. 确保URL参数正确编码
3. 检查第三方API是否可用

### 问题3：CORS错误

**解决方案**：
1. 确保API设置了正确的CORS头
2. 检查前端请求是否正确

## 维护和更新

### 更新API代码

1. 在本地修改代码
2. 提交并推送到GitHub
3. Vercel会自动重新部署

### 监控API使用情况

1. 登录Vercel控制台
2. 查看您项目的"Analytics"部分
3. 监控请求数量、错误率等指标 