<template>
  <div class="changeCoverDialogContainer DEF-DIALOG-CONTENT">
    <div class="header">
      修改封面
    </div>
    <div class="content">
      <input
        v-model="coverUrl"
        type="text"
        class="coverInput"
        placeholder="输入封面 URL"
        @keyup.enter="confirm"
      >
    </div>
    <div class="footer">
      <button
        class="dialogBtn confirm"
        @click="confirm"
      >
        确认
      </button>
      <button
        class="dialogBtn cancel"
        @click="closeDialog"
      >
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { RuntimePlaylist } from '@yumuzk/plugin-api'
import { sourceRegistry } from '@/sources/registry'
import { showMessage } from '@/utils/message'

const props = defineProps<{
  closeDialog: () => void
  data: {
    playlist: RuntimePlaylist
    sourceType: string
    onConfirm?: (pic: string) => void
  }
}>()

const coverUrl = ref(props.data.playlist.document.pic || '')

async function confirm() {
  if (!coverUrl.value.trim()) return
  try {
    const source = sourceRegistry.sources.get(props.data.sourceType)
    const ability = source?.getAvailability('changePlaylistCover')
    if (ability?.available) {
      const entry = props.data.playlist.document.entries.find(e => e.kind === 'playlistRef')
      const ref = entry && entry.kind === 'playlistRef'
        ? entry.ref
        : props.data.playlist.metadata.origin
      await ability.invoke(ref, props.data.playlist, coverUrl.value.trim())
      props.data.onConfirm?.(coverUrl.value.trim())
      showMessage('修改成功')
      props.closeDialog()
    }
  } catch (e) {
    showMessage(`修改封面失败: ${(e as Error).message}`)
  }
}
</script>

<style scoped>
.coverInput {
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #fff;
  color: #333;
  font-size: 16px;
  outline: none;
  box-sizing: border-box;
}
.coverInput:focus {
  border-color: rgba(255, 255, 255, 0.4);
}
</style>
