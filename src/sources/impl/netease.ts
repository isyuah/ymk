import {
  MusicSource,
  type AbabityReturn,
  type MyPlaylistGroup,
  type ResolvedLyric,
  type ResolvedPlayback,
  type ResolvedPlaylist,
  type SearchAlbumItem,
  type SearchArtistItem,
  type SearchPlaylistItem,
  type SongPlayable,
  type SourceCapabilityMap,
  type SongBase, type SourceEntityRef, SourceEntityType,
  type PlaylistInfo,
  type ResolvedAlbum,
  type ResolvedArtist,
  defineAuth
} from "@/sources/musicSource";
import type {RuntimePlaylist} from "@/sources/playlist";
import {proceedLrcText} from "@/utils/u";
import { Loader } from "@/utils/v2/loader";

class NeteaseSource extends MusicSource {
  id = "netease";
  name = "网易云";
  API = new Proxy({}, {
    get: (target, prop) => {
      return async (...args: any[]) => {
        const cookie = this.ctx.storage.get<string>('auth');
        const resp = await (window as any).NeteaseAPI.call(prop, { cookie, timestamp: (new Date()).getTime(), ...args[0] });
        return {code: resp.code, ...resp.body};
      };
    }
  }) as typeof window['NeteaseAPIProxy'];

  initialize() {};

  auth = defineAuth({
    methods: [
      { type: 'qrcode', label: '扫码登录' },
      { type: 'cookie', label: 'Cookie 登录' },
    ] as const,
    logout: async () => {
      await this.API.logout({} as any);
      this.ctx.storage.set('auth', null);
      this.ctx.storage.set('uid', null);
    },
    getUserInfo: async () => {
      const cookie = this.ctx.storage.get<string>('auth');
      if (!cookie) return null;
      const r = await this.API.login_status({});
      const profile = r.data?.profile;
      if (!profile) return null;
      this.ctx.storage.set('uid', String(profile.userId));
      return {
        nickname: profile.nickname,
        avatar: profile.avatarUrl,
        signature: profile.signature,
      };
    },
    getQRCode: async () => {
      const keyRes = await this.API.login_qr_key({});
      const key = (keyRes as any).data.unikey;
      const qrRes = await this.API.login_qr_create({ key, qrimg: true });
      return { url: (qrRes as any).data.qrimg, key };
    },
    checkQRStatus: async (key: string) => {
      const r = await this.API.login_qr_check({ key });
      const code = r.code;
      if (code === 803) {
        const cookie = r.cookie;
        this.ctx.storage.set('auth', cookie);
        return { status: 'confirmed' as const, cookie };
      }
      if (code === 802) return { status: 'scanned' as const };
      if (code === 800) return { status: 'expired' as const };
      return { status: 'waiting' as const };
    },
    loginWithCookie: async (cookie: string) => {
      this.ctx.storage.set('auth', cookie);
      const info = await this.auth.getUserInfo();
      if (!info) {
        this.ctx.storage.set('auth', null);
        return false;
      }
      return true;
    },
  })

  capability: Partial<SourceCapabilityMap> = {
    appendToPlaylist: {available: false, reason: "not Impl"},
    getMyPlaylists: {
      available: () => {
        return this.ctx.storage.has('auth')
      }, reason: "未登录", invoke: () => this.getMyPlaylists()
    },
    resolveAlbum: {available: true, invoke: (ref) => this.resolveAlbum(ref)},
    resolveArtist: {available: true, invoke: (ref) => this.resolveArtist(ref)},
    resolveLyric: {
      available: true,
      invoke: song => this.resolveLyric(song)
    },
    resolvePlaylist: {
      available: true,
      invoke: (ref) => this.resolvePlaylist(ref)
    },
    searchAlbums: {available: true, invoke: (kw, page, pageSize) => this.searchAlbums(kw, page, pageSize)},
    searchArtists: {available: true, invoke: (kw, page, pageSize) => this.searchArtists(kw, page, pageSize)},
    searchPlaylists: {available: true, invoke: (kw, page, pageSize) => this.searchPlaylists(kw, page, pageSize)},
    searchSongs: {available: true, invoke: (kw, page, pageSize) => this.searchSongs(kw, page, pageSize)},  
    subscribePlaylist: {
      available: () => {
        return this.ctx.storage.has('auth')
      }, reason: "未登录", invoke: (ref) => this.subscribePlaylist(ref)
    },
    suggest: {available: true, invoke: kw => this.suggest(kw)},
    resolvePlayback: {
      available: true,
      invoke: (s) => this.resolvePlayback(s),
    },
    checkSongPlayable: {
      available: true,
      invoke: (s) => this.checkSongPlayable(s),
    },
    parseLink: {
      available: true,
      invoke: (input) => this.parseLink(input),
    },
    getPlaylistInfo: {
      available: true,
      invoke: (ref) => this.getPlaylistInfo(ref),
    }
  }
  async parseLink(input: string): Promise<import("@/sources/musicSource").SourceEntityRef | null> {
    // 网易云歌单 URL: music.163.com/#/playlist?id=123456
    const playlistMatch = input.match(/music\.163\.com\/#\/playlist\?id=(\d+)/);
    if (playlistMatch) {
      return { sourceType: this.id, symbol: playlistMatch[1], type: SourceEntityType.Playlist };
    }
    // 网易云歌曲 URL: music.163.com/#/song?id=123456
    const songMatch = input.match(/music\.163\.com\/#\/song\?id=(\d+)/);
    if (songMatch) {
      return { sourceType: this.id, symbol: songMatch[1], type: SourceEntityType.Song };
    }
    // 纯数字 → 视为歌单 ID
    if (/^\d+$/.test(input.trim())) {
      return { sourceType: this.id, symbol: input.trim(), type: SourceEntityType.Playlist };
    }
    return null;
  }

  async getPlaylistInfo(ref: SourceEntityRef): Promise<PlaylistInfo> {
    const r = await this.API.playlist_detail({
      id: ref.symbol,
    });
    return {
      title: r.playlist.name,
      pic: r.playlist.coverImgUrl,
      songCount: r.playlist.trackCount,
    };
  }

  async resolveAlbum(ref: SourceEntityRef): Promise<ResolvedAlbum> {
    const r = await this.API.album({
      id: ref.symbol,
    });
    const songs: SongBase[] = (r.songs ?? []).map((s: any) => ({
      sourceType: this.id,
      symbol: s.id,
      title: s.name,
      singer: s.ar?.map((a: any) => a.name).join(' & '),
      pic: s.al?.picUrl,
    }) satisfies SongBase);
    return {
      title: r.album?.name,
      pic: r.album?.picUrl,
      songs,
    };
  }

  async resolveArtist(ref: SourceEntityRef): Promise<ResolvedArtist> {
    const [detailR, songsR] = await Promise.all([
      this.API.artist_detail({ id: ref.symbol }),
      this.API.artist_songs({ id: ref.symbol, limit: 50, order: 'hot' as any }),
    ]);
    const songs: SongBase[] = (songsR.songs ?? []).map((s: any) => ({
      sourceType: this.id,
      symbol: s.id,
      title: s.name,
      singer: s.ar?.map((a: any) => a.name).join(' & '),
      pic: s.al?.picUrl,
    }) satisfies SongBase);
    const data = detailR.data;
    return {
      name: data?.artist?.name,
      pic: data?.artist?.cover,
      songs,
    };
  }

  async searchPlaylists(kw: string, page: number, pageSize: number): Promise<AbabityReturn<'searchPlaylists'>> {
    const r = await this.API.cloudsearch({
      keywords: kw,
      type: 1000 as any,
      offset: (page - 1) * pageSize,
      limit: pageSize
    })
    return {
      total: r.result.playlistCount,
      page,
      pageSize,
      data: r.result.playlists.map((p: any) => {
        return {
          id: p.id,
          title: p.name,
          pic: p.coverImgUrl,
        } satisfies SearchPlaylistItem
      })

    } satisfies AbabityReturn<'searchPlaylists'>;
  }

  async searchArtists(kw: string, page: number, pageSize: number): Promise<AbabityReturn<'searchArtists'>> {
    const r = await this.API.cloudsearch({
      keywords: kw,
      type: 100 as any,
      offset: (page - 1) * pageSize,
      limit: pageSize
    })
    return {
      total: r.result.artistCount,
      page,
      pageSize,
      data: r.result.artists.map((p: any) => {
        return {
          id: p.id,
          name: p.name,
          pic: p.picUrl,
        } satisfies SearchArtistItem
      })

    } satisfies AbabityReturn<'searchArtists'>;
  }

  async searchAlbums(kw: string, page: number, pageSize: number): Promise<AbabityReturn<'searchAlbums'>> {
    const r = await this.API.cloudsearch({
      keywords: kw,
      type: 10 as any,
      offset: (page - 1) * pageSize,
      limit: pageSize
    })
    return {
      total: r.result.albumCount,
      page,
      pageSize,
      data: r.result.albums.map((p: any) => {
        return {
          id: p.id,
          title: p.name,
          pic: p.picUrl,
        } satisfies SearchAlbumItem
      })

    } satisfies AbabityReturn<'searchAlbums'>;
  }

  async searchSongs(kw: string, page: number, pageSize: number): Promise<AbabityReturn<'searchSongs'>> {
    const r = await this.API.cloudsearch({
      keywords: kw,
      type: 1 as any,
      offset: (page - 1) * pageSize,
      limit: pageSize,
    })
    const songs = r.result.songs.map((s: any) => {
      return {
        sourceType: this.id,
        symbol: s.id,
        title: s.name,
        singer: s.ar.map((a: any) => a.name).join(' & '),
        pic: s.al.picUrl,
      } satisfies SongBase;
    });
    return {
      data: songs,
      total: r.result.songCount,
      page,
      pageSize
    } satisfies AbabityReturn<'searchSongs'>;
  }

  async suggest(kw: string) {
    const r = await this.API.search_suggest({
      keywords: kw,
      type: 'mobile' as any
    })
    if (r.result.allMatch) {
      return r.result.allMatch.slice(0, 6).map((match: any) => match.keyword);
    } else {
      return []
    }
  }

  async checkSubscribed(ref: SourceEntityRef) {
    const r = await this.API.playlist_detail({
      id: ref.symbol
    })
    return r.playlist.subscribed && r.playlist.userId != this.ctx.storage.get<string>('uid');
  }

  async subscribePlaylist(ref: SourceEntityRef) {
    try {
      const subscribed = await this.checkSubscribed(ref);
      const r = await this.API.playlist_subscribe({
        id: ref.symbol,
        t: (subscribed ? 2 : 1) as any,
      })
      return r.code === 200;
    } catch (error) {
      console.error(`[${this.id}] 订阅歌单失败: ${(error as Error).message}`);
      return false;
    }
  }

  async checkSongPlayable(ref: SourceEntityRef): Promise<SongPlayable> {
    const res = await this.API.check_music({
      id: ref.symbol,
      br: 999000
    })
    return {
      playable: res.success,
      reason: res.message,
    }
  }

  async resolveLyric(ref: SourceEntityRef): Promise<ResolvedLyric> {
    try {
      const lyrics: ResolvedLyric = {}
      const r = await this.API.lyric({
        id: ref.symbol,
      });
      let hasTimedLyric = false, hasTimedTranslationLyric = false;
      if (r.lrc?.lyric) {
        const {result, enableAutoScroll} = proceedLrcText(r.lrc.lyric)
        lyrics['origin'] = {
          items: result,
          enableAutoScroll
        }
        if (enableAutoScroll) hasTimedLyric = true;
      }
      if (r.tlyric?.lyric) {
        const {result, enableAutoScroll} = proceedLrcText(r.tlyric.lyric)
        lyrics['translation'] = {
          items: result,
          enableAutoScroll
        }
        if (enableAutoScroll) hasTimedTranslationLyric = true;
      }
      if (hasTimedLyric && hasTimedTranslationLyric) {
        const result = [];
        let pointerOrigin = 0, pointerTranslation = 0;
        const origin = lyrics['origin'].items,
            translation = lyrics['translation'].items;
        while (pointerOrigin < origin.length && pointerTranslation < translation.length) {
          if (origin[pointerOrigin].time === translation[pointerTranslation].time) {
            result.push({
              time: origin[pointerOrigin].time,
              text: [origin[pointerOrigin].text[0], translation[pointerTranslation].text[0]],
            })
            pointerOrigin++; pointerTranslation++;
          } else if (origin[pointerOrigin].time > translation[pointerTranslation].time) {
            result.push(translation[pointerTranslation++])
          } else {
            result.push(origin[pointerOrigin++])
          }
        }
        while (pointerOrigin < origin.length) result.push(origin[pointerOrigin++]);
        while (pointerTranslation < translation.length) result.push(translation[pointerTranslation++]);
        lyrics['mixed'] = {
          items: result,
          enableAutoScroll: true
        };
      }
      return lyrics;
    } catch (e) {
      throw new Error(`[${this.id}] 歌词获取失败: ${(e as Error)?.message}`)
    }
  }

  async resolvePlayback(song: SongBase): Promise<ResolvedPlayback> {
    const [detailR, urlR] = await Promise.allSettled([
      this.API.song_detail({
        ids: song.symbol.toString()
      }),
      this.API.song_url_v1({
        id: song.symbol,
        level: 'exhigh' as any,
      })
    ])
    if (urlR.status === 'rejected') {
      throw new Error(`[${this.id}] 播放链接获取失败: ${urlR.reason instanceof Error ? urlR.reason.message : urlR.reason}`)
    }
    const detailD = detailR.status === 'fulfilled' ? (detailR.value as any).songs[0] : null;
    const urlD = (urlR.value as any).data[0];
    if (!urlD.url) throw new Error(`[${this.id}] 无法获取播放地址 #${song.symbol}`)
    return {
      url: urlD.url,
      title: detailD?.name,
      singer: detailD?.ar?.map((a: any) => a.name).join(' & '),
      pic: detailD?.al?.picUrl,
    }
  }

  async resolvePlaylist(ref: SourceEntityRef): Promise<ResolvedPlaylist> {
    const resolved: ResolvedPlaylist = {
      meta: {}, songs: []
    }
    const uid = this.ctx.storage.get<string>("uid");
    const r = await this.API.playlist_detail({
      id: ref.symbol,
    });
    resolved.meta!.subscribed = r.playlist.subscribed || r.playlist.userId == uid;
    resolved.meta!.canSubscribe = r.playlist.userId != uid;
    resolved.meta!.pic = r.playlist.coverImgUrl;
    resolved.meta!.title = r.playlist.name;
    const totalSongCount = r.playlist.trackCount;
    const sliceSize = 500;
    {
      using loader = new Loader(`正在加载网易云歌单 #${ref.symbol}`)
      const tasks: Promise<SongBase[]>[] = [];
      for (let cnt = 0; cnt < totalSongCount; cnt+=sliceSize) {
        tasks.push(new Promise<SongBase[]>((resolve, reject) =>
          this.API.playlist_track_all({
            id: ref.symbol,
            limit: sliceSize,
            offset: cnt
          }).then(r => {
            if (r.code !== 200) reject();
            loader.setText(`正在加载网易云歌单 #${ref.symbol} (${Math.min(cnt + sliceSize, totalSongCount)}/${totalSongCount})`)
            resolve((r.songs as any).map((song: any) => ({
              sourceType: this.id,
              symbol: song.id,
              title: song.name,
              pic: song.al.picUrl,
              singer: song.ar.map((ar: any) => ar.name).join(' & '),
            }) satisfies SongBase))
          }).catch(reject)
        ))
      }
      resolved.songs = (await Promise.allSettled(tasks))
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)
        .flat()
      return resolved;
    }
  }

  async getMyPlaylists(): Promise<MyPlaylistGroup[]> {
    const uid = this.ctx.storage.get<string>("uid");
    const dailyRecommendPlaylists = this.API.recommend_resource({}).then((resp: any) => {
      const recommend = resp.recommend;
      return (recommend.map((playlist: any) => {
        return {
          document: {
            SchemaVersion: 2,
            entries: [{
              kind: 'playlistRef',
              ref: {
                sourceType: this.id,
                type: SourceEntityType.Playlist,
                symbol: playlist.id,
              }
            }],
            intro: "网易云每日推荐",
            pic: playlist.picUrl,
            title: playlist.name,
          },
          metadata: {
            status: {
                loading: false,
            },
            origin: {
              sourceType: this.id,
              type: SourceEntityType.Playlist,
              symbol: playlist.id,
            }
          }
        } satisfies RuntimePlaylist;
      }))
    })
    const myPlaylists = this.API.user_playlist({
      uid: uid!
    }).then((resp: any) => {
      const playlist = resp.playlist;
      return (playlist.map((playlist: any) => {
        return {
          document: {
            SchemaVersion: 2,
            entries: [{
              kind: 'playlistRef',
              ref: {
                sourceType: this.id,
                type: SourceEntityType.Playlist,
                symbol: playlist.id,
                extra: {
                  owned: playlist.creator.userId === uid
                }
              }
            }],
            intro: "来自 网易云 我的歌单",
            pic: playlist.coverImgUrl,
            title: playlist.name,
          },
          metadata: {
            status: {
              loading: false,
            },
            origin: {
              sourceType: this.id,
              type: SourceEntityType.Playlist,
              symbol: playlist.id,
            }
          }
        } satisfies RuntimePlaylist;
      }))
    });
    const titles = ['网易云每日推荐', '网易云']
    return Promise.allSettled([dailyRecommendPlaylists, myPlaylists]).then(arr => {
      return arr.map((p, i) => ({ p, title: titles[i] }))
          .filter((item): item is { p: PromiseFulfilledResult<RuntimePlaylist[]>, title: string } =>
              item.p.status === 'fulfilled' && !!item.title
          )
          .map(item => ({
            title: item.title,
            playlists: item.p.value
          })) satisfies MyPlaylistGroup[];
    });
  }
}

export default new NeteaseSource();