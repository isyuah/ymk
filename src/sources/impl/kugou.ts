import {
  MusicSource,
  type AbabityReturn,
  type MyPlaylistGroup,
  type ResolvedLyric,
  type ResolvedPlayback,
  type ResolvedPlaylist,
  type SongPlayable,
  type SourceCapabilityMap,
  type SongBase,
  type SourceEntityRef,
  SourceEntityType,
  defineAuth,
} from "@/sources/musicSource";
import type { RuntimePlaylist } from "@/sources/playlist";
import { proceedKrcText, replacePicSizeParam } from "@/utils/u";
import { Loader } from "@/utils/v2/loader";

/**
 * 酷狗返回的结果一般是 "singer - title"
 */
function parseKugouName(name: string): { singer: string; title: string } {
  const idx = name.indexOf(" - ");
  if (idx === -1) return { singer: "", title: name };
  return {
    singer: name.slice(0, idx),
    title: name.slice(idx + 3),
  };
}

class KugouSource extends MusicSource {
  id = "kugou";
  name = "酷狗";

  initialize() {
    this.ctx.http.defaults.baseURL = "http://localhost:35653/";

    this.ctx.http.interceptors.request.use((config: any) => {
      config.params = config.params || {};
      config.method === "post" && (config.data = config.data || {});
      const token = this.ctx.storage.get<string>("auth");
      const uid = this.ctx.storage.get<string>("uid");
      if (token) {
        config.params.token = config.params.token || token;
        if (config.method === "post") {
          config.data.token = config.data.token || token;
        }
      }
      if (uid) {
        config.params.userid = config.params.userid || uid;
      }
      return config;
    });
  }

  auth = defineAuth({
    methods: [{ type: "qrcode", label: "扫码登录" }] as const,

    logout: async () => {
      this.ctx.storage.delete("auth");
      this.ctx.storage.delete("uid");
    },

    getUserInfo: async () => {
      const token = this.ctx.storage.get<string>("auth");
      const uid = this.ctx.storage.get<string>("uid");
      if (!token || !uid) return null;
      try {
        const res = await this.ctx.http.post("/user/detail", {
          token,
          userid: uid,
        });
        if (res.data.status === 1) {
          return {
            nickname: res.data.data.nickname,
            avatar: res.data.data.pic,
            signature: res.data.data.descri,
          };
        }
        return null;
      } catch {
        return null;
      }
    },

    getQRCode: async () => {
      const res = await this.ctx.http.post("/login/qr/key", {
        timestamp: Date.now(),
      });
      if (res.data.status === 1) {
        return {
          url: res.data.data.qrcode_img,
          key: res.data.data.qrcode,
        };
      }
      throw new Error("[kugou] 获取二维码失败");
    },

    checkQRStatus: async (key: string) => {
      const res = await this.ctx.http.get("/login/qr/check", {
        params: { key, timestamp: Date.now() },
      });
      if (res.data.status === 1) {
        const code = res.data.data.status;
        if (code === 4) {
          this.ctx.storage.set("auth", res.data.data.token);
          this.ctx.storage.set("uid", String(res.data.data.userid));
          return { status: "confirmed" as const };
        }
        if (code === 2) return { status: "scanned" as const };
        if (code === 0) return { status: "expired" as const };
      }
      return { status: "waiting" as const };
    },
  });

  capability: Partial<SourceCapabilityMap> = {
    searchSongs: {
      available: true,
      invoke: (kw, page, pageSize) => this.searchSongs(kw, page, pageSize),
    },
    searchAlbums: { available: false, reason: "not Impl" },
    searchArtists: { available: false, reason: "not Impl" },
    searchPlaylists: { available: false, reason: "not Impl" },
    suggest: { available: true, invoke: (kw) => this.suggest(kw) },
    resolvePlayback: {
      available: true,
      invoke: (s) => this.resolvePlayback(s),
    },
    resolvePlaylist: {
      available: true,
      invoke: (ref) => this.resolvePlaylist(ref),
    },
    resolveLyric: {
      available: true,
      invoke: (song) => this.resolveLyric(song),
    },
    checkSongPlayable: {
      available: true,
      invoke: (s) => this.checkSongPlayable(s),
    },
    getMyPlaylists: {
      available: () => this.ctx.storage.has("auth"),
      reason: "未登录",
      invoke: () => this.getMyPlaylists(),
    },
    resolveAlbum: { available: false, reason: "not Impl" },
    resolveArtist: { available: false, reason: "not Impl" },
    subscribePlaylist: { available: false, reason: "not Impl" },
    appendToPlaylist: { available: false, reason: "not Impl" },
    parseLink: { available: false, reason: "not Impl" },
    getPlaylistInfo: { available: false, reason: "not Impl" },
  };

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  async searchSongs(
    kw: string,
    page: number,
    pageSize: number
  ): Promise<AbabityReturn<"searchSongs">> {
    const res = await this.ctx.http.get("/search", {
      params: {
        keywords: kw,
        type: "song",
        page,
        pagesize: pageSize,
      },
    });
    const data = res.data.data;
    const songs: SongBase[] = (data.lists ?? []).map((s: any) => {
      return {
        sourceType: this.id,
        symbol: s.FileHash || s.HQFileHash || s.SQFileHash,
        title: s.SongName,
        singer: s.SingerName,
        pic: s.Image
          ? replacePicSizeParam(s.Image)
          : undefined,
      } satisfies SongBase;
    });
    return {
      data: songs,
      total: data.total ?? 0,
      page,
      pageSize,
    };
  }

  async suggest(kw: string): Promise<string[]> {
    const res = await this.ctx.http.get("/search/suggest", {
      params: { keywords: kw },
    });
    if (res.data.status === 1 && res.data.data) {
      return (res.data.data as any[])
        .slice(0, 6)
        .map((item: any) => item.keyword || item.RecordDataStr || item);
    }
    return [];
  }

  // ---------------------------------------------------------------------------
  // Playback
  // ---------------------------------------------------------------------------

  async resolvePlayback(song: SourceEntityRef): Promise<ResolvedPlayback> {
    const [urlR, metaR] = await Promise.allSettled([
      this.ctx.http.get("/song/url", { params: { hash: song.symbol } }),
      this.ctx.http.get("/privilege/lite", { params: { hash: song.symbol } }),
    ]);

    if (urlR.status === "rejected") {
      throw new Error(
        `[${this.id}] 播放链接获取失败: ${urlR.reason instanceof Error ? urlR.reason.message : urlR.reason}`
      );
    }

    const urlData = urlR.value.data;
    if (urlData.status !== 1 || !urlData.url?.[0]) {
      throw new Error(
        urlData.status === 2
          ? `[${this.id}] 需要 VIP`
          : `[${this.id}] 无法获取播放地址 #${song.symbol}`
      );
    }

    let title: string | undefined;
    let singer: string | undefined;
    let pic: string | undefined;

    if (metaR.status === "fulfilled" && metaR.value.data.error_code === 0) {
      const d = metaR.value.data.data[0];
      pic = replacePicSizeParam(d.trans_param?.union_cover ?? "");
      title = d.name;
      singer = d.singername;
    }

    return { url: urlData.url[0], title, singer, pic };
  }

  async checkSongPlayable(ref: SourceEntityRef): Promise<SongPlayable> {
    try {
      const res = await this.ctx.http.get("/song/url", {
        params: { hash: ref.symbol },
      });
      if (res.data.status === 1) {
        return { playable: true };
      }
      if (res.data.status === 2) {
        return { playable: false, reason: "需要 VIP" };
      }
      return { playable: false, reason: "无法播放" };
    } catch {
      return { playable: false, reason: "请求失败" };
    }
  }

  // ---------------------------------------------------------------------------
  // Lyrics
  // ---------------------------------------------------------------------------

  async resolveLyric(ref: SourceEntityRef): Promise<ResolvedLyric> {
    try {
      const lyrics: ResolvedLyric = {};

      // Step 1: search lyric candidates by hash
      const searchRes = await this.ctx.http.get("/search/lyric", {
        params: { hash: ref.symbol },
      });
      if (searchRes.data.status === 404 || !searchRes.data.candidates?.length) {
        return lyrics;
      }

      const { id, accesskey } = searchRes.data.candidates[0];
      if (!id || !accesskey) return lyrics;

      // Step 2: get decoded KRC lyric content
      const lyricRes = await this.ctx.http.get("/lyric", {
        params: { id, accesskey, fmt: "krc", decode: true },
      });

      const {
        languageSign,
        translationResult,
        originResult,
        mixedLrc,
      } = proceedKrcText(lyricRes.data.decodeContent);

      lyrics["origin"] = {
        enableAutoScroll: true,
        items: originResult,
      };

      if (languageSign) {
        lyrics["translation"] = {
          enableAutoScroll: true,
          items: translationResult,
        };
        lyrics["mixed"] = {
          enableAutoScroll: true,
          items: mixedLrc,
        };
      }

      return lyrics;
    } catch (e) {
      throw new Error(
        `[${this.id}] 歌词获取失败: ${(e as Error)?.message}`
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Playlist
  // ---------------------------------------------------------------------------

  async resolvePlaylist(ref: SourceEntityRef): Promise<ResolvedPlaylist> {
    const resolved: ResolvedPlaylist = { meta: {}, songs: [] };
    const pageSize = 100;

    {
      using loader = new Loader(`正在加载酷狗歌单 #${ref.symbol}`);

      // First page to get total count
      const firstRes = await this.ctx.http.get("/playlist/track/all", {
        params: { page: 1, pagesize: pageSize, id: ref.symbol },
      });

      if (firstRes.data.status !== 1) {
        throw new Error(`[${this.id}] 歌单加载失败`);
      }

      const data = firstRes.data.data;
      const total = data.count;
      const totalPages = Math.ceil(total / pageSize);

      const parseSongs = (info: any[]): SongBase[] => {
        if (!Array.isArray(info)) return [];
        return info.map((d: any) => {
          const { singer, title } = parseKugouName(d.name || "");
          return {
            sourceType: this.id,
            symbol: d.hash,
            pic: d.cover ? replacePicSizeParam(d.cover) : undefined,
            title: title || undefined,
            singer: singer || undefined,
          } satisfies SongBase;
        });
      };

      // Parse first page
      const allSongs: SongBase[] = parseSongs(data.info);
      loader.setText(
        `正在加载酷狗歌单 #${ref.symbol} (${Math.min(pageSize, total)}/${total})`
      );

      // Fetch remaining pages in parallel
      if (totalPages > 1) {
        const tasks: Promise<SongBase[]>[] = [];
        for (let p = 2; p <= totalPages; p++) {
          const currentPage = p;
          tasks.push(
            this.ctx.http
              .get("/playlist/track/all", {
                params: { page: currentPage, pagesize: pageSize, id: ref.symbol },
              })
              .then((res: any) => {
                loader.setText(
                  `正在加载酷狗歌单 #${ref.symbol} (${Math.min(currentPage * pageSize, total)}/${total})`
                );
                return parseSongs(res.data.data?.info);
              })
          );
        }

        const results = await Promise.allSettled(tasks);
        for (const r of results) {
          if (r.status === "fulfilled") {
            allSongs.push(...r.value);
          }
        }
      }

      resolved.songs = allSongs;
    }

    return resolved;
  }

  async getMyPlaylists(): Promise<MyPlaylistGroup[]> {
    const res = await this.ctx.http.get("/user/playlist");
    if (res.data.status !== 1) return [];

    const playlists: RuntimePlaylist[] = (res.data.data?.info ?? []).map(
      (pl: any) => {
        return {
          document: {
            SchemaVersion: 2,
            entries: [
              {
                kind: "playlistRef",
                ref: {
                  sourceType: this.id,
                  type: SourceEntityType.Playlist,
                  symbol: pl.global_collection_id || pl.listid,
                },
              },
            ],
            intro: "来自 酷狗 我的歌单",
            pic: pl.pic || "",
            title: pl.name || pl.listname,
          },
          metadata: {
            status: { loading: false },
            origin: {
              sourceType: this.id,
              type: SourceEntityType.Playlist,
              symbol: pl.global_collection_id || pl.listid,
            },
          },
        } satisfies RuntimePlaylist;
      }
    );

    return [
      {
        title: "酷狗",
        playlists,
      },
    ];
  }
}

export default new KugouSource();
