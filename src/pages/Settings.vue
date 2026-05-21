<script setup lang="ts">
import simplebar from "simplebar-vue";
import 'simplebar-vue/dist/simplebar.min.css'
import {ref} from "vue";
import PickColors from 'vue-pick-colors'
import {showMessage} from "@/utils/message";
import {useConfigStore} from "@/stores/modules/config";
const config = useConfigStore()
console.log(config, config.minimizeToTray)
let apiConfig = ref({
  neteaseUrl: config.api.neteaseApi.url,
  qqUrl: config.api.qqApi.url,
})
let tmpConfig = ref({
  bg: config.bg,
  maskOpacity: config.maskOpacity || 0,
  defaultPlaylist: config.defaultPlaylist,
  minimizeToTray: config.minimizeToTray || false,
})
function saveApiConfig () {
  config.$patch({
    api: {
      neteaseApi: {
        url: apiConfig.value.neteaseUrl
      },
      qqApi: {
        url: apiConfig.value.qqUrl
      }
    }
  })
  showMessage('保存成功')
}
function saveBgConfig() {
  config.$patch(tmpConfig.value);
  showMessage('保存成功')
}
function saveColorsConfig () {
  config.saveColors();
  showMessage('保存成功')
}
function saveOtherConfig () {
  config.$patch({
    minimizeToTray: tmpConfig.value.minimizeToTray
  })
  showMessage('保存成功')
}
</script>

<template>
  <div class="SettingsContainer">
    <simplebar class="simplebar">
      <div class="SettingsPane">
        <div class="title">
          API
        </div>
        <div class="content">
          <div class="Input">
            <div class="label">
              网易云
            </div>
            <input
              v-model="apiConfig.neteaseUrl"
              class="input"
              type="text"
            >
          </div>
          <div class="Input">
            <div class="label">
              QQ
            </div>
            <input
              v-model="apiConfig.qqUrl"
              class="input"
              type="text"
            >
          </div>
          <div class="controlBtns">
            <div
              class="controlBtn"
              @click="saveApiConfig"
            >
              保存
            </div>
          </div>
        </div>
      </div>
      <div class="SettingsPane">
        <div class="title">
          外观
        </div>
        <div class="content">
          <div class="Input">
            <div class="label">
              背景
            </div>
            <input
              v-model="tmpConfig.bg"
              class="input"
              type="text"
            >
          </div>
          <div class="Input">
            <div class="label">
              透明度
            </div>
            <input
              v-model="tmpConfig.maskOpacity"
              class="input"
              type="text"
            >
          </div>
          <div class="Input">
            <div class="label">
              默认歌单
            </div>
            <input
              v-model="tmpConfig.defaultPlaylist"
              placeholder="文件名(like按钮保存的位置)"
              class="input"
              type="text"
            >
          </div>
          <div class="controlBtns">
            <div
              class="controlBtn"
              @click="saveBgConfig"
            >
              保存
            </div>
          </div>
        </div>
      </div>
      <div class="SettingsPane">
        <div class="title">
          颜色
        </div>
        <div class="content">
          <div class="colorsSetter">
            <div
              v-for="(_, k) in config.colors"
              :key="k"
              class="colorInput"
            >
              <div class="label">
                {{ k }}
              </div>
              <PickColors
                v-model:value="config.colors[k]"
                style="vertical-align: top"
                show-alpha
                format="rgb"
                :format-options="['rgb', 'hex']"
              />
            </div>
          </div>
          <div class="controlBtns">
            <div
              class="controlBtn"
              @click="saveColorsConfig"
            >
              保存
            </div>
          </div>
        </div>
      </div>
      <div class="SettingsPane forbidSelect">
        <div class="title">
          其他
        </div>
        <div class="content">
          <div class="Checkbox">
            <input
              id="minimizeToTray"
              v-model="tmpConfig.minimizeToTray"
              class="input"
              type="checkbox"
            >
            <label
              for="minimizeToTray"
              class="label"
            >关闭窗口后最小化到托盘</label>
            <label
              for="minimizeToTray"
              class="checkmark"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M5 12l5 5L20 7" />
              </svg>
            </label>
          </div>
          <div class="controlBtns">
            <div
              class="controlBtn"
              @click="saveOtherConfig"
            >
              保存
            </div>
          </div>
        </div>
      </div>
    </simplebar>
  </div>
</template>

<style scoped>
.simplebar {
  width: 100%;
  height: 100%;
}
.SettingsContainer {
  width: 100%;
  height: 100%;
  padding: 10px 20px;
}
.SettingsPane {
  margin: 10px;
}
.SettingsPane > .title {
  font-family: SourceSansCNM;
  font-size: 28px;
  color: var(--ymk-text-color);
}
.SettingsPane > .content {
  padding-top: 10px;
  padding-left: 20px;
  color: var(--ymk-el-color);
}
.Input {
  margin: 10px 0;
  display: flex;
}
.Input .label {
  width: 70px;
  margin-right: 10px;
}
.Checkbox {
  margin: 10px 0;
  display: flex;
  align-items: center;
  gap: 5px;
}
.Checkbox input {
  display: none;
}
.Checkbox .checkmark {
  height: 20px;
  width: 20px;
  background-color: rgba(255,255,255,.1);
  border: 1px solid #18191C;
  border-radius: 4px;
  position: relative;
}
.Checkbox .checkmark svg {
  display: none;
}
.Checkbox input:checked ~ .checkmark svg {
  display: block;
}
.colorInput .label {
  width: auto;
}
.Input .label, .Input .input {
  display: inline-block;
  height: 35px;
  line-height: 35px;
  font-size: 16px;
  font-family: SourceSansCNM;
  color: var(--ymk-text-color);
}
.colorInput .label, .colorInput .input {
  display: inline-block;
  height: 35px;
  line-height: 35px;
  font-size: 16px;
  font-family: SourceSansCNM;
}
input {
  background-color: rgba(0,0,0,.3);
}
.Input .input {
  flex: 1;
  border: 1px solid #18191C;
  padding:0 10px;
}
.controlBtn {
  cursor: pointer;
  background-color: rgba(0,0,0,0.8);
  border-radius: 16px;
  display: inline-block;
  color: #fff;
  padding: 0 15px;
  height: 35px;
  line-height: 35px;
}
.colorsSetter {
  display: grid;
  grid-gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}
</style>