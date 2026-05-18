import type {SongLyric} from "@/types";
import type {CurrentSong} from "@/sources/song";
import type {SongBase} from "@/sources/musicSource";

export class Creator {
  static currentSong(origin: SongBase): CurrentSong {
    return {
      url: "",
      title: "",
      singer: '',
      pic: "",
      lyrics: [] as unknown as Record<string, SongLyric>,
      lyricConfig: {
        offset: 0
      },
      origin,
    } satisfies CurrentSong
  }
}
