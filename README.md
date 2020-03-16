# Bangumi New Wiki Helper
辅助在 bangumi.tv 或者 bgm.tv 上创建新的条目

目前支持日亚的图书条目和 getchu 的游戏条目

## 功能
- 提取信息网站的信息，填写表单
- 检测条目是否在 bangmi 上存在
- 处理封面，支持图片打码


## 开发

    npm install

运行下面的命令, 监控文件并构建输出到 `extension` 文件夹

    npm run dev:ext

### 配合火狐浏览器开发
首先编辑 `bin` 文件夹的 `run-fx.js` 里面的 `firefox` 的值为自己电脑里面安装 Firefox 的路径

新开一个命令行运行

    npm start

编辑代码文件后, [web-ext][web-ext] 会自动重新加载扩展

![popup screenshot](screenshots/popup.png "popup screenshot")

[web-ext]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Getting_started_with_web-ext

## Icons

[icons8](https://icons8.com/).
