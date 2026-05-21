<script setup lang="ts">
import { ref, onMounted } from "vue";
import type { MusicSource, SourceAuthAny, AuthUserInfo, AuthMethodMap } from "@/sources/musicSource";
import QRCodeLogin from "./QRCodeLogin.vue";
import CookieLogin from "./CookieLogin.vue";

const props = defineProps<{
  source: MusicSource;
}>();

const auth = props.source.auth as SourceAuthAny;

const logined = ref(false);
const userInfo = ref<AuthUserInfo | null>(null);
const selectedMethod = ref<keyof AuthMethodMap | null>(null);

async function checkLoginState() {
  const info = await auth.getUserInfo();
  if (info) {
    userInfo.value = info;
    logined.value = true;
  }
}

async function onLoginSuccess() {
  await checkLoginState();
  selectedMethod.value = null;
}

async function logout() {
  await auth.logout();
  userInfo.value = null;
  logined.value = false;
}

onMounted(checkLoginState);
</script>

<template>
  <div class="userContainer">
    <div class="title">
      {{ source.name }}
    </div>

    <!-- 已登录 -->
    <div
      v-if="logined && userInfo"
      class="loginedContainer"
    >
      <div class="userInfo">
        <img
          referrerpolicy="no-referrer"
          :src="userInfo.avatar"
          class="avatar"
          :alt="userInfo.nickname"
        >
        <div class="user">
          <div class="nickname">
            {{ userInfo.nickname }}
          </div>
          <div class="signature">
            {{ userInfo.signature || '暂无简介' }}
          </div>
        </div>
      </div>
      <button
        class="userCenterControlBtn"
        @click="checkLoginState"
      >
        刷新状态
      </button>
      <button
        class="userCenterControlBtn"
        @click="logout"
      >
        退出登录
      </button>
    </div>

    <!-- 未登录 -->
    <template v-else>
      <!-- 未选择方式 -->
      <div
        v-if="!selectedMethod"
        class="tab unloginTab"
      >
        <button
          v-for="method in auth.methods"
          :key="method.type"
          class="loginBtn"
          @click="selectedMethod = method.type"
        >
          {{ method.label || method.type }}
        </button>
      </div>

      <!-- 已选择方式 -->
      <template v-else>
        <QRCodeLogin
          v-if="selectedMethod === 'qrcode'"
          :auth="auth"
          @success="onLoginSuccess"
        />
        <CookieLogin
          v-if="selectedMethod === 'cookie'"
          :auth="auth"
          @success="onLoginSuccess"
        />
        <div class="backRow">
          <button
            class="loginBtn"
            @click="selectedMethod = null"
          >
            返回
          </button>
        </div>
      </template>
    </template>
  </div>
</template>

<style scoped>
.loginedContainer {
  width: 100%;
}
.loginedContainer .userInfo {
  color: #000;
  display: grid;
  grid-template-columns: 128px 1fr;
  grid-template-rows: 128px 1fr;
  grid-column-gap: 40px;
}
.loginedContainer .userInfo .avatar {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 50%;
}
.loginedContainer .userInfo .nickname {
  margin-top: 10px;
  font-family: SourceSansCNM;
  font-size: 28px;
}
.loginedContainer .userInfo .signature {
  margin-left: 20px;
  margin-top: 15px;
  font-family: SourceSansCNM;
  font-size: 16px;
}
.userCenterControlBtn {
  cursor: pointer;
  margin-top: 20px;
  margin-right: 20px;
  padding: 7px 14px;
  border: none;
  color: var(--ymk-text-color);
  background-color: var(--ymk-text-shadow-color);
  transition: all .25s;
}
.backRow {
  display: flex;
  justify-content: center;
  margin-top: 12px;
}
</style>
