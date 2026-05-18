import type {LoadedPlaylist, RuntimePlaylist} from "@/sources/playlist";
import {useRuntimeDataStore} from "@/stores/modules/runtimeData";
import {sourceRegistry} from "@/sources/registry";
import {showMessage} from "@/utils/message";
import type {SongBase, SourceEntityRef} from "@/sources/musicSource";
import {Loader, trackProgressSettled} from './loader'
import router from "@/router";
import {toRaw} from "vue";

export async function navigateToPlaylistDetail(playlist: RuntimePlaylist) {
  const runtimeData = useRuntimeDataStore()
  console.log(runtimeData.currentPlaylist, playlist)
  // 如果当前加载过的就是这次加载的就不重复加载了
  console.log(router.currentRoute)
  if (toRaw(runtimeData.currentPlaylist?.document) === playlist.document) {
    router.push('/playlistDetail')
    return;
  }
  {
    using loader = new Loader('/playlistDetail');
    const total = playlist.document.entries.length;
    loader.setText(`加载中 0 / ${total}`)
    const entryMetadata: LoadedPlaylist['entryMetadata'] = Array.from({length: total})
    const songsPromise = await trackProgressSettled(playlist.document.entries.map((entry, entryIndex) => {
      return new Promise<SongBase[]>(async (resolve, reject) => {
        if (entry.kind === 'inlineSongs') {
          resolve(entry.songs)
        } else {
          if (!sourceRegistry.sources.has(entry.ref.sourceType)) {
            console.warn(`[navigateToPlaylistDetail] 无法加载歌单，源未找到: ${entry.ref.sourceType}`)
            showMessage(`无法加载歌单，源未找到: ${entry.ref.sourceType}`, 5000)
            reject()
            return;
          }
          const ability = sourceRegistry.sources.get(entry.ref.sourceType)?.getAvailability('resolvePlaylist')
          if (!ability?.available) {
            console.warn(`[navigateToPlaylistDetail] 无法加载歌单，源不支持解析歌单: ${entry.ref.sourceType}`)
            showMessage(`无法加载歌单，源不支持解析歌单: ${entry.ref.sourceType}`, 5000)
            reject()
            return;
          }
          const rp = (await ability.invoke!(entry.ref));
          entryMetadata[entryIndex] = rp.meta;
          resolve(rp.songs)
        }
      })
    }),
        (done) => {
          loader.setText(`加载中 ${done} / ${total}`)
        })
    const songs = songsPromise
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value)

    runtimeData.currentPlaylist = {
      document: playlist.document,
      metadata: playlist.metadata,
      entryMetadata,
      songs: songs.flat(),
    }
    router.push('/playlistDetail')
  }
}

export type DisplayMode = 'playlist' | 'album' | 'artist';

async function resolveAndNavigate(
  ref: SourceEntityRef,
  capability: 'resolveAlbum' | 'resolveArtist',
  displayMode: DisplayMode,
  toTitle: (r: any) => string,
  toPic: (r: any) => string | undefined,
  toSongs: (r: any) => SongBase[],
  extra?: Record<string, any>,
) {
  const src = sourceRegistry.sources.get(ref.sourceType);
  if (!src) {
    showMessage(`未找到源: ${ref.sourceType}`);
    return;
  }
  const ability = src.getAvailability(capability);
  if (!ability.available) {
    showMessage(`源 ${src.name} 不支持该功能`);
    return;
  }

  using loader = new Loader('加载中');
  const r = await ability.invoke(ref);
  const songs = toSongs(r);
  const runtimeData = useRuntimeDataStore();

  runtimeData.currentPlaylist = {
    document: {
      SchemaVersion: 2,
      title: toTitle(r),
      pic: toPic(r) ?? '',
      entries: [{ kind: 'inlineSongs', songs }],
    },
    metadata: {
      origin: ref,
      status: { loading: false },
    },
    songs,
    extra: { displayMode, ...extra },
  };
  router.push('/playlistDetail');
}

export async function navigateToAlbumDetail(ref: SourceEntityRef) {
  await resolveAndNavigate(
    ref,
    'resolveAlbum',
    'album',
    (r) => r.title ?? '',
    (r) => r.pic,
    (r) => r.songs,
  );
}

export async function navigateToArtistDetail(ref: SourceEntityRef) {
  await resolveAndNavigate(
    ref,
    'resolveArtist',
    'artist',
    (r) => r.name ?? '',
    (r) => r.pic,
    (r) => r.songs,
  );
}