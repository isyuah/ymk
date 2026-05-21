import type {MusicSource} from "@/sources/musicSource";
import type {ParsedAbility, SourceCapabilityMap} from "@yumuzk/plugin-api";
import {SourceContext} from "@/sources/context";

class SourceRegistry {
  public sources = new Map<string, MusicSource>();
  async register(source: MusicSource) {
    if (this.sources.has(source.id)) {
      console.warn(`[SourceRegistry] 源 ID 重复: ${source.id}`);
      return;
    }

    const ctx = new SourceContext(source);
    source.$injectContext(ctx);
    await source.initialize?.();
    this.sources.set(source.id, source);
    console.log(`[SourceRegistry] 加载源：${source.name} (${source.id})`)
  }

  listByCapability(key: keyof SourceCapabilityMap) {
    return [...this.sources.values()].filter(src => src.getAvailability(key).available);
  }
  getSourceAbility<T extends keyof SourceCapabilityMap>(source: string, key: T): ParsedAbility<SourceCapabilityMap[T] extends import('@yumuzk/plugin-api').SourceAbility<infer F extends (...args: any) => any> ? F : never> | null {
    if (!this.sources.has(source)) {
      return null;
    }
    return this.sources.get(source)?.getAvailability(key) ?? null;
  }

  filter(fn: (source: MusicSource) => boolean) {
    return [...this.sources.values()].filter(fn);
  }
}

export const sourceRegistry = new SourceRegistry()