import {defineStore} from "pinia";
import {ref, shallowRef} from "vue";
import type {CurrentSong} from "@/sources/song";
import type {SongBase} from "@/sources/musicSource";
export const usePlayerStore = defineStore('player', () => {
  const config = ref({
    curTime: '',
    lang: 'origin',
    curTimeNum: 0,
    durationTime: '',
    duration: 0,
    status: 'pause',
    mode: 'list',
    activeLrc: -1,
    show_songface: false,
    volume: 1,
    progress: 0,
    highlightLrcIndex: -1,
    indexInPlaylist: -1,
    langPreferences: ["mixed", "origin", "translation"]
  })
  const playlist = shallowRef(<SongBase[]>[])
  const currentSong = ref<CurrentSong | null>(null);
  return {
    config,
    playlist,
    currentSong
  }
})
