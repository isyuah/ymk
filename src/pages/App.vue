<template>
  <div class="colorSetter" :style="colorVars" @drop.prevent="dropEvent" @dragover.prevent>
    <div v-if="backgroundType" class="backgroundFrame forbidSelect">
      <div class="mask" :style="`background-color: rgba(0,0,0,${config.maskOpacity});`"></div>
      <img :src="config.bg" v-if="backgroundType === 'img'">
      <video ref="videoBg" v-if="backgroundType === 'video'" @pause="videoBg?.play()" autoplay muted loop class="object-cover wh100" :src="config.bg"></video>
    </div>
    <div class="container">
      <div style="-webkit-app-region: drag" class="header forbidSelect noPointerEvents">
        <Transition name="fade">
          <div v-show="!runtimeData.showFullPlay" class="title">Yumuzk</div>
        </Transition>
        <Transition appear name="fade">
          <div style="-webkit-app-region: no-drag;" v-show="!runtimeData.showFullPlay" class="tabs allPointerEvents">
            <RouterLink to="/playlist" :class="{tab: true, active: runtimeData.nowTab === 'playlist'}">首页</RouterLink>
<!--            <RouterLink to="/recommendedPlaylists" :class="{tab: true, active: runtimeData.nowTab === 'recommendedPlaylists'}">推荐</RouterLink>-->
            <RouterLink to="/playlistDetail" v-if="runtimeData.currentPlaylist" :class="{tab: true, active: runtimeData.nowTab === 'playlistDetail'}">{{ detailTabLabel }}</RouterLink>
            <RouterLink to="/search" :class="{tab: true, active: runtimeData.nowTab === 'search'}">搜索</RouterLink>
            <RouterLink to="/userCenter" :class="{tab: true, active: runtimeData.nowTab === 'userCenter'}">
              <div class="text">用户</div>
<!--              <img v-if="user.neteaseUser.avatarUrl" style="border-radius: 50%;margin-left: 4px;margin-top:6px; height: 28px;" :src="user.neteaseUser.avatarUrl" alt="">-->
            </RouterLink>
            <RouterLink to="/settings" :class="{tab: true, active: runtimeData.nowTab === 'Settings'}">设置</RouterLink>
          </div>
        </Transition>
        <div style="-webkit-app-region: no-drag;" class="controlbtn noPointerEvents">
          <button @click="minimize()" class="btn allPointerEvents minimize">-</button>
          <button @click="exit(1)" class="btn allPointerEvents close">×</button>
        </div>
      </div>
      <div class="content">
        <router-view v-slot="{ Component, route }">
          <Transition name="fade">
            <Loading v-if="loadingStore.isLoading" />
          </Transition>
          <div v-show="!runtimeData.showFullPlay" class="route-content">
            <transition name="uianim">
              <keep-alive :exclude="['UserCenter', 'PlaylistDetail', 'Settings']">
                <Suspense>
                  <component :is="Component" :key="route.fullPath" />
                  <template #fallback>
                    <Loading />
                  </template>
                </Suspense>
              </keep-alive>
            </transition>
          </div>
        </router-view>
      </div>
      <Playbar></Playbar>
    </div>
    <Transition name="uianim">
      <FullPlay v-show="runtimeData.showFullPlay"></FullPlay>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import '@/assets/anim.css'
import { watch, computed, useTemplateRef } from 'vue';
import FullPlay from '@/pages/FullPlay.vue'
import Playbar from '@/pages/Playbar.vue'
import emitter from '@/emitter';
const {exit, minimize} = window.ymkAPI
const player = usePlayerStore();
const videoBg = useTemplateRef('videoBg')
const config = useConfigStore();
const colorVars = computed(() => {
  return Object.entries(config.colors).reduce((acc, [key, value]) => {
    acc[`--ymk-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`] = value;
    return acc;
  }, {} as Record<string, string>);
});
const backgroundType = computed(() => {
  if (!config.bg) return 'img'
  if (config.bg.endsWith(".mp4")) return "video"
  else if (config.bg.endsWith(".png") || config.bg.endsWith(".jpg")) return "img"
  else return ""
})

if ("mediaSession" in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: "",
    artist: ""
  });
  navigator.mediaSession.setActionHandler("play", () => player.config.status = 'play');
  navigator.mediaSession.setActionHandler("pause", () => player.config.status = 'pause');
  navigator.mediaSession.setActionHandler("seekbackward", (e) => console.log('$seekB', e));
  navigator.mediaSession.setActionHandler("seekforward", (e) => console.log('$seekF', e));
  navigator.mediaSession.setActionHandler("previoustrack", () => emitter.emit('playPrevSong'));
  navigator.mediaSession.setActionHandler("nexttrack", () => emitter.emit('playNextSong'))
}
const runtimeData = useRuntimeDataStore()
const loadingStore = useLoadingStore()

const detailTabLabel = computed(() => {
  const mode = (runtimeData.currentPlaylist as any)?.extra?.displayMode;
  if (mode === 'album') return '专辑';
  if (mode === 'artist') return '歌手';
  return '歌单';
});

import {usePlayerStore} from "@/stores/modules/player";
import {useConfigStore} from "@/stores/modules/config";
import {useRuntimeDataStore} from "@/stores/modules/runtimeData";
import router from "@/router";
import {refreshPlaylists} from "@/utils/Toolkit";
import Loading from "@/pages/Loading.vue";
import {useLoadingStore} from "@/stores/modules/loading";

refreshPlaylists();

function dropEvent(e: DragEvent) {
  console.log(e)
}
</script>

<style>
body {
    background: rgb(255,255,255);
}
</style>

<style scoped>
.colorSetter {
  text-shadow: var(--ymk-text-shadow-color);
  overflow: hidden;
}
.backgroundFrame {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: -3;
}
.backgroundFrame .mask {
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  position: absolute;
}
.backgroundFrame video {
  object-fit: cover;
  width: 100%;
  height: 100%;
}

.container {
  position: relative;
  display: grid;
  grid-template-rows: 64px 1fr 64px;
  flex-direction: column;
  font-family: "HarmonyOS Sans";
  /* border-radius: 4px; */
  width: 100vw;
  height: 100vh;
}
.header {
  position: relative;
  display: flex;
  align-items: center;
  height: 64px;
  /* border-bottom: 1px solid #e2e3e5; */
}
.header .title {
  cursor: pointer;
  font-family: NovecentoWide;
  font-size: 22px;
  margin-left: 24px;
  line-height: 32px;
  color: var(--ymk-el-color);
  width: 150px;
}
.header .controlbtn {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  font-size: 20px;
  z-index: 100;
}
.header .controlbtn .btn {
  color: var(--ymk-el-color);
  width: 32px;
  height: 32px;
  line-height: 1;
  border: none;
  background-color: transparent;
  transition: background-color .2s;
}
.header .controlbtn .btn:hover {
  background-color: rgba(0,0,0,.2);
}
.content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}
.route-content {
  width: 100%;
  height: 100%;
}
.header .tabs {
    display: flex;
}
.header .tab {
  font-family: SourceSansCNM;
  /* font-weight: bold; */
  display: flex;
  font-size: 18px;
  margin: 0 8px;
  padding: 5px 0;
  height: 48px;
  line-height: 40px;
  transition: all .2s;
  color: var(--ymk-text-color);
}
.header .tab img {
  display: inline-block;
}
.header .tab.active {
    border-bottom: 4px solid var(--ymk-el-color);
}
</style>