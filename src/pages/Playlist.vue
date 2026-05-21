<template>
  <div class="partContainer forbidSelect">
    <simplebar class="simplebar">
      <Transition
        name="uianim"
        appear
      >
        <div
          v-if="true"
          class="playlistControllers"
        >
          <button
            class="controllerButton import"
            @click="importPlaylist"
          >
            导入
          </button>
          <button
            class="controllerButton import"
            @click="refreshPlaylists()"
          >
            刷新
          </button>
          <button
            class="controllerButton import"
            @click="showPreviewDialog"
          >
            预览
          </button>
          <button
            class="controllerButton test"
            @click="testFunc"
          >
            测试
          </button>
          <button
            class="controllerButton test"
            @click="testFunc2"
          >
            测试2
          </button>
        </div>
      </Transition>
      <PlaylistView />
    </simplebar>
  </div>
</template>

<script setup lang='ts'>
import simplebar from "simplebar-vue";
import 'simplebar-vue/dist/simplebar.min.css'
import PreviewDialog from "@/components/Dialogs/PreviewDialog.vue";
import {showMessage} from "@/utils/message";
import {showDialog} from "@/utils/dialog";
import {refreshPlaylists} from "@/utils/Toolkit";
import {sourceRegistry} from "@/sources/registry";
import PlaylistView from "@/components/PlaylistView.vue";

const {showImportPlaylistDialog} = window.ymkAPI;
function importPlaylist() {
    showImportPlaylistDialog();
}

async function testFunc() {
}
async function testFunc2() {
  console.log(sourceRegistry.sources)
}
function showPreviewDialog() {
  showDialog(PreviewDialog)
}
</script>

<style scoped>
.partContainer {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
}
.partContainer .playlistControllers {
    padding: 10px 20px 0;
}

.controllerButton {
    cursor: pointer;
    font-family: "PingFang SC";
    font-size: 20px;
  background: rgba(255, 255, 255, .1);
  backdrop-filter: blur(12px) saturate(180%);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
    color: #fff;
    padding: 10px 15px;
    margin: 0 10px;
    transition: all .25s;
}

.controllerButton:hover {
  background: rgba(255, 255, 255, 0.2);
}

.simplebar {
  height: 100%;
}

.floatingButton {
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 1000;
  padding: 10px 20px;
  background-color: rgba(255, 255, 255, .15);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, .2);
  border-radius: 4px;
  font-family: PingFang SC;
  font-size: 16px;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
}

.floatingButton:hover {
  background-color: rgba(255, 255, 255, .25);
  border-color: rgba(255, 255, 255, .3);
}

.floatingButton:active {
  background-color: rgba(255, 255, 255, .2);
  border-color: rgba(255, 255, 255, .25);
}
</style>
