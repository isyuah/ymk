import { createApp } from "vue";
import 'normalize.css'
import '@/assets/init.css'
import { createPinia } from 'pinia';
import App from "./App.vue";
const pinia = createPinia()
const app = createApp(App);
app.use(pinia)
import router from "./router";
import 'floating-vue/dist/style.css'
import FloatingVue from 'floating-vue'
import {useRuntimeDataStore} from "@/stores/modules/runtimeData";
import {useSourceStorage} from "@/stores/sourceStore";
import {useConfigStore} from "@/stores/modules/config";
import {sourceRegistry} from "@/sources/registry";

import NeteaseSource from '@/sources/impl/netease'
import BilibiliSource from '@/sources/impl/bilibili'
import LocalSource from '@/sources/impl/local'
import KugouSource from '@/sources/impl/kugou'

app.use(FloatingVue)
app.use(router)

const runtimeData = useRuntimeDataStore()
router.beforeEach((to, from) => {
  if (to.path === '/playlistDetail' && !runtimeData.currentPlaylist) return {path: '/playlist'};
  if (to.matched.length === 0) return {path: '/playlist'};
  if (to.path !== '/') runtimeData.nowTab = to.path.substring(1)
  return true
})

// initialize
await Promise.all([
  useConfigStore().init(),
  useSourceStorage().init(),
]);

// 注册内置Source
await sourceRegistry.register(LocalSource)
await sourceRegistry.register(NeteaseSource)
await sourceRegistry.register(BilibiliSource)
await sourceRegistry.register(KugouSource)
// 注册插件
const plugins = await window.ymkAPI.loadPlugins()
for (const plugin of plugins) {
  await sourceRegistry.register((await import( /* @vite-ignore */ plugin.url)).default)
}

app.mount("#app");
