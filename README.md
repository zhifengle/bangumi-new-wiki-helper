# Bangumi New Wiki Helper

辅助在 bangumi.tv 或者 bgm.tv 上创建新的条目

支持日亚的图书、getchu 的游戏、 steam 、steamdb 、jd 图书、当当图书、豆瓣游戏、DMM 游戏、Dlsite 游戏。

考虑到信息的准确性，未做成一键新建和提交的模式。

讨论贴：https://bgm.tv/group/topic/345469

## 功能

- 提取信息网站的信息，填写新建条目的表单并上传封面
- 检测条目是否在 bangumi 上存在
- 新建角色时，按钮“添加人物并上次肖像”旁边输入关联条目 ID，可以自动关联条目。如果抓取的信息里面有 CV 。会搜索和关联 CV
- ~~支持创建 Getchu 上面的游戏角色，并自动关联 CV。使用扩展时，可以在设置页面修改 Bangumi 对应条目 ID。脚本暂时未开发修改条目 ID 的功能，需要点击 “新建并查重” 后抓取到条目 ID 才能自动关联 CV。~~
- 处理封面，支持图片打码

## 安装和使用

### 脚本

需要配合脚本管理器使用：

[Tampermonkey](https://chrome.google.com/webstore/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo)
或者 [Violentmonkey](https://addons.mozilla.org/zh-CN/firefox/addon/violentmonkey/)

[安装地址](https://greasyfork.org/en/scripts/40041-bangumi-new-wiki-helper)

### 浏览器扩展

Firefox: [扩展商店安装地址](https://addons.mozilla.org/zh-CN/firefox/addon/bangumi-new-wiki-helper/)

#### 手动安装

地址： [Github release](https://github.com/22earth/bangumi-new-wiki-helper/releases)

Chrome: 由于没有发布账号，没法在 Chrome 的 APP Store 里面发布。只有下载 crx 文件，使用开发者模式试用

参考: [如何解决谷歌 Chrome 浏览器第三方扩展程序已停用](https://jingyan.baidu.com/article/0f5fb099cbe5486d8334ea2c.html)

## 开发

    npm install

运行下面的命令, 监控文件并构建输出到 `extension` 文件夹

    npm run dev:ext

### 构建说明

扩展构建输出

    npm run build:ext

脚本构建输出

    npm run build:script

`src/index.js` 是输出用户脚本的入口

`build/rollup.config.ext.js` 查看和配置浏览器扩展的对应入口

### 配合火狐浏览器开发

首先编辑 `bin` 文件夹的 `run-fx.js` 里面的 `firefox` 的值为自己电脑里面安装 Firefox 的路径

新开一个命令行运行

    npm start

编辑代码文件后, [web-ext][web-ext] 会自动重新加载扩展

## 截图

![popup screenshot](screenshots/popup.png 'popup screenshot')

![amazon-jp-book screenshot](screenshots/amazon-jp-book.png 'amazon-jp-book screenshot')

![fill form](screenshots/fill-form.gif 'fill-form screenshot')

![deal image](screenshots/deal-image.gif 'deal-image screenshot')

[web-ext]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions/Getting_started_with_web-ext

## Icons

来自 [icons8](https://icons8.com/).
