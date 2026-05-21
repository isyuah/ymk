<template>
  <div class="editSongDialogContainer DEF-DIALOG-CONTENT">
    <div class="header">
      编辑歌曲信息
    </div>
    <div class="content">
      <div class="field">
        <label>标题</label>
        <input
          v-model="title"
          type="text"
          class="fieldInput"
          @keyup.enter="confirm"
        >
      </div>
      <div class="field">
        <label>歌手</label>
        <input
          v-model="singer"
          type="text"
          class="fieldInput"
          @keyup.enter="confirm"
        >
      </div>
      <div class="field">
        <label>封面</label>
        <input
          v-model="pic"
          type="text"
          class="fieldInput"
          @keyup.enter="confirm"
        >
      </div>
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
import type { SongBase, RuntimePlaylist } from '@yumuzk/plugin-api'
import { sourceRegistry } from '@/sources/registry'
import { showMessage } from '@/utils/message'

const props = defineProps<{
  closeDialog: () => void
  data: {
    song: SongBase
    playlist: RuntimePlaylist
    sourceType: string
    onConfirm?: (info: { title: string; singer: string; pic: string }) => void
  }
}>()

const title = ref(props.data.song.title || '')
const singer = ref(props.data.song.singer || '')
const pic = ref(props.data.song.pic || '')

async function confirm() {
  try {
    const source = sourceRegistry.sources.get(props.data.sourceType)
    const ability = source?.getAvailability('editSongInfo')
    if (ability?.available) {
      const info = {
        title: title.value,
        singer: singer.value,
        pic: pic.value,
      }
      await ability.invoke(props.data.song, props.data.playlist, info)
      showMessage('修改成功')
      props.data.onConfirm?.(info)
      props.closeDialog()
    }
  } catch (e) {
    showMessage(`修改失败: ${(e as Error).message}`)
  }
}
</script>

<style scoped>
.field {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  gap: 8px;
}
.field label {
  min-width: 40px;
  color: var(--ymk-text-color);
  font-size: 14px;
}
.fieldInput {
  flex: 1;
  padding: 6px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: #fff;
  color: #333;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.fieldInput:focus {
  border-color: rgba(255, 255, 255, 0.4);
}
</style>
