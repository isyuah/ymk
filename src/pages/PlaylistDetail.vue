<template>
  <div class="transitionContainer">
    <div
      class="returnBtn"
      @click="goBack"
    >
      <svg
        t="1711457272465"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="4244"
        width="48"
        height="48"
      ><path
        d="M963.2 0L1024 67.2 512 614.4 0 67.2 60.8 0 512 480 963.2 0z"
        fill="currentColor"
        p-id="4245"
      /></svg>
    </div>
    <div class="partContainer DEF-SONGLIST">
      <div class="listInfo">
        <div
          class="faceImg forbidSelect"
          :class="{ circular: displayMode === 'artist' }"
        >
          <img
            referrerpolicy="no-referrer"
            :src="runtimeData.currentPlaylist!.document.pic"
            alt=""
          >
        </div>
        <div class="info forbidSelect">
          <div class="top">
            <div class="title">
              {{ runtimeData.currentPlaylist!.document.title }}
            </div>
            <button
              v-if="runtimeData.currentPlaylist?.entryMetadata?.[0]?.canSubscribe"
              class="subscribeBtn"
              @click="toggleSubscription(runtimeData.currentPlaylist)"
            >
              {{ runtimeData.currentPlaylist.entryMetadata?.[0]?.subscribed ? '取消收藏' : '收藏' }}
            </button>
          </div>
          <div class="bottom">
            <div class="total">
              总共 {{ runtimeData.currentPlaylist?.songs.length ?? 0 }} 首
            </div>
            <div class="intro">
              {{ runtimeData.currentPlaylist?.document.intro ?? 'No Intro Here' }}
            </div>
            <button
              class="PlayAll"
              @click="playAll"
            >
              <span class="chevron" />
              <div class="text">
                播放全部
              </div>
            </button>
          </div>
        </div>
      </div>
      <div class="tablePartContainer">
        <div class="divider forbidSelect">
          <div class="dividerTip">
            歌曲列表
          </div>
          <div class="divideLine" />
          <input
            v-model="filter"
            class="search"
            placeholder="搜索"
          >
        </div>
        <div class="songs">
          <div class="container">
            <VirtualList
              v-slot="{item: ITEM}"
              :item-height="38"
              :items="showingSongList"
              :size="8"
              class-name="songTable"
            >
              <!--                    TODO:: 批量查询歌曲disable-->
              <div
                class="song"
                :class="{disabled: false}"
                @dblclick="playSong(ITEM.item)"
                @contextmenu.prevent="tryShowMenu({song: ITEM.item,si: ITEM.refIndex})"
              >
                <div class="songInfo title">
                  {{ ITEM.item.title }}<sub>{{ ITEM.item.sourceType }}</sub>
                </div>
                <div class="songInfo author">
                  {{ ITEM.item.singer }}
                </div>
              </div>
            </VirtualList>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import {computed, nextTick, ref, watch} from 'vue';
import emitter from '@/emitter';
import '@/assets/songlist.css'
import Fuse from "fuse.js";
import EditSongInfoDialog from "@/components/Dialogs/EditSongInfoDialog.vue";
import CustomLyricDialog from "@/components/Dialogs/CustomLyricDialog.vue";
import AddToPlaylistDialog from "@/components/Dialogs/AddToPlaylistDialog.vue";
import {useRouter} from "vue-router";
import VirtualList from "@/components/VirtualList.vue";
import {showContextMenu} from "@/utils/contextMenu";
import {usePlayerStore} from "@/stores/modules/player";
import {showMessage} from "@/utils/message";
import {showDialog} from "@/utils/dialog";
import {useRuntimeDataStore} from "@/stores/modules/runtimeData";
import {refreshPlaylists} from "@/utils/Toolkit";
import { pinyin } from 'pinyin-pro';
import {sourceRegistry} from "@/sources/registry";
import type {LoadedPlaylist} from "@/sources/playlist";
import type {SongBase} from "@/sources/musicSource";
import type {DisplayMode} from "@/utils/v2/playlist";
const router = useRouter();
const runtimeData = useRuntimeDataStore()
const player = usePlayerStore()
let filter = ref('');

const displayMode = computed<DisplayMode>(() => (runtimeData.currentPlaylist as any)?.extra?.displayMode ?? 'playlist');

function goBack() {
  if (displayMode.value === 'playlist') {
    router.push('/playlist');
  } else {
    router.push('/search');
  }
}
const songsWithPinyin = computed(() => {
    return runtimeData.currentPlaylist!.songs.map((song, refIndex) => {
    const titlePinyinFull = pinyin(song.title || '', { toneType: 'none', type: 'array' }).join('');
    const singerPinyinFull = pinyin(song.singer || '', { toneType: 'none', type: 'array' }).join('');
    const titlePinyinInitial = pinyin(song.title || '', { toneType: 'none', type: 'array', pattern: 'initial' }).join('');
    const singerPinyinInitial = pinyin(song.singer || '', { toneType: 'none', type: 'array', pattern: 'initial' }).join('');
    
      return {
        ...song,
        refIndex,
        titlePinyin: titlePinyinFull,
        singerPinyin: singerPinyinFull,
        titlePinyinInitial: titlePinyinInitial,
      singerPinyinInitial: singerPinyinInitial
    };
  });
});

let FuseVal = ref(new Fuse(songsWithPinyin.value, {
  keys: ['title', 'singer', 'titlePinyin', 'singerPinyin', 'titlePinyinInitial', 'singerPinyinInitial'],
  threshold: 0.3
}))

watch(() => runtimeData.currentPlaylist, (nv) => {
  FuseVal.value = new Fuse(songsWithPinyin.value, {
    keys: ['title', 'singer', 'titlePinyin', 'singerPinyin', 'titlePinyinInitial', 'singerPinyinInitial'],
    threshold: 0.3
  })
}, {deep: true})
let showingSongList = computed(() => {
  nextTick(() => emitter.emit('virtualList-refresh'))
  if (!filter.value) {
    return runtimeData.currentPlaylist!.songs.map((element, index) => ({item: element, refIndex: index}))
  } else {
    // 使用拼音搜索
    const searchResults = FuseVal.value.search(filter.value);
    return searchResults.map(result => ({
      item: runtimeData.currentPlaylist!.songs[result.item.refIndex],
      refIndex: result.item.refIndex
    }));
  }
})

async function toggleSubscription(pl: LoadedPlaylist) {
  if (!(pl.document.entries?.[0].kind === 'playlistRef') || !(pl.entryMetadata?.[0]) || !('subscribed' in pl.entryMetadata[0])) return;
  const ab = sourceRegistry.getSourceAbility('netease', 'subscribePlaylist');
  if (!ab?.available) return;
  if (await ab.invoke(pl.document.entries[0].ref)) {
    pl.entryMetadata[0].subscribed = !pl.entryMetadata[0].subscribed;
    showMessage("收藏/取消收藏 成功")
  }
}

function tryShowMenu({song, si}: {song: SongBase, si: number}) {
  const pl = runtimeData.currentPlaylist!
  const sourceType = pl.metadata.origin.sourceType
  const source = sourceRegistry.sources.get(sourceType)

  const hasRemove = source?.getAvailability('removeFromPlaylist')?.available
  const hasEdit = source?.getAvailability('editSongInfo')?.available
  const hasLyric = source?.getAvailability('customizeLyric')?.available

  type SongContext = { song: SongBase, si: number }

  showContextMenu<SongContext>({
    items: [
      {
        title: '播放',
        action: ({song}) => playSong(song),
      },
      {
        title: '添加到歌单',
        action: ({song}) => {
          showDialog(AddToPlaylistDialog, { song })
        },
      },
      {
        title: '从歌单移除',
        show: hasRemove,
        action: async ({song}) => {
          const ability = source!.getAvailability('removeFromPlaylist')
          if (!ability?.available) return;
          await ability.invoke(song, pl)
          pl.songs.splice(si, 1)
          showMessage('已移除')
        },
      },
      {
        title: '编辑歌曲信息',
        show: hasEdit,
        action: ({song}) => {
          showDialog(EditSongInfoDialog, { song, playlist: pl, sourceType, onConfirm: (info) => {
            song.title = info.title
            song.singer = info.singer
            song.pic = info.pic
          } })
        },
      },
      {
        title: '自定义歌词',
        show: hasLyric,
        action: ({song}) => {
          showDialog(CustomLyricDialog, { song, playlist: pl, sourceType, onConfirm: (ref) => {
            if (ref) song.lyricOverride = ref
            else delete song.lyricOverride
          } })
        },
      },
    ],
    args: { song, si },
  })
}

function cloneSongs(songs: SongBase[]) {
  return JSON.parse(JSON.stringify(songs)) as SongBase[];
}

function playAll() {
  player.playlist = cloneSongs(runtimeData.currentPlaylist!.songs)
  if (!player.playlist.length) {
    return;
  }
  if (player.config.mode === 'rand') {
    const index = Math.floor(Math.random() * (player.playlist.length));
    emitter.emit('playSongV2', player.playlist[index], false, true, index)
  }else {
    emitter.emit('playSongV2',player.playlist[0], false, true, 0)
  }
}

function playSong(song: SongBase) {
    emitter.emit('playSongV2', song);
}

</script>


<style scoped>
.returnBtn {
    width: 24px;
    color: var(--ymk-el-color);
    height: 24px;
    position: absolute;
    top:15px;
    right:30px;
    transition: all .25s;
}
.returnBtn svg {
    height: 100%;
    width: 100%;
}
.partContainer {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}

.listInfo {
    display: flex;
    padding: 15px;
}
.listInfo .faceImg {
    width: 200px;
    height: 200px;
    margin-right: 20px;
    box-shadow: 0 0 5px rgba(0, 0, 0, .5)
}
.listInfo .faceImg img {
    object-fit: cover;
    width: 100%;
    height: 100%;
}
.listInfo .faceImg.circular {
    border-radius: 50%;
}
.listInfo .faceImg.circular img {
    border-radius: 50%;
}
.listInfo .info {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 10px 0;
}
.listInfo .info .title {
    font-family: "PingFang SC";
    font-size: 24px;
    margin-bottom: 20px;
    color: var(--ymk-text-color);
    text-shadow: 0 0 5px rgba(0, 0, 0, .2);
    /* letter-spacing: 1px; */
}
.listInfo .info .total, .listInfo .info .intro {
    margin-top: 2px;
    color: var(--ymk-text-color);
    font-size: 18px;
    font-family: "PingFang SC";
}
.listInfo .info .bottom .PlayAll {
  position: relative;
  display: inline-flex;
  align-items: center;
  outline: none;
  border: none;
  border-radius: 8px;
  background-color: transparent;
  margin-top: 10px;
  padding: 5px 15px;
  font-family: "PingFang SC";
  height: 32px;
  text-align: left;
  transition: all .15s;
  color: var(--ymk-text-color);
  align-self: flex-start;
  cursor: pointer;
}
.listInfo .info .bottom .PlayAll:hover {
  background-color: rgba(255, 255, 255, .25);
  backdrop-filter: blur(4px) saturate(180%);
}
.listInfo .info .bottom .PlayAll .text {
  display: inline-block;
  line-height: 32px;
  font-size: 20px;
  margin-left: 10px;
}
.listInfo .info .bottom .PlayAll .chevron {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  opacity: 0.6;
  transform-origin: calc(75%) calc(75%);
  transform: translate(-25%, -25%) rotate(-45deg);
}
.tablePartContainer {
  display: flex;
  flex-direction: column;
  box-shadow: 0 0 4px var(--ymk-container-bg-color);
  /*backdrop-filter: blur(2px);*/
  background-color: var(--ymk-container-bg-color);
  flex: 1;
  min-height: 0;
}
.divider {
    display: flex;
    width: 100%;
    align-items: center;
    padding: 15px;
}
.divider .dividerTip {
    margin-right: 10px;
    font-family: HarmonyOS SC;
    font-weight: bold;
    color: var(--ymk-text-color);
}
.divider .search {
    background-color: transparent;
    margin: 0 5px;
    font-family: SourceSansCNM;
    border: none;
    color: var(--ymk-text-color);
    border-bottom: 2px solid var(--ymk-text-color);
    padding-bottom: 5px;
}
.divideLine {
    height: 1px;
    flex: 1;
    background-color: transparent;
}
.transitionContainer {
    width: 100%;
    height: 100%;
}
.songTable .song.disabled {
  color: #aaa
}
.songTable .song {
    grid-template-columns: 12fr 10fr;
}

.subscribeBtn {
  cursor: pointer;
  height: 40px;
  line-height: 40px;
  min-width: 60px;
  outline: none;
  padding: 0 10px;
  background-color: rgba(0,0,0,.6);
  color: var(--ymk-text-color);
  border: 1px solid #18191C;
}

.listInfo .info .intro {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  line-clamp: 3;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
.listInfo .info .bottom {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

</style>
