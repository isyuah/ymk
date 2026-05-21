<template>
  <RouterView />
</template>

<script setup lang='ts'>
import { RouterView } from 'vue-router';
import {showMessage} from "@/utils/message";
import {refreshPlaylists} from "@/utils/Toolkit";
const {onShowMessage, onRefreshPlaylists} = window.ymkAPI;

onShowMessage((m: any) => showMessage(m))

onRefreshPlaylists(() => refreshPlaylists())


</script>

<style scoped>
:root {
  --ymk-el-color: #fff;
  --ymk-text-color: #fff;
  --ymk-text-shadow-color: #000;
  --ymk-progress-bg-color: #fff;
  --ymk-progress-fill-color: #fff;
  --ymk-progress-choose-fill-color: #fff;
  --ymk-container-bg-color: rgba(0,0,0,.2);
}
</style>