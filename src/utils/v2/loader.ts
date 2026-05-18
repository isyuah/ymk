import {useLoadingStore} from "@/stores/modules/loading";

export async function trackProgressSettled(promises: Promise<any>[], onProgress?: (done: number) => void) {
  let done = 0;
  for (const p of promises) {
    p.finally(() => {
      done++;
      onProgress?.(done);
    });
  }
  return Promise.allSettled(promises);
}

export class Loader {
  private readonly id: number;
  private readonly store;
  constructor(text?: string) {
    this.store = useLoadingStore();
    this.id = this.store.start(text);
  }
  setText(text: string): void {
    const item = this.store.loadingStack.find(i => i.id === this.id);
    if (item) item.text = text;
  }
  [Symbol.dispose](): void {
    this.store.finish(this.id);
  }
}