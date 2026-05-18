import axios, {type AxiosInstance} from "axios";
import type {LoaderLike, MusicSource, SourceContextLike} from "@/sources/musicSource";
import {useSourceStorage} from "@/stores/sourceStore";
import { Loader } from "@/utils/v2/loader";

export class SourceContext implements SourceContextLike {
  http: AxiosInstance;
  storage: StorageAPI;
  loader = Loader;
  constructor(src: MusicSource) {
    this.http = axios.create({})
    this.storage = new StorageAPI(src.id);
  }
}

class StorageAPI {
  private store = useSourceStorage();
  constructor(private id: string) {}

  get<T>(key: string): T | null {
    return this.store.getItem(this.id, key);
  }
  set<T>(key: string, value: T) {
    this.store.setItem(this.id, key, value);
  }
  has(key: string) {
    return this.store.hasItem(this.id, key);
  }
  delete(key: string) {
    this.store.removeItem(this.id, key);
  }
}