import { toRaw } from "vue";
import { MusicSource, SourceEntityType, type RuntimePlaylist, type SongBase, type SourceCapabilityMap, type SourceEntityRef } from "@yumuzk/plugin-api";

class LocalSource extends MusicSource {
  id = "local";
  name = "本地";

  initialize() {};

  capability: Partial<SourceCapabilityMap> = {
    appendToPlaylist: {
      available: true,
      invoke: async (song: SongBase, target: SourceEntityRef) => {
        await window.ymkAPI.appendToPlaylistFile(target.symbol, JSON.parse(JSON.stringify(song)));
        return true;
      }
    },
    getMyPlaylists: {
      available: true,
      invoke: () => this.getMyPlaylists()
    },
    resolveAlbum: {available: false, reason: "not Impl"},
    resolveArtist: {available: false, reason: "not Impl"},
    resolveLyric: {
      available: false,
      reason: "not Impl",
    },
    resolvePlaylist: {
      available: false,
      reason: "not Impl",
    },
    searchAlbums: {available: false, reason: "not Impl"},
    searchArtists: {available: false, reason: "not Impl"},
    searchPlaylists: {available: false, reason: "not Impl"},
    searchSongs: {available: false, reason: "not Impl"},
    subscribePlaylist: {
      available: false,
      reason: "本地歌单不支持订阅",
    },
    suggest: {available: false, reason: "not Impl"},
    resolvePlayback: {
      available: true,
      invoke: async (song) => {
        const url = `local-music://${encodeURIComponent(song.symbol)}`;
        const basename = song.symbol.split(/[/\\]/).pop();
        return {
          title: basename,
          singer: '未知',
          url,
        }
      }
    },
    checkSongPlayable: {
      available: false,
      reason: "not Impl",
    },
    parseLink: { available: false, reason: "not Impl" },
    getPlaylistInfo: { available: false, reason: "not Impl" },
    removePlaylist: {
      available: true,
      invoke: async (_ref: SourceEntityRef, playlist: RuntimePlaylist) => {
        await window.ymkAPI.deletePlaylistFile(playlist.metadata.origin.symbol);
      }
    },
    renamePlaylist: {
      available: true,
      invoke: async (_ref: SourceEntityRef, playlist: RuntimePlaylist, newName: string) => {
        await window.ymkAPI.renamePlaylistFile(playlist.metadata.origin.symbol, newName);
      }
    },
    changePlaylistCover: {
      available: true,
      invoke: async (_ref: SourceEntityRef, playlist: RuntimePlaylist, coverData: string) => {
        const doc = toRaw(playlist.document);
        await window.ymkAPI.writePlaylistFile(playlist.metadata.origin.symbol, { ...doc, pic: coverData });
      }
    },
    removeFromPlaylist: {
      available: true,
      invoke: async (song: SongBase, playlist: RuntimePlaylist) => {
        const doc = JSON.parse(JSON.stringify(playlist.document));
        for (const entry of doc.entries) {
          if (entry.kind === 'inlineSongs') {
            entry.songs = entry.songs.filter((s: any) =>
              !(s.sourceType === song.sourceType && s.symbol === song.symbol)
            );
          }
        }
        await window.ymkAPI.writePlaylistFile(playlist.metadata.origin.symbol, doc);
        Object.assign(playlist.document, doc);
      }
    },
    editSongInfo: {
      available: true,
      invoke: async (song: SongBase, playlist: RuntimePlaylist, updates: Partial<SongBase>) => {
        const doc = JSON.parse(JSON.stringify(playlist.document));
        for (const entry of doc.entries) {
          if (entry.kind === 'inlineSongs') {
            const target = entry.songs.find((s: any) =>
              s.sourceType === song.sourceType && s.symbol === song.symbol
            );
            if (target) {
              if (updates.title !== undefined) target.title = updates.title;
              if (updates.singer !== undefined) target.singer = updates.singer;
              if (updates.pic !== undefined) target.pic = updates.pic;
            }
          }
        }
        await window.ymkAPI.writePlaylistFile(playlist.metadata.origin.symbol, doc);
      }
    },
    customizeLyric: {
      available: true,
      invoke: async (song: SongBase, playlist: RuntimePlaylist, lyricRef: SourceEntityRef) => {
        const doc = JSON.parse(JSON.stringify(playlist.document));
        for (const entry of doc.entries) {
          if (entry.kind === 'inlineSongs') {
            const target = entry.songs.find((s: any) =>
              s.sourceType === song.sourceType && s.symbol === song.symbol
            );
            if (target) target.lyricOverride = lyricRef;
          }
        }
        await window.ymkAPI.writePlaylistFile(playlist.metadata.origin.symbol, doc);
      }
    },
  }

  async getMyPlaylists() {
    const files = await window.ymkAPI.getLocalPlaylists();
    console.log('@localFiles', files);
    return [{
      title: '本地',
      playlists: files.map((f: any) => {
        return {
          document: f,
          metadata: {
            origin: {
              sourceType: this.id,
              symbol: f.originFilename,
              type: SourceEntityType.Playlist,
            },
            status: {
              loading: false
            }
          }
        }
      })
    }]
  }
}

export default new LocalSource()
