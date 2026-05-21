<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import type { SourceAuthAny } from "@/sources/musicSource";

const props = defineProps<{
  auth: SourceAuthAny;
}>();

const emit = defineEmits<{
  success: [];
}>();

const qrUrl = ref('');
const status = ref('正在获取二维码...');
let key = '';
let timer: ReturnType<typeof setInterval> | null = null;

async function fetchQR() {
  if (!props.auth.getQRCode) return;
  const result = await props.auth.getQRCode();
  qrUrl.value = result.url;
  key = result.key;
  status.value = '等待扫码';
  startPolling();
}

function startPolling() {
  stopPolling();
  timer = setInterval(poll, 3000);
}

async function poll() {
  if (!props.auth.checkQRStatus) return;
  const result = await props.auth.checkQRStatus(key);
  switch (result.status) {
    case 'waiting':
      status.value = '等待扫码';
      break;
    case 'scanned':
      status.value = '已扫码，等待确认';
      break;
    case 'confirmed':
      status.value = '登录成功';
      stopPolling();
      emit('success');
      break;
    case 'expired':
      status.value = '二维码已过期，正在刷新...';
      stopPolling();
      fetchQR();
      break;
  }
}

function stopPolling() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

onMounted(fetchQR);
onUnmounted(stopPolling);
</script>

<template>
  <div class="qrcodeLogin">
    <div class="text">
      请扫码登录
    </div>
    <img
      v-if="qrUrl"
      :src="qrUrl"
      referrerpolicy="no-referrer"
      alt="QR Code"
    >
    <div class="text">
      {{ status }}
    </div>
  </div>
</template>

<style scoped>
.qrcodeLogin {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  color: #000;
}
.qrcodeLogin .text {
  margin: 8px 0;
}
</style>
