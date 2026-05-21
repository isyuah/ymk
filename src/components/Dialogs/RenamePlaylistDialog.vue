<template>
  <div class="renameDialogContainer DEF-DIALOG-CONTENT">
    <div class="header">
      重命名歌单
    </div>
    <div class="content">
      <input
        v-model="newName"
        type="text"
        class="renameInput"
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
import { ToSourceEntityRef } from '@/sources/song'

const props = defineProps<{
  closeDialog: () => void
  data: {
    playlist: RuntimePlaylist
    sourceType: string
    onConfirm?: (name: string) => void
  }
}>()

const newName = ref(props.data.playlist.document.title)

async function confirm() {
  if (!newName.value.trim()) return
  try {
    const source = sourceRegistry.sources.get(props.data.sourceType)
    const ability = source?.getAvailability('renamePlaylist')
    if (ability?.available) {
      const ref = getRef()
      await ability.invoke(ref, props.data.playlist, newName.value.trim())
      props.data.onConfirm?.(newName.value.trim())
      showMessage('重命名成功')
      props.closeDialog()
    }
  } catch (e) {
    showMessage(`重命名失败: ${(e as Error).message}`)
  }
}

function getRef() {
  const entries = props.data.playlist.document.entries
  const refEntry = entries.find(e => e.kind === 'playlistRef')
  if (refEntry && refEntry.kind === 'playlistRef') return refEntry.ref
  return props.data.playlist.metadata.origin
}
</script>

<style scoped>
.renameInput {
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
.renameInput:focus {
  border-color: rgba(255, 255, 255, 0.4);
}
</style>
