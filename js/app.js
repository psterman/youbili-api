// 导入API模块
import { getVideoInfo } from '../api/index.js';

document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const videoUrlInput = document.getElementById('video-url');
    const generateBtn = document.getElementById('generate-btn');
    const resultContainer = document.getElementById('result-container');
    const loader = document.getElementById('loader');
    const downloadLinks = document.getElementById('download-links');
    const errorMessage = document.getElementById('error-message');

    // 添加事件监听器
    generateBtn.addEventListener('click', handleGenerateClick);
    videoUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleGenerateClick();
        }
    });

    // 处理生成按钮点击事件
    async function handleGenerateClick() {
        const url = videoUrlInput.value.trim();

        if (!url) {
            showError('请输入视频链接');
            return;
        }

        if (!isValidUrl(url)) {
            showError('请输入有效的视频链接');
            return;
        }

        // 显示加载动画
        showLoader();

        // 禁用按钮，防止重复点击
        generateBtn.disabled = true;
        generateBtn.textContent = '处理中...';

        try {
            // 显示详细加载状态
            updateLoadingStatus('正在连接API服务...');

            // 获取视频信息
            const videoInfo = await getVideoInfo(url);

            // 显示下载链接
            displayDownloadLinks(videoInfo, isYouTubeUrl(url) ? 'youtube' : 'bilibili');
        } catch (error) {
            console.error('处理视频链接时出错:', error);

            // 显示友好的错误信息
            let errorMsg = error.message || '处理视频链接时出错，请稍后重试';

            // 添加重试按钮
            showError(errorMsg, true);

            // 提供直接下载选项
            if (isYouTubeUrl(url) || isBilibiliUrl(url)) {
                const videoId = isYouTubeUrl(url) ? extractYouTubeVideoId(url) : extractBilibiliVideoId(url);
                if (videoId) {
                    showDirectDownloadOptions(videoId, isYouTubeUrl(url) ? 'youtube' : 'bilibili');
                }
            }
        } finally {
            // 恢复按钮状态
            generateBtn.disabled = false;
            generateBtn.textContent = '获取下载链接';
        }
    }

    // 验证URL是否有效
    function isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    }

    // 检查是否为YouTube链接
    function isYouTubeUrl(url) {
        return url.includes('youtube.com') || url.includes('youtu.be');
    }

    // 检查是否为B站链接
    function isBilibiliUrl(url) {
        return url.includes('bilibili.com') || url.includes('b23.tv');
    }

    // 提取YouTube视频ID
    function extractYouTubeVideoId(url) {
        // 处理标准链接 (youtube.com/watch?v=VIDEO_ID)
        let match = url.match(/[?&]v=([^&#]*)/);
        if (match && match[1]) {
            return match[1];
        }

        // 处理短链接 (youtu.be/VIDEO_ID)
        match = url.match(/youtu\.be\/([^?&#]*)/);
        if (match && match[1]) {
            return match[1];
        }

        // 处理嵌入链接 (youtube.com/embed/VIDEO_ID)
        match = url.match(/youtube\.com\/embed\/([^?&#]*)/);
        if (match && match[1]) {
            return match[1];
        }

        return null;
    }

    // 提取B站视频ID
    function extractBilibiliVideoId(url) {
        // 处理标准链接 (bilibili.com/video/BV1xx411c7mD)
        let match = url.match(/bilibili\.com\/video\/([^\/\?]+)/);
        if (match && match[1]) {
            return match[1];
        }

        // 处理短链接 (b23.tv/xxxxx)
        match = url.match(/b23\.tv\/([^\/\?]+)/);
        if (match && match[1]) {
            return match[1];
        }

        return null;
    }

    // 显示下载链接
    function displayDownloadLinks(videoInfo, platform) {
        // 清空之前的内容
        downloadLinks.innerHTML = '';

        // 创建视频信息元素
        const videoInfoElement = document.createElement('div');
        videoInfoElement.className = 'video-info';
        videoInfoElement.innerHTML = `
            <h3>${videoInfo.title || '未知标题'}</h3>
            <p>来源: ${platform === 'youtube' ? 'YouTube' : '哔哩哔哩'} | ${platform === 'youtube' ? '上传者' : 'UP主'}: ${videoInfo.uploader || '未知'}</p>
        `;
        downloadLinks.appendChild(videoInfoElement);

        // 添加下载选项
        if (videoInfo.formats && videoInfo.formats.length > 0) {
            // 过滤掉无效URL
            const validFormats = videoInfo.formats.filter(format => format.url && format.url.trim() !== '');

            if (validFormats.length > 0) {
                // 创建下载选项标题
                const downloadTitle = document.createElement('h4');
                downloadTitle.className = 'download-section-title';
                downloadTitle.textContent = '可用下载链接';
                downloadLinks.appendChild(downloadTitle);

                // 添加下载选项
                validFormats.forEach(format => {
                    const downloadItem = createDownloadItem(
                        `${format.quality} (${format.format})`,
                        `文件大小: ${format.size || '未知'}`,
                        format.url
                    );
                    downloadLinks.appendChild(downloadItem);
                });
            } else {
                // 如果没有有效的下载链接，显示提示
                showNoDirectLinksMessage();
            }
        } else {
            // 如果没有格式信息，显示提示
            showNoDirectLinksMessage();
        }

        // 添加备用下载选项
        addAlternativeDownloadOptions(videoInfo.id, platform);

        // 添加API来源信息
        if (videoInfo.apiSource) {
            const apiSourceElement = document.createElement('div');
            apiSourceElement.className = 'api-source';
            apiSourceElement.textContent = `数据来源: ${videoInfo.apiSource}`;
            downloadLinks.appendChild(apiSourceElement);
        }

        // 显示下载链接区域
        hideLoader();
        downloadLinks.classList.remove('hidden');
        errorMessage.classList.add('hidden');
    }

    // 显示没有直接下载链接的提示
    function showNoDirectLinksMessage() {
        const noLinksMessage = document.createElement('p');
        noLinksMessage.className = 'no-links-message';
        noLinksMessage.textContent = '无法获取直接下载链接，请尝试使用以下备用方法';
        downloadLinks.appendChild(noLinksMessage);
    }

    // 添加备用下载选项
    function addAlternativeDownloadOptions(videoId, platform) {
        // 创建备用选项标题
        const alternativeTitle = document.createElement('h4');
        alternativeTitle.className = 'download-section-title';
        alternativeTitle.textContent = '备用下载方法';
        downloadLinks.appendChild(alternativeTitle);

        // 添加备用下载选项
        if (platform === 'youtube') {
            // YouTube备用选项
            const alternatives = [
                {
                    title: 'Y2mate下载',
                    description: '支持多种格式和质量',
                    url: `https://www.y2mate.com/youtube/${videoId}`
                },
                {
                    title: '9xBuddy下载',
                    description: '高速下载服务',
                    url: `https://9xbuddy.org/download?url=https://www.youtube.com/watch?v=${videoId}`
                },
                {
                    title: 'SaveFrom.net下载',
                    description: '无需安装软件',
                    url: `https://en.savefrom.net/1-youtube-video-downloader-5?url=https://www.youtube.com/watch?v=${videoId}`
                }
            ];

            alternatives.forEach(alt => {
                const altItem = createDownloadItem(alt.title, alt.description, alt.url);
                downloadLinks.appendChild(altItem);
            });
        } else {
            // B站备用选项
            const alternatives = [
                {
                    title: 'XBeiBeiX下载',
                    description: '支持高清视频下载',
                    url: `https://xbeibeix.com/api/bilibili/biliplayer/?url=https://www.bilibili.com/video/${videoId}`
                },
                {
                    title: 'BiliGet下载',
                    description: '支持多种格式',
                    url: `https://bili.iiilab.com/?bvid=${videoId}`
                },
                {
                    title: 'Injahow下载',
                    description: '稳定的B站视频解析',
                    url: `https://injahow.com/bparse/?url=https://www.bilibili.com/video/${videoId}`
                }
            ];

            alternatives.forEach(alt => {
                const altItem = createDownloadItem(alt.title, alt.description, alt.url);
                downloadLinks.appendChild(altItem);
            });
        }

        // 添加提示信息
        const tipElement = document.createElement('div');
        tipElement.className = 'download-tip';
        tipElement.innerHTML = `
            <p>提示: 如果下载链接无效，请尝试以下方法：</p>
            <ul>
                <li>使用浏览器扩展如Video DownloadHelper</li>
                <li>使用第三方网站如savefrom.net (YouTube) 或 bilibili-helper.com (B站)</li>
                <li>稍后再试，API服务可能暂时不可用</li>
            </ul>
        `;
        downloadLinks.appendChild(tipElement);
    }

    // 显示直接下载选项（当API失败时）
    function showDirectDownloadOptions(videoId, platform) {
        // 清空之前的内容
        downloadLinks.innerHTML = '';

        // 创建标题
        const title = document.createElement('h4');
        title.className = 'download-section-title';
        title.textContent = '备用下载选项';
        downloadLinks.appendChild(title);

        // 添加备用下载选项
        if (platform === 'youtube') {
            // YouTube备用选项
            const alternatives = [
                {
                    title: 'Y2mate下载',
                    description: '支持多种格式和质量',
                    url: `https://www.y2mate.com/youtube/${videoId}`
                },
                {
                    title: '9xBuddy下载',
                    description: '高速下载服务',
                    url: `https://9xbuddy.org/download?url=https://www.youtube.com/watch?v=${videoId}`
                },
                {
                    title: 'SaveFrom.net下载',
                    description: '无需安装软件',
                    url: `https://en.savefrom.net/1-youtube-video-downloader-5?url=https://www.youtube.com/watch?v=${videoId}`
                },
                {
                    title: 'SSYoutube下载',
                    description: '支持高清视频',
                    url: `https://ssyoutube.com/watch?v=${videoId}`
                }
            ];

            alternatives.forEach(alt => {
                const altItem = createDownloadItem(alt.title, alt.description, alt.url);
                downloadLinks.appendChild(altItem);
            });
        } else {
            // B站备用选项
            const alternatives = [
                {
                    title: 'XBeiBeiX下载',
                    description: '支持高清视频下载',
                    url: `https://xbeibeix.com/api/bilibili/biliplayer/?url=https://www.bilibili.com/video/${videoId}`
                },
                {
                    title: 'BiliGet下载',
                    description: '支持多种格式',
                    url: `https://bili.iiilab.com/?bvid=${videoId}`
                },
                {
                    title: 'Injahow下载',
                    description: '稳定的B站视频解析',
                    url: `https://injahow.com/bparse/?url=https://www.bilibili.com/video/${videoId}`
                }
            ];

            alternatives.forEach(alt => {
                const altItem = createDownloadItem(alt.title, alt.description, alt.url);
                downloadLinks.appendChild(altItem);
            });
        }

        // 显示下载链接区域
        hideLoader();
        downloadLinks.classList.remove('hidden');
    }

    // 创建下载项
    function createDownloadItem(title, meta, url) {
        const item = document.createElement('div');
        item.className = 'download-item';

        item.innerHTML = `
            <div class="download-info">
                <div class="download-title">${title}</div>
                <div class="download-meta">${meta}</div>
            </div>
            <a href="${url}" class="download-button" target="_blank">
                <i class="fas fa-download"></i> 下载
            </a>
        `;

        return item;
    }

    // 显示加载动画
    function showLoader() {
        downloadLinks.classList.add('hidden');
        errorMessage.classList.add('hidden');
        loader.style.display = 'flex';
    }

    // 隐藏加载动画
    function hideLoader() {
        loader.style.display = 'none';
    }

    // 更新加载状态
    function updateLoadingStatus(message) {
        const statusElement = document.getElementById('loading-status') || document.createElement('div');
        statusElement.id = 'loading-status';
        statusElement.textContent = message;

        if (!document.getElementById('loading-status')) {
            loader.appendChild(statusElement);
        }
    }

    // 显示错误信息
    function showError(message, showRetry = false) {
        downloadLinks.classList.add('hidden');
        hideLoader();

        // 清空之前的内容
        errorMessage.innerHTML = '';

        // 添加错误消息
        const errorText = document.createElement('p');
        errorText.textContent = message;
        errorMessage.appendChild(errorText);

        // 如果需要，添加重试按钮
        if (showRetry) {
            const retryButton = document.createElement('button');
            retryButton.className = 'retry-button';
            retryButton.textContent = '重试';
            retryButton.addEventListener('click', handleGenerateClick);

            const alternativeText = document.createElement('p');
            alternativeText.className = 'alternative-text';
            alternativeText.innerHTML = `
                <p>您也可以尝试以下替代方法：</p>
                <ul>
                    <li>检查视频链接是否正确</li>
                    <li>使用浏览器扩展下载视频</li>
                    <li>使用第三方网站下载视频</li>
                    <li>稍后再试，API服务可能暂时不可用</li>
                </ul>
            `;

            errorMessage.appendChild(retryButton);
            errorMessage.appendChild(alternativeText);
        }

        errorMessage.classList.remove('hidden');
    }

    // 添加提示信息
    videoUrlInput.placeholder = '粘贴 YouTube 或 B站 视频链接...';
}); 