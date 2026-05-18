import {defineStore} from "pinia";
import {computed, ref} from "vue";

interface LoadingItem {
  text: string;
  id: number;
}

export const useLoadingStore = defineStore('loading', () => {
  const loadingStack = ref<LoadingItem[]>([]);
  let idCounter = 0;
  const isLoading = computed(() => loadingStack.value.length > 0);
  const start = function (text: string = "加载中") {
    const id = idCounter++;
    loadingStack.value.push({text, id})
    return id;
  }
  const finish = function (id: number) {
    loadingStack.value = loadingStack.value.filter((item) => item.id !== id);
  }

  return {
    isLoading,
    loadingStack,
    finish,
    start,
  }
})