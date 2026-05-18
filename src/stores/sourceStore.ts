import {defineStore} from "pinia";
import {ref, toRaw, watch} from "vue";

export const useSourceStorage = defineStore('source-storage', () => {
  const isReady = ref(false);
  const data = ref<Record<string, Record<string, any>>>({});
  const getSourceData = (sourceId: string) => {
    if (!data.value[sourceId]) {
      data.value[sourceId] = {};
    }
    return data.value[sourceId];
  }
  const setItem = (sourceId: string, key: string, value: any) => {
    const sourceData = getSourceData(sourceId);
    sourceData[key] = value;
  }
  const getItem = (sourceId: string, key: string) => {
    return data.value[sourceId]?.[key] ?? null;
  }
  const hasItem = (sourceId: string, key: string): boolean => {
    const sourceData = getSourceData(sourceId);
    return sourceData[key] != null;
  }
  const removeItem = (sourceId: string, key: string) => {
    if (data.value[sourceId]) {
      delete data.value[sourceId][key];
    }
  }

  const init = async () => {
    if (!isReady.value) {
      data.value = (await window.ymkAPI.readSourceStorage()) ?? {};
      isReady.value = true;
    } else {
      console.warn("重复初始化 SourceStore is ready");
    }
  }

  watch(data, (nv) => {
    if (!isReady.value) return;
    console.log('@sourceStorage', nv);
    window.ymkAPI.saveSourceStorage(structuredClone(toRaw(nv)));
  }, {deep: true})

  return {
    data,
    getSourceData,
    getItem,
    setItem,
    hasItem,
    removeItem,
    init,
  }
})