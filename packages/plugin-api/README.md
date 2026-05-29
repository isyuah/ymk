# @yumuzk/plugin-api

YMK 音乐源插件开发 SDK。通过继承 `MusicSource` 抽象类，你可以为 YMK 音乐播放器添加新的音乐来源（如 QQ 音乐、Spotify、本地文件等）。

## 目录

- [快速开始](#快速开始)
- [核心概念](#核心概念)
  - [MusicSource 抽象类](#musicsource-抽象类)
  - [能力系统 (Capability)](#能力系统-capability)
  - [上下文 (Context)](#上下文-context)
  - [认证系统 (Auth)](#认证系统-auth)
- [能力列表](#能力列表)
- [关键类型](#关键类型)
- [完整示例](#完整示例)
- [插件注册约定](#插件注册约定)

---

## 快速开始

```ts
import { MusicSource, type SourceCapabilityMap, type SongBase, SourceEntityType } from '@yumuzk/plugin-api';

class MySource extends MusicSource {
  id = 'my-source';
  name = '我的音乐源';

  initialize() {
    // 可选：设置 HTTP 基础配置、拦截器等
    // this.ctx 此时已由宿主注入，可以直接使用
  }

  capability: Partial<SourceCapabilityMap> = {
    // 声明你实现了哪些能力（见下方能力列表）
    searchSongs: {
      available: true,
      invoke: (keyword, page, pageSize) => this.searchSongs(keyword, page, pageSize),
    },
    // 未实现的能力可以省略不写，宿主会视为「不可用」
  };

  // 实现具体逻辑
  async searchSongs(keyword: string, page: number, pageSize: number) {
    const res = await this.ctx.http.get('/search', { params: { keyword, page, pageSize } });
    return {
      data: res.data.map((item: any) => ({
        sourceType: this.id,
        symbol: item.id,
        title: item.title,
        singer: item.singer,
        pic: item.pic,
      })),
      total: res.data.total,
      page,
      pageSize,
    };
  }
}

export default new MySource();
```

> **插件安装后不需要手动配置 `tsconfig`。** 因为类型随 `npm install` 安装，只需要直接 import 即可。

---

## 核心概念

### MusicSource 抽象类

所有插件都继承此类。你必须覆写以下属性：

| 属性 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | 全局唯一标识，如 `"kugou"`, `"netease"`。同 ID 的插件只会被注册一次 |
| `name` | `string` | 展示名，如 `"酷狗音乐"`, `"网易云音乐"` |
| `capability` | `Partial<SourceCapabilityMap>` | 声明该源支持的能力。详见[能力系统](#能力系统-capability) |
| `initialize?` | `() => void \| Promise<void>` | **可选**。宿主导入此插件时会调用一次，此时 `this.ctx` 已就绪 |
| `auth?` | `SourceAuthAny` | **可选**。如果源需要登录，通过 `defineAuth()` 定义。详见[认证系统](#认证系统-auth) |

#### `ctx` 的注入时机

宿主在注册插件时执行：

```
1. 创建 SourceContext 对象（包含 http / storage / loader）
2. 调用 source.$injectContext(ctx) 注入
3. 调用 source.initialize?.()
4. 将插件加入注册表
```

因此你在 `initialize()` 中可以直接使用 `this.ctx`，无需手动调用 `$injectContext`。

---

### 能力系统 (Capability)

每个能力用 `SourceAbility<T>` 描述，它有三种状态：

```ts
// 1. 始终可用
searchSongs: {
  available: true,
  invoke: (keyword, page, pageSize) => this.searchSongs(keyword, page, pageSize),
}

// 2. 始终不可用（可给出原因）
resolveAlbum: {
  available: false,
  reason: '暂未实现专辑解析',
}

// 3. 条件可用——available 是一个函数，在调用时动态判断
getMyPlaylists: {
  available: () => this.ctx.storage.has('auth'),
  reason: '请先登录',
  invoke: () => this.getMyPlaylists(),
}
```

宿主通过 `source.getAvailability(key)` 解析这些声明，返回 `{ available, invoke }` 或 `{ available: false, reason }`。

**你只需要在 `capability` 中声明你实现的能力，未声明的默认视为「不可用」。**

#### invoke 函数的参数和返回值

每种能力的 `invoke` 签名不同，由 `SourceCapabilityMap` 约束。详见[能力列表](#能力列表)。你的实现在编写时会获得完整的 TypeScript 类型提示。

---

### 上下文 (Context)

`this.ctx` 是宿主注入给每个插件的运行时环境，类型为 `SourceContextLike`：

| 字段 | 类型 | 说明 |
|------|------|------|
| `ctx.http` | HTTP 客户端实例 | 宿主注入的 HTTP 客户端，行为类似 axios（支持 `.get()`、`.post()`、`baseURL`、`headers`、拦截器等）。你可以按 axios 的方式使用它 |
| `ctx.storage` | `StorageAPILike` | KV 持久化存储。每个插件的存储空间按 `source.id` 隔离，互不干扰 |
| `ctx.loader` | `new (text?: string) => LoaderLike` | 加载指示器构造函数。用于在耗时操作中更新 UI 上的加载文字 |

#### storage 用法

```ts
// 保存数据（可存任意 JSON 序列化的值）
this.ctx.storage.set('auth', 'token-xxx');
this.ctx.storage.set('uid', 12345);

// 读取数据
const token = this.ctx.storage.get<string>('auth');   // → 'token-xxx' 或 null

// 检查是否存在
if (this.ctx.storage.has('auth')) { /* 已登录 */ }

// 删除数据
this.ctx.storage.delete('auth');
```

> **存储隔离**：每个源的存储空间独立。你在 `kugou` 源中 set 的 key，不会影响 `netease` 源。

#### loader 用法

```ts
async resolvePlaylist(ref: SourceEntityRef): Promise<ResolvedPlaylist> {
  {
    using loader = new this.ctx.loader('正在加载歌单...');
    // ↑ 这会创建一个加载动画，UI 上显示 "正在加载歌单..."

    const page1 = await this.ctx.http.get('/playlist/page1');

    loader.setText('正在加载歌单 (50/200)...');
    // ↑ 动态更新文字

    const page2 = await this.ctx.http.get('/playlist/page2');

    // 离开作用域时，调用 loader[Symbol.dispose]() 自动关闭加载动画
  }
  return result;
}
```

> **用法说明**：`loader` 配合 TC39 的 [Explicit Resource Management](https://github.com/tc39/proposal-explicit-resource-management) 提案使用，通过 `using` 关键字确保离开作用域时自动清理。如果你的 TypeScript target 低于 `es2022`（如 `es2015`），需要将 `target` 调整为 `es2022` 或 `esnext`，或者手动调用 `loader[Symbol.dispose]()`。

---

> 如果你的 TypeScript target 是 `es2015` / `es2017` 等不支持 `using` 关键字的版本，请手动调用 dispose：

```ts
const loader = new this.ctx.loader('正在加载...');
try {
  // ... 你的逻辑
} finally {
  loader[Symbol.dispose]();
}
```

---

### 认证系统 (Auth)

如果音乐源需要用户登录才能使用某些功能，通过 `defineAuth()` 辅助函数定义 `auth` 属性。

当前支持两种登录方式：

#### 扫码登录 (`qrcode`)

流程：获取二维码 → 展示给用户 → 轮询扫码状态 → 登录成功。

```ts
auth = defineAuth({
  methods: [
    { type: 'qrcode', label: '扫码登录' },
  ] as const,

  // 必须实现
  getUserInfo: async () => {
    const token = this.ctx.storage.get<string>('auth');
    if (!token) return null;
    const res = await this.ctx.http.get('/user/info');
    return { nickname: res.data.name, avatar: res.data.pic };
  },

  logout: async () => {
    this.ctx.storage.delete('auth');
  },

  // qrcode 方式专属方法（因 methods 中包含 'qrcode'，TS 会校验你必须实现这些）
  getQRCode: async () => {
    const res = await this.ctx.http.post('/login/qr/key');
    return { url: res.data.qrUrl, key: res.data.key };
  },

  checkQRStatus: async (key: string) => {
    const res = await this.ctx.http.get('/login/qr/check', { params: { key } });
    if (res.data.status === 'confirmed') {
      this.ctx.storage.set('auth', res.data.token);
      return { status: 'confirmed' };
    }
    if (res.data.status === 'scanned') return { status: 'scanned' };
    if (res.data.status === 'expired') return { status: 'expired' };
    return { status: 'waiting' };
  },
});
```

#### Cookie 登录 (`cookie`)

流程：用户输入 Cookie → 验证。

```ts
auth = defineAuth({
  methods: [
    { type: 'cookie', label: 'Cookie 登录' },
  ] as const,

  getUserInfo: async () => { /* 同上 */ },
  logout: async () => { /* 同上 */ },

  // cookie 方式专属方法
  loginWithCookie: async (cookie: string) => {
    const valid = await this.validateCookie(cookie);
    if (valid) {
      this.ctx.storage.set('auth', cookie);
      return true;
    }
    return false;
  },
});
```

#### 同时支持多种登录方式

```ts
auth = defineAuth({
  methods: [
    { type: 'qrcode', label: '扫码登录' },
    { type: 'cookie', label: 'Cookie 登录' },
  ] as const,
  // 需要实现 getUserInfo + logout + getQRCode + checkQRStatus + loginWithCookie
});
```

> **`as const` 是必需的**，它让 TypeScript 推断出字面量类型，从而校验你实现了对应登录方式所需的方法。不写 `as const` 则无法获得类型校验。

#### 登录状态的持久化

你的插件**自行负责**将登录凭证存入 `this.ctx.storage`（如上例中的 `this.ctx.storage.set('auth', token)`）。宿主不干预认证数据的存续。下次初始化时，通过 `storage.get` 恢复登录态。

---

## 能力列表

所有能力定义在 `SourceCapabilityMap` 中。以下是完整列表：

| 能力 | invoke 签名 | 说明 |
|------|------------|------|
| `searchSongs` | `(keyword: string, page: number, pageSize: number) => Promise<PaginatedResult<SongBase>>` | 搜索歌曲 |
| `searchAlbums` | `(keyword: string, page: number, pageSize: number) => Promise<PaginatedResult<SearchAlbumItem>>` | 搜索专辑 |
| `searchArtists` | `(keyword: string, page: number, pageSize: number) => Promise<PaginatedResult<SearchArtistItem>>` | 搜索歌手 |
| `searchPlaylists` | `(keyword: string, page: number, pageSize: number) => Promise<PaginatedResult<SearchPlaylistItem>>` | 搜索歌单 |
| `suggest` | `(keyword: string) => Promise<string[]>` | 搜索建议（用户输入时实时提示） |
| `resolvePlayback` | `(song: SourceEntityRef) => Promise<ResolvedPlayback>` | 根据歌曲引用获取可播放的 URL |
| `resolveLyric` | `(song: SourceEntityRef) => Promise<ResolvedLyric>` | 根据歌曲引用获取歌词 |
| `resolvePlaylist` | `(ref: SourceEntityRef) => Promise<ResolvedPlaylist>` | 解析歌单，获取歌曲列表和元信息 |
| `resolveAlbum` | `(ref: SourceEntityRef) => Promise<ResolvedAlbum>` | 解析专辑，获取歌曲列表 |
| `resolveArtist` | `(ref: SourceEntityRef) => Promise<ResolvedArtist>` | 解析歌手，获取歌曲列表 |
| `checkSongPlayable` | `(song: SourceEntityRef) => Promise<SongPlayable>` | 检查歌曲是否可播放（如 VIP 限制） |
| `getMyPlaylists` | `() => Promise<MyPlaylistGroup[]>` | 获取用户自己的歌单列表 |
| `subscribePlaylist` | `(ref: SourceEntityRef) => Promise<boolean>` | 订阅/收藏一个歌单 |
| `appendToPlaylist` | `(song: SongBase, target: SourceEntityRef) => Promise<boolean>` | 将歌曲添加到指定歌单 |
| `parseLink` | `(input: string) => Promise<SourceEntityRef \| null>` | 解析外部链接（如分享链接）为可识别的引用 |
| `getPlaylistInfo` | `(ref: SourceEntityRef) => Promise<PlaylistInfo>` | 轻量获取歌单基本信息（标题、封面），不解析歌曲列表 |
| `removePlaylist` | `(ref: SourceEntityRef, playlist: RuntimePlaylist) => Promise<void>` | 删除歌单 |
| `renamePlaylist` | `(ref: SourceEntityRef, playlist: RuntimePlaylist, newName: string) => Promise<void>` | 重命名歌单 |
| `changePlaylistCover` | `(ref: SourceEntityRef, playlist: RuntimePlaylist, coverData: string) => Promise<void>` | 修改歌单封面 |
| `removeFromPlaylist` | `(song: SongBase, playlist: RuntimePlaylist) => Promise<void>` | 从歌单中移除歌曲 |
| `editSongInfo` | `(song: SongBase, playlist: RuntimePlaylist, updates: Partial<SongBase>) => Promise<void>` | 编辑歌单内歌曲信息 |
| `customizeLyric` | `(song: SongBase, playlist: RuntimePlaylist, lyricRef: SourceEntityRef) => Promise<void>` | 为歌曲自定义歌词引用 |

---

## 关键类型

### SongBase —— 歌曲的基本描述

```ts
interface SongBase<TExtra = unknown> {
  sourceType: string;   // 来源标识，通常等于 this.id
  symbol: string;       // 在该源中唯一标识此歌曲的 key（如 hash、ID）
  title?: string;       // 歌曲标题
  singer?: string;      // 歌手
  pic?: string;         // 封面图 URL
  extra?: TExtra;       // 自定义扩展数据
  lyricOverride?: SourceEntityRef;  // 覆盖的歌词引用
  lyricOffset?: number;             // 歌词偏移量（毫秒）
}
```

### SourceEntityRef —— 对任何实体的引用

```ts
interface SourceEntityRef<TExtra = unknown> {
  sourceType: string;      // 来源标识
  symbol: string;          // 唯一标识
  type: SourceEntityType;  // 实体类型：Song / Playlist / Album / Artist / Lyric
  extra?: TExtra;
}
```

### ResolvedPlayback —— 播放链接解析结果

```ts
interface ResolvedPlayback {
  url: string;      // 可直接播放的音频 URL（必须返回）
  title?: string;
  singer?: string;
  pic?: string;
}
```

### ResolvedPlaylist —— 歌单解析结果

```ts
interface ResolvedPlaylist {
  songs: SongBase[];  // 歌单中的歌曲列表
  meta?: {
    title?: string;
    pic?: string;
    canSubscribe?: boolean;   // 是否允许订阅
    subscribed?: boolean;     // 当前是否已订阅
    canAppend?: boolean;      // 是否允许添加歌曲
    [key: string]: any;       // 允许携带额外的自定义字段
  };
}
```

### ResolvedLyric —— 歌词解析结果

```ts
// CurrentSong['lyrics'] 的类型，是一个 key→歌词 的字典
// 常见 key：'origin'（原文）, 'translation'（翻译）, 'mixed'（混合）
type ResolvedLyric = Record<string, {
  enableAutoScroll: boolean;
  items: { time: number; text: string[] }[];
}>;
```

### SongPlayable —— 可播放性检查结果

```ts
type SongPlayable =
  | { playable: true; reason?: string }
  | { playable: false; reason: string };  // 如 "需要 VIP"
```

### PaginatedResult —— 分页结果

```ts
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

## 完整示例

下面是一个支持**搜索歌曲 + 播放 + 歌词 + 扫码登录**的完整插件：

```ts
import {
  MusicSource,
  type SourceCapabilityMap,
  type SongBase,
  type ResolvedPlayback,
  type ResolvedLyric,
  type PaginatedResult,
  type SourceEntityRef,
  SourceEntityType,
  defineAuth,
} from '@yumuzk/plugin-api';

class DemoSource extends MusicSource {
  id = 'demo';
  name = '示例音乐源';

  // =========================================================================
  // 初始化
  // =========================================================================

  initialize() {
    // 设置 API 基础地址
    this.ctx.http.defaults.baseURL = 'https://api.example.com';

    // 可选：添加请求拦截器，自动附带认证 token
    this.ctx.http.interceptors.request.use((config: any) => {
      const token = this.ctx.storage.get<string>('auth');
      if (token) {
        config.params = { ...config.params, token };
      }
      return config;
    });
  }

  // =========================================================================
  // 认证
  // =========================================================================

  auth = defineAuth({
    methods: [{ type: 'qrcode', label: '扫码登录' }] as const,

    getUserInfo: async () => {
      const token = this.ctx.storage.get<string>('auth');
      if (!token) return null;
      try {
        const res = await this.ctx.http.get('/user/info');
        return {
          nickname: res.data.nickname,
          avatar: res.data.avatar,
        };
      } catch {
        return null;
      }
    },

    logout: async () => {
      this.ctx.storage.delete('auth');
    },

    getQRCode: async () => {
      const res = await this.ctx.http.post('/auth/qr');
      return { url: res.data.qrUrl, key: res.data.qrKey };
    },

    checkQRStatus: async (key: string) => {
      const res = await this.ctx.http.get('/auth/qr/check', { params: { key } });
      switch (res.data.status) {
        case 2: return { status: 'confirmed', cookie: res.data.token };
        case 1: return { status: 'scanned' };
        case -1: return { status: 'expired' };
        default: return { status: 'waiting' };
      }
    },
  });

  // =========================================================================
  // 能力声明
  // =========================================================================

  capability: Partial<SourceCapabilityMap> = {
    searchSongs: {
      available: true,
      invoke: (kw, page, size) => this.searchSongs(kw, page, size),
    },
    suggest: {
      available: true,
      invoke: (kw) => this.suggest(kw),
    },
    resolvePlayback: {
      available: true,
      invoke: (song) => this.resolvePlayback(song),
    },
    resolveLyric: {
      available: true,
      invoke: (song) => this.resolveLyric(song),
    },
    resolvePlaylist: {
      available: true,
      invoke: (ref) => this.resolvePlaylist(ref),
    },
    checkSongPlayable: {
      available: true,
      invoke: (song) => this.checkSongPlayable(song),
    },
    getMyPlaylists: {
      available: () => this.ctx.storage.has('auth'),
      reason: '请先登录',
      invoke: () => this.getMyPlaylists(),
    },
    // resolveAlbum、resolveArtist 等未声明的能力，默认不可用
  };

  // =========================================================================
  // 搜索
  // =========================================================================

  async searchSongs(keyword: string, page: number, pageSize: number): Promise<PaginatedResult<SongBase>> {
    const res = await this.ctx.http.get('/search/song', {
      params: { keyword, page, pageSize },
    });
    return {
      page,
      pageSize,
      total: res.data.total,
      data: res.data.items.map((item: any) => ({
        sourceType: this.id,
        symbol: item.id,
        title: item.title,
        singer: item.singer,
        pic: item.cover,
      })),
    };
  }

  async suggest(keyword: string): Promise<string[]> {
    const res = await this.ctx.http.get('/search/suggest', { params: { keyword } });
    return res.data.suggestions ?? [];
  }

  // =========================================================================
  // 播放
  // =========================================================================

  async resolvePlayback(song: SourceEntityRef): Promise<ResolvedPlayback> {
    const res = await this.ctx.http.get('/song/url', { params: { id: song.symbol } });
    if (!res.data.url) {
      throw new Error(`无法获取播放地址: ${song.symbol}`);
    }
    return {
      url: res.data.url,
      title: res.data.title,
      singer: res.data.singer,
      pic: res.data.cover,
    };
  }

  async checkSongPlayable(song: SourceEntityRef) {
    try {
      const res = await this.ctx.http.get('/song/check', { params: { id: song.symbol } });
      return res.data.playable
        ? { playable: true }
        : { playable: false, reason: res.data.reason ?? '不可播放' };
    } catch (e: any) {
      return { playable: false, reason: e.message ?? '请求失败' };
    }
  }

  // =========================================================================
  // 歌词
  // =========================================================================

  async resolveLyric(song: SourceEntityRef): Promise<ResolvedLyric> {
    const res = await this.ctx.http.get('/song/lyric', { params: { id: song.symbol } });
    const lyrics: ResolvedLyric = {};

    if (res.data.origin) {
      lyrics['origin'] = {
        enableAutoScroll: true,
        items: res.data.origin.map((line: any) => ({
          time: line.time,
          text: [line.text],
        })),
      };
    }

    if (res.data.translation) {
      lyrics['translation'] = {
        enableAutoScroll: true,
        items: res.data.translation.map((line: any) => ({
          time: line.time,
          text: [line.text],
        })),
      };
    }

    return lyrics;
  }

  // =========================================================================
  // 歌单
  // =========================================================================

  async resolvePlaylist(ref: SourceEntityRef) {
    {
      using loader = new this.ctx.loader('正在加载歌单...');

      const res = await this.ctx.http.get('/playlist/detail', {
        params: { id: ref.symbol },
      });

      const songs: SongBase[] = res.data.tracks.map((t: any) => ({
        sourceType: this.id,
        symbol: t.id,
        title: t.title,
        singer: t.singer,
        pic: t.cover,
      }));

      loader.setText(`已加载 ${songs.length} 首歌曲`);

      return {
        songs,
        meta: {
          title: res.data.title,
          pic: res.data.cover,
          canSubscribe: true,
          subscribed: res.data.subscribed,
        },
      };
    }
  }

  async getMyPlaylists() {
    const res = await this.ctx.http.get('/user/playlists');
    return [{
      title: '我的歌单',
      playlists: res.data.map((pl: any) => ({
        document: {
          SchemaVersion: 2 as const,
          title: pl.name,
          pic: pl.cover,
          entries: [{
            kind: 'playlistRef' as const,
            ref: {
              sourceType: this.id,
              type: SourceEntityType.Playlist,
              symbol: pl.id,
            },
          }],
        },
        metadata: {
          origin: {
            sourceType: this.id,
            type: SourceEntityType.Playlist,
            symbol: pl.id,
          },
          status: { loading: false },
        },
      })),
    }];
  }
}

export default new DemoSource();
```

---

## 插件注册约定

### 导出约定

- 每个插件文件 **必须 export default 一个 `MusicSource` 的实例**（即 `new YourSource()`）
- 宿主会通过 `import()` 动态加载，并调用 `sourceRegistry.register(source)`

### 文件结构建议

```
my-ymk-plugin/
├── src/
│   └── index.ts          # 插件入口，export default new YourSource()
├── package.json           # 依赖 @yumuzk/plugin-api
└── tsconfig.json
```

### 本地调试

1. 在宿主项目中，把插件目录添加到 `pnpm-workspace.yaml` 的 `packages` 列表（如果使用 pnpm workspace）
2. 宿主的 `package.json` 中添加本地依赖：`"my-plugin": "workspace:*"`
3. 宿主需要主动 import 并注册你的插件

### 构建与发布

- 插件应该编译为 ESM（`"type": "module"`）
- TypeScript target 建议设为 `es2022` 或更高（以支持 `using` 关键字）
- 发布到 npm 时，确保 `package.json` 的 `main`/`module`/`exports` 字段指向编译产物

---

## License

MIT
