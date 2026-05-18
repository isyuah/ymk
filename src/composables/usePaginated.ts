import {ref, watch, type Ref} from "vue";
import type {PaginatedResult} from "@/sources/musicSource";

interface UsePaginatedOptions {
  pageSize?: number;
  cache?: boolean;
}

export function usePaginated<T>(
  fetcher: (page: number, pageSize: number) => Promise<PaginatedResult<T>>,
  options?: UsePaginatedOptions,
) {
  const pageSize = options?.pageSize ?? 30;
  const page = ref(1);
  const data = ref<T[]>([]) as Ref<T[]>;
  const total = ref(0);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const cacheMap = options?.cache ? new Map<number, PaginatedResult<T>>() : null;

  async function execute(p = page.value) {
    if (cacheMap?.has(p)) {
      const cached = cacheMap.get(p)!;
      data.value = cached.data;
      total.value = cached.total;
      return;
    }

    loading.value = true;
    error.value = null;
    try {
      const result = await fetcher(p, pageSize);
      data.value = result.data;
      total.value = result.total;
      cacheMap?.set(p, result);
    } catch (e) {
      error.value = e as Error;
    } finally {
      loading.value = false;
    }
  }

  watch(page, (p) => execute(p));

  function reset() {
    data.value = [];
    total.value = 0;
    page.value = 1;
    error.value = null;
    cacheMap?.clear();
  }

  return {data, total, page, loading, error, execute, reset};
}
