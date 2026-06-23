import type {SongBase} from "@/sources/musicSource";

interface IEmitter {
  playSongV2: [song: SongBase, justTry?: boolean, noActionWhenNotPlayable?: boolean, playlistIndex?: number];
  [key: string]: any[];
  [key: symbol]: any[];
}

class EventEmitter {
  private listeners = new Map<keyof IEmitter, Array<(...args: any[]) => void>>();
  on<K extends keyof IEmitter>(eventName: K, listener: (...args: IEmitter[K]) => void) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);
  }

  emit<K extends keyof IEmitter>(eventName: K, ...args: IEmitter[K]): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      for (const listener of listeners) {
        try {
          listener(...args);
        } catch (e) {
          console.warn(`[emitter] ${listener} failed to emit listener: ${listener}\n Error: ${e instanceof Error ? e.stack : e}`);
        }
      }
    }
  }

  off<K extends keyof IEmitter>(eventName: K, listener: (...args: IEmitter[K]) => void): void {
    const listeners = this.listeners.get(eventName);
    if (listeners) {
      this.listeners.set(eventName, listeners.filter(l => l !== listener));
    }
  }
}

export default new EventEmitter();
