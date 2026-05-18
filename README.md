# Yumuzk

Yumuzk 是一个基于 **Electron + Vue 3 + Vite + TypeScript** 的桌面音乐播放器项目。

这个仓库已经包含主播放器界面、桌面歌词窗口、歌单管理、搜索、账号登录、主题配置，以及 Electron 打包 / 发布所需的主要配置。

## 当前功能

### 播放器

- 底部播放器：播放 / 暂停、上一首 / 下一首、进度拖动、音量调节、播放列表展开
- 播放模式：列表、单曲循环、随机
- 全屏播放页
- 滚动歌词
- 独立桌面歌词窗口
- Windows 托盘与任务栏缩略图控制
- Media Session 支持
- 自定义协议 `yumuzk://` (暂时没用)

### 内容与歌单

- 搜索：当前支持 **网易云**、**酷狗**
- 搜索结果包含：歌曲、专辑、歌手、歌单
- 支持搜索建议
- 推荐页：当前从网易云拉取推荐歌单
- 登录网易云后可读取每日推荐和用户歌单
- 登录酷狗后可读取用户歌单
- 首页带有歌单预览入口

### 本地歌单

- 从 `res/lists/*.json` 读取本地歌单
- 导入本地 JSON 歌单
- 删除本地歌单
- 给本地歌单添加歌曲
- 编辑歌曲标题、歌手
- 为歌曲指定自定义歌词来源（当前支持网易云 / 酷狗）
- 修改本地歌单封面
- 歌单详情页支持按标题、歌手、拼音全拼、拼音首字母过滤
- 全屏页可把当前歌曲加入或移出默认歌单

### 账号

- 网易云二维码登录
- 酷狗二维码登录
- Bilibili 二维码登录

### 设置

当前设置页可配置：

- 网易云 API 地址
- QQ API 地址
- 背景
- 透明度
- 默认歌单文件名
- 颜色主题
- 关闭窗口后最小化到托盘

## 运行时本地服务

应用启动时会同时拉起以下本地服务：

- `35651`：网易云 API
- `35652`：代理服务
- `35653`：酷狗 API

## 技术栈

- Electron
- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Router
- Axios

## 开发

### 安装依赖

```bash
pnpm install
```

### 常用命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 只启动 Vite，端口 `5201` |
| `pnpm start` | 只启动 Electron Forge |
| `pnpm debug` | 同时启动 Vite 和 Electron，适合本地联调 |
| `pnpm build-only` | 构建前端资源 |
| `pnpm package` | 执行 Electron Forge package |
| `pnpm make` | 执行 Electron Forge make |
| `pnpm build` | 依次执行 `build-only -> package -> clean -> makes` |

开发模式下主窗口会加载 `http://localhost:5201`；打包模式下加载本地 `dist/index.html`。桌面歌词窗口对应单独的 `lyric.html` 构建入口。

## 项目结构

| 路径 | 说明 |
| --- | --- |
| `src/` | 主界面渲染层 |
| `lyric/` | 桌面歌词窗口渲染层 |
| `main.js` | Electron 主进程 |
| `preload.js` | 主窗口预加载脚本 |
| `functions.js` | IPC 相关功能，如文件、配置、剪贴板、外链 |
| `utils/` | 主进程 / 通用工具 |
| `NeteaseCloudMusicApi/` | 仓库内的网易云 API 代码 |
| `KuGouMusicApi/` | 仓库内的酷狗 API 代码 |
| `res/` | 运行时配置与本地歌单目录 |
| `release/` | 打包相关脚本与输出目录 |

## 其他说明

- 应用启动时会自动确保以下路径 / 文件存在：`res/`、`res/lists/`、`res/config.json`、`res/colors.json`
- 仓库里已经包含网易云与酷狗对应的本地 API 代码
- QQ 相关能力在项目里有接入点，但接口地址需要在设置页单独配置
- 仓库中已有 GitHub Actions 发布工作流：推送 `v*` tag 后会执行安装、构建、打包，并发布 `release/make/**`

## 设计文档

- `docs/music-source/00-overview.md`
- `docs/music-source/01-current-architecture-audit.md`
- `docs/music-source/02-target-models-and-types.md`
- `docs/music-source/03-music-source-base-class.md`
- `docs/music-source/04-registry-and-capabilities.md`
- `docs/music-source/05-playlist-loading-redesign.md`
- `docs/music-source/06-playback-and-lyric-resolution.md`
- `docs/music-source/07-search-preview-and-actions.md`
- `docs/music-source/08-migration-order-for-this-repo.md`
- `docs/music-source/09-plugin-preparation.md`
