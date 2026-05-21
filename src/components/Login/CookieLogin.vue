<script setup lang="ts">
import { ref } from "vue";
import type { SourceAuthAny } from "@/sources/musicSource";

const props = defineProps<{
  auth: SourceAuthAny;
}>();

const emit = defineEmits<{
  success: [];
}>();

const input = ref('');
const error = ref('');

async function submit() {
  if (!props.auth.loginWithCookie || !input.value.trim()) return;
  error.value = '';
  const ok = await props.auth.loginWithCookie(input.value.trim());
  if (ok) {
    emit('success');
  } else {
    error.value = '登录失败，请检查 Cookie 是否有效';
  }
}
</script>

<template>
  <div class="cookieLogin">
    <div class="text">
      请输入 Cookie
    </div>
    <textarea
      v-model="input"
      placeholder="粘贴 Cookie..."
      rows="4"
    />
    <div
      v-if="error"
      class="error"
    >
      {{ error }}
    </div>
    <button
      class="loginBtn"
      @click="submit"
    >
      确认
    </button>
  </div>
</template>

<style scoped>
.cookieLogin {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  color: #000;
}
.cookieLogin .text {
  margin: 8px 0;
}
.cookieLogin textarea {
  width: 80%;
  max-width: 400px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 8px;
  resize: vertical;
  font-size: 14px;
  margin-bottom: 8px;
}
.cookieLogin .error {
  color: #e53935;
  margin-top: 8px;
  font-size: 14px;
}
</style>
