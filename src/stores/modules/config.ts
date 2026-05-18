import {defineStore} from "pinia";
import {ref, watch} from "vue";
import type {apiConfig, config} from "@/types/config";
import {usePlayerStore} from "@/stores/modules/player";
const {writeConfig, writeSpecificConfig, getConfig, getSpecificConfig} = window.ymkAPI;

export const useConfigStore = defineStore('config', () => {
  const isReady = ref(false);
  const api = ref({
    neteaseApi: <apiConfig>{
      enable: false,
      url: '',
    },
    qqApi: <apiConfig>{
      enable: false,
      url: '',
    },
  })
  const bg = ref("")
  const maskOpacity = ref(0)
  const colors = ref<Record<string, string>>({});
  const defaultPlaylist = ref('isyuah_converted.json');
  const minimizeToTray = ref(false);
  const player = usePlayerStore()
  function saveConfig() {
    writeConfig(JSON.stringify({
      config: <config>{
        api: api.value,
        bg: bg.value,
        volume: player.config.volume,
        mode: player.config.mode,
        maskOpacity: maskOpacity.value,
        langPreferences: player.config.langPreferences,
        defaultPlaylist: defaultPlaylist.value,
        minimizeToTray: minimizeToTray.value,
      },
    }))
  }
  function saveColors() {
    writeSpecificConfig('colors', JSON.stringify(colors.value))
  }

  const init = async () => {
    if (isReady.value) {
      console.warn("重复初始化 ConfigStore is ready");
      return;
    }

    try {
      const [configData, colorsData] = await Promise.all([
        getConfig(),
        getSpecificConfig('colors')
      ]);

      if (configData) {
        const jp = configData;
        console.log('$jsonConfig', jp);
        if (jp.config.api) {
          api.value = jp.config.api;
        }
        if (jp.config.bg) {
          bg.value = jp.config.bg;
        }
        if (jp.config.maskOpacity !== undefined) {
          maskOpacity.value = jp.config.maskOpacity;
        }
        if (jp.config.minimizeToTray !== undefined) {
          minimizeToTray.value = jp.config.minimizeToTray;
        }
        if (jp.config.mode) {
          player.config.mode = jp.config.mode;
        }
        if (jp.config.langPreferences) {
          player.config.langPreferences = jp.config.langPreferences;
        }
        if (jp.config.volume) {
          player.config.volume = jp.config.volume;
        }
        if (jp.config.defaultPlaylist) {
          defaultPlaylist.value = jp.config.defaultPlaylist;
        }
      }

      if (colorsData) {
        colors.value = colorsData;
      }
    } catch (error) {
      console.error('Failed to initialize config:', error);
    } finally {
      isReady.value = true;
    }
  }

  watch([
    () => player.config.mode,
    () => player.config.langPreferences,
    () => player.config.volume,
    api,
    bg,
    maskOpacity,
    defaultPlaylist,
    minimizeToTray,
  ], () => {
    if (!isReady.value) return;
    saveConfig();
  }, {deep: true, immediate: false})

  watch(colors, () => {
    if (!isReady.value) return;
    saveColors();
  }, {deep: true})

  return {
    api,
    bg,
    colors,
    maskOpacity,
    defaultPlaylist,
    minimizeToTray,
    isReady,
    saveConfig,
    saveColors,
    init,
  }
})