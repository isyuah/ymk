<template>
  <div class="addToPlaylistDialog DEF-DIALOG-CONTENT">
    <div class="header">添加到歌单</div>
    <div class="content">
      <div v-if="targets.length === 0" class="empty">没有可用的歌单</div>
      <div
        v-for="(item, i) in targets"
        :key="i"
        class="playlistItem"
        @click="addTo(item)"
      >
        <img v-if="item.pic" :src="item.pic" class="itemPic" />
        <div class="itemInfo">
          <div class="itemTitle">{{ item.title }}</div>
          <div class="itemSource">{{ item.sourceName }}</div>
        </div>
      </div>
    </div>
    <div class="footer">
      <button @click="closeDialog" class="dialogBtn cancel">取消</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { SourceEntityType, type SongBase, type RuntimePlaylist, type SourceEntityRef } from '@yumuzk/plugin-api'
import { sourceRegistry } from '@/sources/registry'
import { showMessage } from '@/utils/message'
import emitter from '@/emitter'

const props = defineProps<{
  closeDialog: () => void
  data: {
    song: SongBase
  }
}>()

type PlaylistTarget = {
  sourceId: string
  sourceName: string
  title: string
  pic: string
  ref: SourceEntityRef
}

const targets = ref<PlaylistTarget[]>([])

onMounted(async () => {
  const sources = sourceRegistry.listByCapability('appendToPlaylist')
  for (const src of sources) {
    const plAbility = src.getAvailability('getMyPlaylists')
    if (!plAbility.available) continue
    try {
      const groups = await plAbility.invoke!()
      for (const group of groups) {
        for (const pl of group.playlists) {
          let ref: SourceEntityRef | undefined
          const refEntry = pl.document.entries.find(e => e.kind === 'playlistRef')
          if (refEntry && refEntry.kind === 'playlistRef') {
            ref = refEntry.ref
          } else {
            ref = pl.metadata.origin
          }
          if (ref) {
            targets.value.push({
              sourceId: src.id,
              sourceName: src.name,
              title: pl.document.title,
              pic: pl.document.pic,
              ref,
            })
          }
        }
      }
    } catch {}
  }
})

async function addTo(target: PlaylistTarget) {
  try {
    const source = sourceRegistry.sources.get(target.sourceId)
    const ability = source?.getAvailability('appendToPlaylist')
    if (ability?.available) {
      await ability.invoke(props.data.song, target.ref)
      showMessage(`已添加到「${target.title}」`)
      emitter.emit('playlistUpdated', target.sourceId)
      props.closeDialog()
    }
  } catch (e) {
    showMessage(`添加失败: ${(e as Error).message}`)
  }
}
</script>

<style scoped>
.content {
  max-height: 300px;
  overflow-y: auto;
}
.playlistItem {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  cursor: pointer;
  border-radius: 8px;
  transition: background .15s;
}
.playlistItem:hover {
  background: rgba(255, 255, 255, 0.1);
}
.itemPic {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
}
.itemTitle {
  color: var(--ymk-text-color);
  font-size: 14px;
}
.itemSource {
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
}
.empty {
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  padding: 20px;
}
</style>
