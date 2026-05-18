import type {SongLyric} from "@/types";
import {type SongBase, type SourceEntityRef, SourceEntityType} from "@/sources/musicSource";

export type CurrentSong = {
  url: string,
  title: string,
  singer: string,
  pic: string,
  lyrics: Record<string, SongLyric>,
  lyricConfig: {
    offset: number
  },
  origin: SongBase,
}

export function ToSourceEntityRef(song: SongBase): SourceEntityRef;
export function ToSourceEntityRef(sourceType: string, symbol: string, type: SourceEntityType): SourceEntityRef;
export function ToSourceEntityRef(...args: any[]): SourceEntityRef {
  if (typeof args[0] === 'object') {
    const [song, type = SourceEntityType.Song] = args;
    return { sourceType: song.sourceType, symbol: song.symbol, type, extra: song.extra };
  }
  const [sourceType, symbol, type] = args;
  return { sourceType, symbol, type };
}