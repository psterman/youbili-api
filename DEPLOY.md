# 部署到GitHub Pages

本文档提供了将YouBili视频下载助手部署到GitHub Pages的详细步骤。

## 前提条件

1. 拥有GitHub账号
2. 了解基本的Git操作

## 部署步骤

### 1. 创建GitHub仓库

1. 登录GitHub账号
2. 点击右上角的"+"图标，选择"New repository"
3. 填写仓库名称，例如"youbili"
4. 选择"Public"（公开）
5. 点击"Create repository"创建仓库

### 2. 上传代码

方法一：使用Git命令行

```bash
# 初始化Git仓库
git init

# 添加远程仓库
git remote add origin https://github.com/你的用户名/youbili.git

# 添加所有文件
git add .

# 提交更改
git commit -m "Initial commit"

# 推送到GitHub
git push -u origin main
```

方法二：使用GitHub Desktop

1. 下载并安装[GitHub Desktop](https://desktop.github.com/)
2. 登录你的GitHub账号
3. 添加本地仓库
4. 提交更改
5. 推送到GitHub

### 3. 配置GitHub Pages

1. 进入GitHub仓库页面
2. 点击"Settings"（设置）
3. 在左侧菜单中找到"Pages"
4. 在"Source"部分，选择"main"分支
5. 点击"Save"保存设置

### 4. 访问网站

部署完成后，你可以通过以下URL访问你的网站：

```
https://你的用户名.github.io/youbili/
```

通常需要等待几分钟才能生效。

## 自定义域名（可选）

如果你有自己的域名，可以按照以下步骤配置：

1. 在DNS提供商处添加CNAME记录，指向`你的用户名.github.io`
2. 在GitHub Pages设置中，添加你的自定义域名
3. 勾选"Enforce HTTPS"选项（推荐）

## 更新网站

每次推送更改到main分支后，GitHub Pages会自动更新你的网站。

## 注意事项

- 本项目中的API服务是模拟的，实际部署时需要替换为真实的API服务
- 确保你的代码不包含敏感信息
- 遵守GitHub Pages的使用条款和服务条件 