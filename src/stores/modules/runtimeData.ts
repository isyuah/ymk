import {defineStore} from "pinia";
import {ref} from "vue";
import type {LoadedPlaylist} from "@/sources/playlist";

export const useRuntimeDataStore = defineStore('runtimeData', () => {
  const nowTab = ref('');
  const showFullPlay = ref(false)
  const currentPlaylist = ref<LoadedPlaylist | null>(null);
  return {
    nowTab,
    showFullPlay,
    currentPlaylist,
  }
})
