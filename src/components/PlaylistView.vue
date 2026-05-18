<script setup lang="ts">
import {sourceRegistry} from "@/sources/registry";
import {onBeforeUnmount, onMounted, ref} from "vue";
import {navigateToPlaylistDetail} from "@/utils/v2/playlist";
import emitter from "@/emitter";
import type { MyPlaylistGroup, RuntimePlaylist } from "@yumuzk/plugin-api";
import {showContextMenu} from "@/utils/contextMenu";
import type {ContextMenuItem} from "@/types";
import {showDialog} from "@/utils/dialog";
import RenamePlaylistDialog from "@/components/Dialogs/RenamePlaylistDialog.vue";
import ChangeCoverDialog from "@/components/Dialogs/ChangeCoverDialog.vue";
import {showMessage} from "@/utils/message";

const playlistGroup = ref<MyPlaylistGroup[]>([]);
const collapsed = ref<boolean[]>([]);
const groupSourceIds = ref<string[]>([]);
const refreshPlaylists = async () => {
  const availableSources = sourceRegistry.listByCapability('getMyPlaylists');
  const sourceIds: string[] = [];
  const groups: MyPlaylistGroup[] = [];
  const results = (await Promise.allSettled(
    availableSources.map((src) => {
      const ability = src.getAvailability('getMyPlaylists');
      if (ability.available && ability.invoke) {
        return ability.invoke();
      } else {
        return Promise.reject();
      }
    })
  ));
  results.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      for (const group of res.value) {
        groups.push(group);
        sourceIds.push(availableSources[i].id);
      }
    }
  });
  playlistGroup.value = groups;
  groupSourceIds.value = sourceIds;
  collapsed.value = Array.from({length: groups.length}, () => true);
}
await refreshPlaylists();

async function refreshSourcePlaylists(sourceId: string) {
  const source = sourceRegistry.sources.get(sourceId)
  if (!source) return
  const ability = source.getAvailability('getMyPlaylists')
  if (!ability.available) return
  try {
    const newGroups = await ability.invoke!()
    // find the range of groups belonging to this source and replace in-place
    const start = groupSourceIds.value.indexOf(sourceId)
    if (start === -1) return
    const end = groupSourceIds.value.lastIndexOf(sourceId) + 1
    playlistGroup.value.splice(start, end - start, ...newGroups)
    groupSourceIds.value.splice(start, end - start, ...newGroups.map(() => sourceId))
    collapsed.value = Array.from({length: playlistGroup.value.length}, () => true)
  } catch {}
}
onMounted(async () => {
  emitter.on('refreshPlaylists', refreshPlaylists)
  emitter.on('playlistUpdated', refreshSourcePlaylists)
})
onBeforeUnmount(() => {
  emitter.off('refreshPlaylists', refreshPlaylists)
  emitter.off('playlistUpdated', refreshSourcePlaylists)
})

type PlaylistContext = {
  playlist: RuntimePlaylist
  sourceType: string
  groupIndex: number
}

function getPlaylistRef(playlist: RuntimePlaylist) {
  const entry = playlist.document.entries.find(e => e.kind === 'playlistRef')
  if (entry && entry.kind === 'playlistRef') return entry.ref
  return playlist.metadata.origin
}

async function onContextMenu(e: MouseEvent, playlist: RuntimePlaylist, groupIndex: number) {
  e.preventDefault()
  const sourceType = groupSourceIds.value[groupIndex]
  const source = sourceRegistry.sources.get(sourceType)
  const ctx: PlaylistContext = { playlist, sourceType, groupIndex }

  const hasRemove = source?.getAvailability('removePlaylist')?.available
  const hasRename = source?.getAvailability('renamePlaylist')?.available
  const hasCover = source?.getAvailability('changePlaylistCover')?.available

  const items: ContextMenuItem<PlaylistContext>[] = [
    {
      title: '打开歌单',
      action: ({playlist}) => navigateToPlaylistDetail(playlist),
    },
    {
      title: '刷新',
      action: () => refreshPlaylists(),
    },
    {
      title: '重命名',
      show: hasRename,
      action: ({playlist, sourceType}) => {
        showDialog(RenamePlaylistDialog, { playlist, sourceType })
      },
    },
    {
      title: '修改封面',
      show: hasCover,
      action: ({playlist, sourceType}) => {
        showDialog(ChangeCoverDialog, { playlist, sourceType })
      },
    },
    {
      title: '删除',
      show: hasRemove,
      action: async ({playlist, sourceType}) => {
        const src = sourceRegistry.sources.get(sourceType)
        const ability = src?.getAvailability('removePlaylist')
        if (ability?.available) {
          const ref = getPlaylistRef(playlist)
          await ability.invoke(ref, playlist)
          showMessage('删除成功')
          refreshPlaylists()
        }
      },
    },
  ]

  await showContextMenu({ items, args: ctx, position: { left: e.clientX, top: e.clientY } })
}
</script>

<template>
  <div class="root">
    <div :key="gidx" class="group" v-for="(group, gidx) in playlistGroup" :class="{collapsed: collapsed[gidx]}">
      <div class="groupTitle" :class="{collapsed: collapsed[gidx]}" @click="collapsed[gidx] = !collapsed[gidx]">
        <span class="chevron"></span>
        {{group.title}}
      </div>
      <div class="groupContainer" :class="{collapsed: collapsed[gidx]}">
        <div class="inner">
          <div @click="navigateToPlaylistDetail(playlist)" @contextmenu="onContextMenu($event, playlist, gidx)" class="playlistItem" v-for="playlist in group.playlists">
            <img referrerpolicy="no-referrer" class="playlistImage" :src="playlist.document.pic" alt="">
            <div class="title">{{playlist.document.title}}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.root {
  padding: 20px 0;
}
.group {
  margin: 0.8rem;
  padding: 0.4rem 0.2rem;
  border-radius: 16px;
  background-color: rgba(255, 255, 255, .1);
  backdrop-filter: blur(8px) saturate(180%);
}
.groupTitle {
  color: var(--ymk-text-color);
  margin: 10px 20px;
  font-size: 1.5rem;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 8px;
}
.groupTitle .chevron {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform-origin: calc(75%) calc(75%);
  transform: translate(-25%, -25%) rotate(45deg);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.6;
}
.groupTitle.collapsed .chevron {
  transform: translate(-25%, -25%) rotate(-45deg);
}
.groupContainer.collapsed {
  grid-template-rows: 0fr;
}
.groupContainer {
  display: grid;
  grid-template-rows: 1fr;
  transition: all .3s;
}
.groupContainer > .inner {
  overflow: hidden;
  width: 100%;
  min-height: 0;
  display: grid;
  align-items: start;
  gap: 10px;
  padding: 0 1rem;
  transition: all .3s;
  grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
}
.playlistItem {
  display: flex;
  flex-direction: column;
  justify-content: end;
  cursor: pointer;
}
.playlistItem > .title {
  color: var(--ymk-text-color);
  font-size: 18px;
  margin-top: 10px;
  text-wrap: wrap;
  max-width: 100%;
  padding: 0 20px;
  line-clamp: 3;
  text-align: center;
}
.playlistItem:hover .playlistImage {
  scale: 1.08;
}
.playlistImage {
  overflow: hidden;
  width: 100%;
  height: 100%;
  padding: 10px;
  object-fit: cover;
  aspect-ratio: 1 / 1;
  transition: scale .25s;
}
</style>
