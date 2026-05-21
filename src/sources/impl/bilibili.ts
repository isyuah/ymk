import {
  MusicSource,
  defineAuth,
  type AbabityReturn,
  type MyPlaylistGroup,
  type ResolvedPlayback,
  type ResolvedPlaylist,
  type SearchArtistItem,
  type SongBase,
  type SongPlayable,
  type SourceCapabilityMap,
  type SourceEntityRef,
  SourceEntityType,
  type RuntimePlaylist,
  type PlaylistInfo,
} from "@/sources/musicSource";
// @ts-ignore - md5 没有官方 @types,旧代码也是这么 import 的
import md5 from "md5";
import QRCode from "qrcode";

const PROXY_URL = "http://localhost:35652/";
const NAV_URL = "https://api.bilibili.com/x/web-interface/nav";
const VIEW_URL = "https://api.bilibili.com/x/web-interface/view";
const PLAYURL_URL = "https://api.bilibili.com/x/player/wbi/playurl";
const FAV_LIST_URL = "https://api.bilibili.com/x/v3/fav/resource/list";
const SEARCH_TYPE_URL = "https://api.bilibili.com/x/web-interface/wbi/search/type";
const SUGGEST_URL = "https://s.search.bilibili.com/main/suggest";
const FAV_FOLDER_LIST_ALL_URL = "https://api.bilibili.com/x/v3/fav/folder/created/list-all";
const FAV_FOLDER_INFO_URL = "https://api.bilibili.com/x/v3/fav/folder/info";
const GEN_QRCODE_URL = "https://passport.bilibili.com/x/passport-login/web/qrcode/generate";
const CHECK_QRCODE_URL = "https://passport.bilibili.com/x/passport-login/web/qrcode/poll";
const ACCOUNT_INFO_URL = "https://api.bilibili.com/x/space/wbi/acc/info";

type WbiKeys = { img_key: string; sub_key: string };

// WBI.js 完整搬运
const mixinKeyEncTab = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
  33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40, 61,
  26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11, 36,
  20, 34, 44, 52,
];
const getMixinKey = (orig: string) =>
  mixinKeyEncTab
    .map((n) => orig[n])
    .join("")
    .slice(0, 32);

function encWbi(
  params: Record<string, any>,
  img_key: string,
  sub_key: string,
): Record<string, any> {
  const mixin_key = getMixinKey(img_key + sub_key);
  const curr_time = Math.round(Date.now() / 1000);
  const chr_filter = /[!'()*]/g;
  Object.assign(params, { wts: curr_time });
  const query = Object.keys(params)
    .sort()
    .map((key) => {
      const value = params[key].toString().replace(chr_filter, "");
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join("&");
  params.w_rid = md5(query + mixin_key);
  return params;
}

interface BiliExtra {
  p?: number;
  expandAll?: boolean;
}

interface ProxyReq {
  url: string;
  method: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
}

class BilibiliSource extends MusicSource {
  id = "bilibili";
  name = "哔哩哔哩";

  private wbi: { valid: boolean } & WbiKeys = {
    valid: false,
    img_key: "",
    sub_key: "",
  };
  /** 当前登录用户 mid。-1 表示未知/未登录。来自 nav 接口。 */
  private cachedMid = -1;

  initialize() {
    this.refreshWbiKeys().catch((e) => {
      console.warn(`[bilibili] WBI key 初始化失败: ${e?.message ?? e}`);
    });
  }

  auth = defineAuth({
    methods: [
      { type: 'cookie', label: 'Cookie 登录' },
      { type: 'qrcode', label: '二维码登录' }
    ] as const,
    getQRCode: async () => {
      const r = await this.proxy({
        url: GEN_QRCODE_URL,
        method: 'get',
      });
      const loginUrl = r?.data?.url;
      const key = r?.data?.qrcode_key;
      if (!loginUrl || !key) throw new Error("二维码接口返回数据不完整");
      const dataUrl = await QRCode.toDataURL(loginUrl, { width: 256, margin: 2 });
      return { url: dataUrl, key };
    },
    checkQRStatus: async (key: string) => {
      const r = await this.fullProxy({
        url: CHECK_QRCODE_URL,
        method: 'get',
        params: {
          qrcode_key: key,
        }
      });
      if (r.data?.code !== 0) throw new Error(`检查二维码状态接口返回错误: ${r.data?.message ?? '未知错误'}`);
      switch (r.data.data.code) {
        case 0:
          const rawCookies = r.headers['x-set-cookies'] || r.headers['X-Set-Cookies'];
          if (!rawCookies) throw new Error("登录成功但未返回 cookies");
          const cookies: string[] = typeof rawCookies === 'string' ? JSON.parse(rawCookies) : rawCookies;
          this.ctx.storage.set('auth', cookies);
          return { status: 'confirmed' as const, cookie: cookies };
        case 86101:
          return { status: 'waiting' as const };
        case 86090:
          return { status: 'waiting' as const };
        case 86038:
          return { status: 'expired' as const };
      }
      return { status: 'waiting' as const };
    },
    getUserInfo: async () => {
      const cookies = this.ctx.storage.get<string[]>('auth');
      if (!cookies || !cookies.length) return null;
      const data = await this.proxy<any>({ url: NAV_URL, method: 'get' });
      if (!data?.data?.isLogin) return null;
      this.cachedMid = data.data.mid;
      const data2 = await this.proxyWbi<any>({ url: ACCOUNT_INFO_URL, method: 'get', params: { mid: this.cachedMid } });
      return {
        nickname: data2.data.name,
        avatar: data2.data.face,
        signature: data2.data.sign,
        uid: data2.data.mid,
        vipType: data2.data.vip.type,
        vipStatus: data2.data.vip.status,
      };
    },
    logout: async () => {
      this.ctx.storage.set('auth', null);
      this.cachedMid = -1;
    },
    loginWithCookie: async (cookie: string) => {
      const cookies = cookie.split(';').map(s => s.trim()).filter(Boolean);
      this.ctx.storage.set('auth', cookies);
      const info = await this.auth.getUserInfo();
      if (!info) {
        this.ctx.storage.set('auth', null);
        return false;
      }
      return true;
    },
  })

  capability: Partial<SourceCapabilityMap> = {
    resolvePlayback: {
      available: true,
      invoke: (s) => this.resolvePlayback(s as SourceEntityRef<BiliExtra>),
    },
    resolvePlaylist: {
      available: true,
      invoke: (ref) => this.resolvePlaylist(ref as SourceEntityRef<BiliExtra>),
    },
    checkSongPlayable: {
      available: true,
      invoke: (ref) => this.checkSongPlayable(ref as SourceEntityRef<BiliExtra>),
    },
    // ---- 以下待实现 ----
    resolveAlbum: { available: false, reason: "未实现" },
    resolveArtist: { available: false, reason: "未实现" },
    resolveLyric: { available: false, reason: "Bilibili 视频暂无歌词支持" },
    searchSongs: {
      available: true,
      invoke: (kw, page, pageSize) => this.searchSongs(kw, page, pageSize),
    },
    searchAlbums: { available: false, reason: "Bilibili 没有专辑概念" },
    searchArtists: {
      available: true,
      invoke: (kw, page, pageSize) => this.searchArtists(kw, page, pageSize),
    },
    searchPlaylists: {
      available: false,
      reason: "Bilibili web 端没有公开的收藏夹搜索接口",
    },
    suggest: { available: true, invoke: (kw) => this.suggest(kw) },
    subscribePlaylist: { available: false, reason: "未实现" },
    appendToPlaylist: { available: false, reason: "未实现" },
    getMyPlaylists: {
      available: () => {
        const auth = this.ctx.storage.get<string[]>("auth");
        return !!(auth && auth.length);
      },
      reason: "未登录",
      invoke: () => this.getMyPlaylists(),
    },
    parseLink: { available: true, invoke: (input) => this.parseLink(input) },
    getPlaylistInfo: { available: true, invoke: (ref) => this.getPlaylistInfo(ref) },
  };


  private async proxy<T = any>(req: ProxyReq): Promise<T> {
    return this.fullProxy(req).then(t => t.data);
  }
  private async fullProxy<T = any>(req: ProxyReq): Promise<{
    data: T,
    headers: Record<string, string>,
  }> {
    const headers: Record<string, string> = {
      Origin: "https://www.bilibili.com/",
      Referer: "https://www.bilibili.com/",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ...req.headers,
    };
    const auth = this.ctx.storage.get<string[]>("auth");
    if (auth && auth.length && !("Cookie" in headers)) {
      headers["Cookie"] = auth.join(";") + ";buvid3=1;";
    }
    const resp = await this.ctx.http.post(PROXY_URL, {
      url: req.url,
      method: req.method,
      headers,
      data: req.data,
      params: req.params,
    });
    return {
      data: resp.data,
      headers: resp.headers,
    }
  }

  private async proxyWbi<T = any>(req: ProxyReq): Promise<T> {
    if (!this.wbi.valid) await this.refreshWbiKeys();
    const params = encWbi(
      { ...req.params },
      this.wbi.img_key,
      this.wbi.sub_key,
    );
    return this.proxy<T>({ ...req, params });
  }

  private async refreshWbiKeys() {
    const data = await this.proxy<any>({ url: NAV_URL, method: "get" });
    const img_url: string = data?.data?.wbi_img?.img_url;
    const sub_url: string = data?.data?.wbi_img?.sub_url;
    if (!img_url || !sub_url) throw new Error("nav 接口未返回 wbi_img");
    this.wbi = {
      valid: true,
      img_key: img_url.slice(
        img_url.lastIndexOf("/") + 1,
        img_url.lastIndexOf("."),
      ),
      sub_key: sub_url.slice(
        sub_url.lastIndexOf("/") + 1,
        sub_url.lastIndexOf("."),
      ),
    };
    if (data?.data?.isLogin && typeof data.data.mid === "number") {
      this.cachedMid = data.data.mid;
    }
  }

  private async getMyMid(): Promise<number> {
    if (this.cachedMid > 0) return this.cachedMid;
    if (!this.wbi.valid) {
      try {
        await this.refreshWbiKeys();
      } catch {
        // 忽略,下面再单独 nav 一次
      }
    }
    if (this.cachedMid > 0) return this.cachedMid;
    // 兜底再 nav 一次(refreshWbiKeys 失败时)
    try {
      const data = await this.proxy<any>({ url: NAV_URL, method: "get" });
      if (data?.data?.isLogin && typeof data.data.mid === "number") {
        this.cachedMid = data.data.mid;
      }
    } catch {
      /* ignore */
    }
    return this.cachedMid;
  }

  async resolvePlayback(song: SourceEntityRef<BiliExtra>): Promise<ResolvedPlayback> {
    const view = await this.proxy<any>({
      url: VIEW_URL,
      method: "get",
      params: { bvid: song.symbol },
    });
    const data = view?.data;
    if (!data) throw new Error(`[bilibili] 获取视频信息失败 ${song.symbol}`);

    const p = song.extra?.p;
    const cid =
      p !== undefined && Array.isArray(data.pages)
        ? data.pages[p - 1]?.cid
        : data.cid;
    if (!cid) throw new Error(`[bilibili] 找不到 cid (bvid=${song.symbol}, p=${p})`);

    const par: Record<string, any> = {
      bvid: song.symbol,
      cid,
      platform: "html5",
    };
    const auth = this.ctx.storage.get<string[]>("auth");
    if (auth && auth.length) {
      par.high_quality = 1;
    }

    const playR = await this.proxyWbi<any>({
      url: PLAYURL_URL,
      method: "get",
      params: par,
    });
    const url = playR?.data?.durl?.[0]?.url;
    if (!url) {
      throw new Error(
        `[bilibili] 获取播放地址失败 ${song.symbol}: ${playR?.message ?? "无 durl"}`,
      );
    }

    return {
      url,
      title: data.title,
      singer: data.owner?.name,
      pic: data.pic,
    };
  }

  async resolvePlaylist(ref: SourceEntityRef<BiliExtra>): Promise<ResolvedPlaylist> {
    const expandAll = !!(ref.extra as any)?.expandAll;
    const songs: SongBase[] = [];
    let pn = 0;
    let hasMore = true;
    let coverPic: string | undefined;
    let title: string | undefined;

    using loader = new this.ctx.loader(`正在加载 Bilibili 收藏夹 #${ref.symbol}`);
    while (hasMore) {
      pn++;
      loader.setText(`正在加载 Bilibili 收藏夹 #${ref.symbol} 第 ${pn} 页`);
      const r = await this.proxy<any>({
        url: FAV_LIST_URL,
        method: "get",
        params: {
          media_id: ref.symbol,
          pn,
          ps: 20,
        },
      });
      const data = r?.data;
      if (!data) break;
      if (pn === 1) {
        title = data.info?.title;
        coverPic = data.info?.cover;
      }
      const medias: any[] = data.medias ?? [];
      for (const m of medias) {
        if (expandAll && m.page > 1) {
          for (let i = 1; i <= m.page; i++) {
            songs.push({
              sourceType: this.id,
              symbol: m.bvid,
              title: `P${i} ${m.title}`,
              pic: m.cover,
              singer: m.upper?.name,
              extra: { p: i },
            } satisfies SongBase);
          }
        } else {
          songs.push({
            sourceType: this.id,
            symbol: m.bvid,
            title: m.title,
            pic: m.cover,
            singer: m.upper?.name,
          } satisfies SongBase);
        }
      }
      hasMore = !!data.has_more;
    }

    return {
      songs,
      meta: {
        title,
        pic: coverPic,
      },
    } satisfies AbabityReturn<"resolvePlaylist">;
  }

  async checkSongPlayable(ref: SourceEntityRef): Promise<SongPlayable> {
    try {
      const view = await this.proxy<any>({
        url: VIEW_URL,
        method: "get",
        params: { bvid: ref.symbol },
      });
      const data = view?.data;
      if (!data) return { playable: false, reason: "视频不存在" };
      const p = (ref.extra as any)?.p as number | undefined;
      const cid =
        p !== undefined && Array.isArray(data.pages)
          ? data.pages[p - 1]?.cid
          : data.cid;
      if (!cid) return { playable: false, reason: `找不到分 P ${p}` };
      return { playable: true };
    } catch (e: any) {
      return { playable: false, reason: e?.message ?? String(e) };
    }
  }

  /**
   * 视频搜索 -> SongBase[]
   * search_type=video,需要 WBI 签名 + buvid3 cookie。
   *
   * Bilibili 服务端固定 pagesize=20。为了让调用方拿到自己期望的 pageSize,
   * 这里做客户端二次分页:把 (page, pageSize) 翻译成对应的 1~2 个 B 站页,
   * 并发拉取后切片返回。
   */
  async searchSongs(
    keyword: string,
    page: number,
    pageSize: number,
  ): Promise<AbabityReturn<"searchSongs">> {
    const pages = await this.fetchSearchPagesForSlice(
      "video",
      keyword,
      page,
      pageSize,
    );
    const total = Math.min(pages.firstPageData?.numResults ?? 0, 1000);
    const songs: SongBase[] = pages.slice.map((v: any) => ({
      sourceType: this.id,
      symbol: v.bvid,
      // 标题里 B 站会塞 <em class="keyword">...</em> 高亮
      title: stripEm(v.title),
      singer: v.author,
      pic: normalizeProtocolRelative(v.pic),
    } satisfies SongBase));
    return {
      data: songs,
      total,
      page,
      pageSize,
    } satisfies AbabityReturn<"searchSongs">;
  }

  async searchArtists(
    keyword: string,
    page: number,
    pageSize: number,
  ): Promise<AbabityReturn<"searchArtists">> {
    const pages = await this.fetchSearchPagesForSlice(
      "bili_user",
      keyword,
      page,
      pageSize,
    );
    const total = Math.min(pages.firstPageData?.numResults ?? 0, 1000);
    const items: SearchArtistItem[] = pages.slice.map((u: any) => ({
      id: String(u.mid),
      name: stripEm(u.uname) ?? "",
      pic: normalizeProtocolRelative(u.upic),
    } satisfies SearchArtistItem));
    return {
      data: items,
      total,
      page,
      pageSize,
    } satisfies AbabityReturn<"searchArtists">;
  }

  private async fetchSearchPagesForSlice(
    searchType: string,
    keyword: string,
    page: number,
    pageSize: number,
  ): Promise<{ slice: any[]; firstPageData: any }> {
    const startGlobalIdx = (page - 1) * pageSize;
    const endGlobalIdx = page * pageSize;
    const BILI_PAGE_SIZE = 20;
    const firstBiliPage = Math.floor(startGlobalIdx / BILI_PAGE_SIZE) + 1;
    const lastBiliPage = Math.ceil(endGlobalIdx / BILI_PAGE_SIZE);
    const biliPageNums: number[] = [];
    for (let p = firstBiliPage; p <= lastBiliPage; p++) biliPageNums.push(p);

    const responses = await Promise.all(
      biliPageNums.map((p) =>
        this.proxyWbi<any>({
          url: SEARCH_TYPE_URL,
          method: "get",
          params: { search_type: searchType, keyword, page: p },
        }),
      ),
    );

    const flat: any[] = [];
    for (const r of responses) {
      const list = r?.data?.result;
      if (Array.isArray(list)) flat.push(...list);
    }

    const offsetInFirst = startGlobalIdx % BILI_PAGE_SIZE;
    const slice = flat.slice(offsetInFirst, offsetInFirst + pageSize);
    return { slice, firstPageData: responses[0]?.data };
  }

  async suggest(keyword: string): Promise<string[]> {
    const r = await this.proxy<any>({
      url: SUGGEST_URL,
      method: "get",
      params: { term: keyword },
    });
    const tags: any[] = r?.result?.tag ?? [];
    return tags.map((t) => t.value).filter(Boolean).slice(0, 10);
  }

  async getMyPlaylists(): Promise<MyPlaylistGroup[]> {
    const mid = await this.getMyMid();
    if (mid <= 0) {
      throw new Error("未登录或获取用户信息失败");
    }
    const r = await this.proxy<any>({
      url: FAV_FOLDER_LIST_ALL_URL,
      method: "get",
      params: { up_mid: mid },
    });
    const list: any[] = r?.data?.list ?? [];
    const playlists: RuntimePlaylist[] = list.map((f) => ({
      document: {
        SchemaVersion: 2,
        title: f.title,
        pic: "https://picsum.photos/400/400?random=1", // 他没给API，随便找个随机图片API了
        intro: `Bilibili 收藏夹 #${f.id} (${f.media_count} 项)`,
        entries: [
          {
            kind: "playlistRef",
            ref: {
              sourceType: this.id,
              type: SourceEntityType.Playlist,
              symbol: String(f.id),
            },
          },
        ],
      },
      metadata: {
        status: { loading: false },
        origin: {
          sourceType: this.id,
          type: SourceEntityType.Playlist,
          symbol: String(f.id),
        },
      },
    } satisfies RuntimePlaylist));
    return [{ title: "哔哩哔哩 收藏夹", playlists }];
  }

  async parseLink(input: string): Promise<SourceEntityRef | null> {
    const favMatch = input.match(/bilibili\.com\/.*[?&]fid=(\d+)/);
    if (favMatch) {
      return { sourceType: this.id, symbol: favMatch[1], type: SourceEntityType.Playlist };
    }
    if (/^\d+$/.test(input.trim())) {
      return { sourceType: this.id, symbol: input.trim(), type: SourceEntityType.Playlist };
    }
    const bvMatch = input.match(/(BV[a-zA-Z0-9]+)/);
    if (bvMatch) {
      return { sourceType: this.id, symbol: bvMatch[1], type: SourceEntityType.Song };
    }
    return null;
  }

  async getPlaylistInfo(ref: SourceEntityRef): Promise<PlaylistInfo> {
    const r = await this.proxy<any>({
      url: FAV_FOLDER_INFO_URL,
      method: "get",
      params: { media_id: ref.symbol },
    });
    if (r?.code !== 0 || !r?.data) {
      throw new Error(`[bilibili] 获取收藏夹信息失败: ${r?.message ?? '未知错误'}`);
    }
    return {
      title: r.data.title,
      pic: normalizeProtocolRelative(r.data.cover),
      songCount: r.data.media_count,
    };
  }
}

/** 去掉搜索结果里的 <em class="keyword">xxx</em> 高亮标签 */
function stripEm(s: string | undefined): string | undefined {
  if (!s) return s;
  return s.replace(/<em[^>]*>/g, "").replace(/<\/em>/g, "");
}

/** B 站封面常以 `//i0.hdslb.com/...` 形式返回,补上 https: */
function normalizeProtocolRelative(url: string | undefined): string | undefined {
  if (!url) return url;
  if (url.startsWith("//")) return "https:" + url;
  return url;
}

export default new BilibiliSource();
