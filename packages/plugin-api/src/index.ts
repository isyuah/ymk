/**
 * @yumuzk/plugin-api
 *
 * YMK 音乐源插件开发 SDK。
 * 插件作者：`extends MusicSource` 并实现 `id` / `name` / `capability` / `initialize`。
 */

import { SourceAuthAny } from './auth';

export * from './auth';

// =============================================================================
// SourceEntity 相关（运行时 + 类型）
// =============================================================================

export enum SourceEntityType {
  Song,
  Playlist,
  Album,
  Artist,
  Lyric,
}

export type SourceEntityRef<TExtra = unknown> = {
  sourceType: string;
  symbol: string;
  type: SourceEntityType;
  extra?: TExtra;
};

export type SongBase<TExtra = unknown> = {
  sourceType: string;
  symbol: string;
  title?: string;
  singer?: string;
  pic?: string;
  extra?: TExtra;
  lyricOverride?: SourceEntityRef;
  lyricOffset?: number;
};

// =============================================================================
// 歌词类型
// =============================================================================

export type SongLyricItem = {
  time: number;
  text: string[];
};

export type SongLyric = {
  enableAutoScroll: boolean;
  items: SongLyricItem[];
};

// =============================================================================
// CurrentSong
// =============================================================================

export type CurrentSong = {
  url: string;
  title: string;
  singer: string;
  pic: string;
  lyrics: Record<string, SongLyric>;
  lyricConfig: {
    offset: number;
  };
  origin: SongBase;
};

// =============================================================================
// Playlist 相关
// =============================================================================

export type PlaylistEntry =
  | { kind: 'inlineSongs'; songs: SongBase[] }
  | { kind: 'playlistRef'; ref: SourceEntityRef };

export type PlaylistDocumentV2 = {
  SchemaVersion: 2;
  title: string;
  pic: string;
  intro?: string;
  entries: PlaylistEntry[];
};

export type PlaylistRuntimeMetadata = {
  origin: SourceEntityRef;
  status: { loading: boolean };
};

export type RuntimePlaylist = {
  document: PlaylistDocumentV2;
  metadata: PlaylistRuntimeMetadata;
};

export type LoadedPlaylist<T = Record<string, any>> = {
  document: PlaylistDocumentV2;
  songs: SongBase[];
  metadata: PlaylistRuntimeMetadata;
  entryMetadata?: (ResolvedPlaylist['meta'] | undefined)[];
  extra?: T;
};

// =============================================================================
// SourceContext
// =============================================================================

export interface LoaderLike {
  /** 更新显示的加载文本 */
  setText(text: string): void;
  [Symbol.dispose](): void;
}

export interface StorageAPILike {
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  has(key: string): boolean;
  delete(key: string): void;
}

export interface SourceContextLike {
  /** 通常是 axios.AxiosInstance */
  http: any;
  storage: StorageAPILike;
  loader: new (text?: string) => LoaderLike;
}

// =============================================================================
// 能力描述
// =============================================================================

export type SourceAbility<T extends (...args: any) => any> =
  | { available: true; invoke: T; reason?: string }
  | { available: false; reason: string; invoke?: never }
  | { available: () => boolean; invoke: T; reason?: string };

export type ParsedAbility<T extends (...args: any) => any> =
  | { available: true; invoke: T }
  | { available: false; reason: string };

export type AbabityReturn<K extends keyof SourceCapabilityMap> =
  SourceCapabilityMap[K] extends SourceAbility<infer Fn>
    ? Fn extends (...args: any) => Promise<infer R>
      ? R
      : never
    : never;

export interface SourceCapabilityMap {
  resolvePlaylist: SourceAbility<(ref: SourceEntityRef) => Promise<ResolvedPlaylist>>;
  resolvePlayback: SourceAbility<(song: SourceEntityRef) => Promise<ResolvedPlayback>>;
  resolveLyric: SourceAbility<(song: SourceEntityRef) => Promise<ResolvedLyric>>;
  resolveAlbum: SourceAbility<(ref: SourceEntityRef) => Promise<ResolvedAlbum>>;
  resolveArtist: SourceAbility<(ref: SourceEntityRef) => Promise<ResolvedArtist>>;
  searchSongs: SourceAbility<
    (keyword: string, page: number, pageSize: number) => Promise<PaginatedResult<SongBase>>
  >;
  searchAlbums: SourceAbility<
    (keyword: string, page: number, pageSize: number) => Promise<PaginatedResult<SearchAlbumItem>>
  >;
  searchArtists: SourceAbility<
    (keyword: string, page: number, pageSize: number) => Promise<PaginatedResult<SearchArtistItem>>
  >;
  searchPlaylists: SourceAbility<
    (keyword: string, page: number, pageSize: number) => Promise<PaginatedResult<SearchPlaylistItem>>
  >;
  suggest: SourceAbility<(keyword: string) => Promise<string[]>>;
  subscribePlaylist: SourceAbility<(ref: SourceEntityRef) => Promise<boolean>>;
  appendToPlaylist: SourceAbility<(song: SongBase, target: SourceEntityRef) => Promise<boolean>>;
  getMyPlaylists: SourceAbility<() => Promise<MyPlaylistGroup[]>>;
  checkSongPlayable: SourceAbility<(song: SourceEntityRef) => Promise<SongPlayable>>;
  parseLink: SourceAbility<(input: string) => Promise<SourceEntityRef | null>>;
  /** 轻量获取歌单基本信息（标题、封面等），不解析歌曲列表 */
  getPlaylistInfo: SourceAbility<(ref: SourceEntityRef) => Promise<PlaylistInfo>>;
  removePlaylist: SourceAbility<(ref: SourceEntityRef, playlist: RuntimePlaylist) => Promise<void>>;
  renamePlaylist: SourceAbility<(ref: SourceEntityRef, playlist: RuntimePlaylist, newName: string) => Promise<void>>;
  changePlaylistCover: SourceAbility<(ref: SourceEntityRef, playlist: RuntimePlaylist, coverData: string) => Promise<void>>;
  removeFromPlaylist: SourceAbility<(song: SongBase, playlist: RuntimePlaylist) => Promise<void>>;
  editSongInfo: SourceAbility<(song: SongBase, playlist: RuntimePlaylist, updates: Partial<SongBase>) => Promise<void>>;
  customizeLyric: SourceAbility<(song: SongBase, playlist: RuntimePlaylist, lyricRef: SourceEntityRef) => Promise<void>>;
}

export type SongPlayable =
  | { playable: true; reason?: string }
  | { playable: false; reason: string };

// =============================================================================
// 分页与搜索结果
// =============================================================================

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SearchAlbumItem {
  id: string;
  title: string;
  pic?: string;
  artist?: string;
  songCount?: number;
}

export interface SearchArtistItem {
  id: string;
  name: string;
  pic?: string;
}

export interface SearchPlaylistItem {
  id: string;
  title: string;
  pic?: string;
}

// =============================================================================
// 用户歌单
// =============================================================================

export interface MyPlaylistGroup {
  title: string;
  playlists: RuntimePlaylist[];
}

// =============================================================================
// 解析结果
// =============================================================================

export interface ResolvedPlaylist {
  songs: SongBase[];
  meta?: {
    title?: string;
    pic?: string;
    canSubscribe?: boolean;
    subscribed?: boolean;
    canAppend?: boolean;
    [key: string]: any;
  };
}

export interface ResolvedPlayback {
  url: string;
  title?: string;
  singer?: string;
  pic?: string;
}

/** 歌单基本信息，由 getPlaylistInfo 返回。不含歌曲列表。 */
export interface PlaylistInfo {
  title?: string;
  pic?: string;
  songCount?: number;
  [key: string]: any;
}

export type ResolvedLyric = CurrentSong['lyrics'];

export interface ResolvedAlbum {
  title: string;
  pic?: string;
  songs: SongBase[];
}

export interface ResolvedArtist {
  name: string;
  pic?: string;
  songs: SongBase[];
}

// =============================================================================
// MusicSource 抽象
// =============================================================================

export abstract class MusicSource {
  /** 唯一 ID,用于标识该源 */
  public abstract id: string;
  /** 展示名 */
  public abstract name: string;
  /** 由宿主自动注入,不要手动赋值 */
  ctx!: SourceContextLike;
  /** 声明该源支持的能力。未声明的能力默认视为不可用。 */
  public abstract capability: Partial<SourceCapabilityMap>;
  /** 注册表加载时会调用一次 */
  abstract initialize?(): void | Promise<void>;
  /** 认证信息 */
  public auth?: SourceAuthAny;

  /**
   * 内部使用:宿主在注册时调用,把 SourceContext 注入进来。
   * 插件作者无需手动调用。
   */
  $injectContext(ctx: SourceContextLike) {
    if (this.ctx) {
      console.warn(`[MusicSource:${this.id}] Context 重复注入`);
      return;
    }
    this.ctx = ctx;
  }

  /**
   * 获取某项能力的可用性,顺便把函数风格的 `available` 解析掉。
   * 宿主侧通常通过 `getAvailability(key)` 来发起调用。
   */
  getAvailability<K extends keyof SourceCapabilityMap>(
    key: K
  ): ParsedAbility<SourceCapabilityMap[K] extends SourceAbility<infer F> ? F : never> {
    const ability = this.capability[key];
    if (!ability) {
      return { available: false, reason: '未实现' } as any;
    }
    if (typeof ability.available === 'function') {
      const isOk = ability.available();
      if (isOk) {
        return {
          available: true,
          invoke: ability.invoke!,
        } as any;
      }
      return { available: false, reason: ability.reason || '不可用' } as any;
    }
    return ability as any;
  }
}
