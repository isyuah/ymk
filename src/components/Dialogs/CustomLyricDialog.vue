<template>
  <div class="customLyricDialogContainer DEF-DIALOG-CONTENT">
    <div class="header">
      自定义歌词来源
    </div>
    <div class="content">
      <div class="field">
        <label>源</label>
        <DSelect
          v-model="sourceType"
          :options="lyricSourceOptions"
        />
      </div>
      <div class="field">
        <label>标识</label>
        <input
          v-model="symbol"
          type="text"
          class="fieldInput"
          placeholder="歌曲 ID / Hash"
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
        class="dialogBtn clear"
        @click="clear"
      >
        清除自定义
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
import { ref, computed } from 'vue'
import type { SongBase, RuntimePlaylist, SourceEntityRef } from '@yumuzk/plugin-api'
import { SourceEntityType } from '@yumuzk/plugin-api'
import { sourceRegistry } from '@/sources/registry'
import { showMessage } from '@/utils/message'
import DSelect from '@/components/DSelect.vue'

const props = defineProps<{
  closeDialog: () => void
  data: {
    song: SongBase
    playlist: RuntimePlaylist
    sourceType: string
    onConfirm?: (ref: SourceEntityRef | undefined) => void
  }
}>()

const lyricSources = computed(() => sourceRegistry.filter(s => s.getAvailability('resolveLyric').available))
const lyricSourceOptions = computed(() => lyricSources.value.map(s => ({ value: s.id, label: s.name })))
const sourceType = ref(props.data.song.lyricOverride?.sourceType ?? props.data.song.sourceType)
const symbol = ref(props.data.song.lyricOverride?.symbol ?? props.data.song.symbol)

async function confirm() {
  if (!symbol.value.trim()) return
  try {
    const source = sourceRegistry.sources.get(props.data.sourceType)
    const ability = source?.getAvailability('customizeLyric')
    if (ability?.available) {
      const ref: SourceEntityRef = {
        sourceType: sourceType.value,
        symbol: symbol.value.trim(),
        type: SourceEntityType.Song,
      }
      await ability.invoke(props.data.song, props.data.playlist, ref)
      props.data.onConfirm?.(ref)
      showMessage('自定义歌词设置成功')
      props.closeDialog()
    }
  } catch (e) {
    showMessage(`设置失败: ${(e as Error).message}`)
  }
}

async function clear() {
  try {
    const source = sourceRegistry.sources.get(props.data.sourceType)
    const ability = source?.getAvailability('customizeLyric')
    if (ability?.available) {
      await ability.invoke(props.data.song, props.data.playlist, undefined as any)
      props.data.onConfirm?.(undefined)
      showMessage('已清除自定义歌词')
      props.closeDialog()
    }
  } catch (e) {
    showMessage(`清除失败: ${(e as Error).message}`)
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
