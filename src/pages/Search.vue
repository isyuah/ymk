<template>
  <div class="partContainer DEF-SONGLIST">
    <div class="searchBar">
      <div
        class="sourceSelector"
        @click.stop="showSourceSelector = !showSourceSelector"
      >
        <div class="currentSource">
          <span>{{ currentSourceLabel }}</span>
          <svg
            :class="{ arrow: true, open: showSourceSelector }"
            viewBox="0 0 1024 1024"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M512 650.24 213.76 352 160 405.76l352 352 352-352L810.24 352z"
              fill="currentColor"
            />
          </svg>
        </div>
        <Transition name="fade">
          <div
            v-show="showSourceSelector"
            class="sourceOptions"
          >
            <div
              v-for="op in sourceOptions"
              :key="op.value"
              :class="{ sourceOption: true, active: currentSourceId === op.value }"
              @click.stop="selectSource(op.value)"
            >
              {{ op.label }}
            </div>
          </div>
        </Transition>
      </div>
      <div class="searchInputContainer">
        <input
          ref="searchInput"
          type="text"
          placeholder="搜索"
          @focus="showSuggestBar = true"
          @keydown.enter="search()"
          @keydown.up.prevent="lastSuggest"
          @keydown.down.prevent="nextSuggest"
          @input="refreshSuggests"
        >
        <div
          class="searchButton"
          @click="search()"
        >
          <svg
            t="1711784197878"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="4252"
            width="48"
            height="48"
          ><path
            d="M454.198549 856.251462c-53.599755 0-105.60827-10.503215-154.582681-31.216979-47.291073-20.00359-89.75828-48.632627-126.219703-85.095074-36.462446-36.462446-65.092507-78.929654-85.095073-126.220726-20.714787-48.974411-31.216979-100.983949-31.216979-154.583705s10.503215-105.60827 31.218002-154.58268c20.002566-47.291073 48.632627-89.757257 85.095074-126.219703 36.462446-36.462446 78.92863-65.092507 126.219703-85.095074C348.59028 72.522734 400.599817 62.019519 454.198549 62.019519s105.60827 10.503215 154.581658 31.218002c47.291073 20.002566 89.75828 48.632627 126.220726 85.095074 36.462446 36.462446 65.091484 78.92863 85.095074 126.219703 20.713764 48.974411 31.216979 100.983949 31.216979 154.58268 0 102.939487-39.223327 200.536292-110.446462 274.812973-9.487072 9.896394-25.200962 10.223852-35.094286 0.736781-9.894348-9.488095-10.223852-25.199938-0.73678-35.094286 62.317301-64.98813 96.635921-150.383032 96.635921-240.455468 0-191.597713-155.87614-347.473853-347.47283-347.473852s-347.472829 155.87614-347.472829 347.473852S262.60186 806.608831 454.198549 806.608831c32.573883 0 64.808028-4.497431 95.808067-13.369495 13.178137-3.765767 26.921139 3.854794 30.692022 17.033955 3.771907 13.179161-3.854794 26.920116-17.033955 30.692023-35.443233 10.143011-72.272024 15.286148-109.466134 15.286148z"
            fill="currentColor"
            p-id="4253"
          /><path
            d="M937.143816 960.063829a24.740474 24.740474 0 0 1-17.725709-7.444553l-214.193337-218.475873c-9.596566-9.788947-9.442046-25.50386 0.3469-35.100426 9.78997-9.598612 25.504884-9.441023 35.100426 0.346901l214.193337 218.475873c9.596566 9.788947 9.442046 25.50386-0.346901 35.100426a24.742521 24.742521 0 0 1-17.374716 7.097652z"
            fill="currentColor"
            p-id="4254"
          /></svg>
        </div>
        <div
          v-show="showSuggestBar && searchInput!.value && suggests.length"
          class="suggestBar"
        >
          <div
            v-for="(suggest, index) in suggests"
            :key="index"
            :class="{suggest: true, active: suggestSelected === index}"
            @click="acceptSuggest(suggest)"
          >
            {{ suggest }}
          </div>
        </div>
      </div>
    </div>
    <Transition name="cube">
      <div
        v-show="tmpSearchVal !== ''"
        class="searchResult"
      >
        <div
          class="songs searchResultPart OverScrollBehavior-Contain"
          style="grid-column: span 17"
        >
          <Transition name="cube">
            <div
              v-show="!songLoading"
              class="container"
            >
              <simplebar
                data-auto-hide
                class="simplebar"
              >
                <div class="searchResultSongTable forbidSelect">
                  <div
                    v-for="(song, index) in resultSongList"
                    :key="index"
                    class="song"
                    @dblclick="tryPlaySong(song)"
                    @contextmenu.prevent="onSongContextMenu($event, song)"
                  >
                    <div class="songInfo songIndex">
                      {{ index+1 }}
                    </div>
                    <div class="songInfo songTitle singleLineTextEl">
                      {{ song.title }}
                    </div>
                    <div class="songInfo songSinger singleLineTextEl">
                      {{ song.singer }}
                    </div>
                  </div>
                </div>
              </simplebar>
            </div>
          </Transition>
          <Transition name="cube">
            <Pagination
              v-show="!paginationLoading"
              v-model:group="nowGroup"
              v-model="nowPage"
              :total="total"
              :count-in-page="songPageSize"
              class="pagination forbidSelect"
              @change-page="changePage"
            />
          </Transition>
        </div>
        <Transition name="cube">
          <div
            v-if="hasAlbumAbility"
            class="searchResultPart forbidSelect albums"
            style="grid-column: span 7"
          >
            <div class="header">
              专辑
            </div>
            <Transition name="cube">
              <div
                v-show="!albumLoading"
                class="main"
              >
                <div
                  v-for="(album, ai) in resultAlbumList"
                  :key="ai"
                  class="albumItem"
                  @click="openAlbum(album)"
                >
                  <div class="pic">
                    <img
                      v-if="album.pic"
                      :src="album.pic"
                      alt=""
                    >
                  </div>
                  <div class="info singleLineTextEl">
                    <div class="title singleLineTextEl">
                      {{ album.title }}
                    </div>
                    <div class="intro singleLineTextEl">
                      {{ album.artist }} <span
                        v-if="album.songCount"
                        style="color: #ccc"
                      >共{{ album.songCount }}首</span>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </Transition>
        <Transition name="cube">
          <div
            v-if="hasArtistAbility"
            class="searchResultPart forbidSelect singers"
            style="grid-column: span 12"
          >
            <div class="header">
              歌手
            </div>
            <Transition name="cube">
              <div
                v-show="!singerLoading"
                class="main"
              >
                <div
                  v-for="(singer, si) in resultArtistList"
                  :key="si"
                  class="singerItem"
                  @click="openArtist(singer)"
                >
                  <div class="pic">
                    <img
                      v-if="singer.pic"
                      referrerpolicy="no-referrer"
                      :src="singer.pic"
                      alt=""
                    >
                  </div>
                  <div class="name singleLineTextEl">
                    {{ singer.name }}
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </Transition>
        <Transition name="cube">
          <div
            v-if="hasPlaylistAbility"
            class="searchResultPart forbidSelect playlists"
            style="grid-column: span 12"
          >
            <div class="header">
              歌单
            </div>
            <Transition name="cube">
              <div
                v-show="!playlistLoading"
                class="main"
              >
                <div
                  v-for="(p, pi) in resultPlaylistList"
                  :key="pi"
                  class="playlistItem"
                  @click="openPlaylist(p)"
                >
                  <div class="pic">
                    <img
                      v-if="p.pic"
                      :src="p.pic"
                      alt=""
                    >
                  </div>
                  <div class="name singleLineTextEl">
                    {{ p.title }}
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </Transition>
      </div>
    </Transition>
  </div>
</template>

<script setup lang='ts'>
import {computed, onMounted, onUnmounted, ref, toRaw} from "vue";
import '@/assets/songlist.css'
import simplebar from "simplebar-vue";
import 'simplebar-vue/dist/simplebar.min.css'
import Pagination from '@/components/Pagination.vue'
import DSelect from '@/components/DSelect.vue'
import emitter from "@/emitter";
import AddToPlaylistDialog from "@/components/Dialogs/AddToPlaylistDialog.vue";
import {showDialog} from "@/utils/dialog";
import {showContextMenu} from "@/utils/contextMenu";
import {sourceRegistry} from "@/sources/registry";
import type {SongBase, SourceEntityRef, SearchAlbumItem, SearchArtistItem, SearchPlaylistItem, PaginatedResult} from "@/sources/musicSource";
import {SourceEntityType} from "@/sources/musicSource";
import type {RuntimePlaylist} from "@/sources/playlist";
import {navigateToPlaylistDetail, navigateToAlbumDetail, navigateToArtistDetail} from "@/utils/v2/playlist";

// --- 防抖 ---
function debounce(fn: Function, delay: number) {
  let timer: any = null;
  return function (this: any, ...args: any[]) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  }
}

// --- 源选择（动态，只列出支持 searchSongs 的源） ---
const searchSources = sourceRegistry.listByCapability('searchSongs');
const sourceOptions = searchSources.map(s => ({ value: s.id, label: s.name }));
const currentSourceId = ref<string>(searchSources[0]?.id ?? '');
const showSourceSelector = ref(false);
const currentSourceLabel = computed(() => sourceOptions.find(op => op.value === currentSourceId.value)?.label ?? '选择源');

// --- 各区块能力检测 ---
const hasAlbumAbility = computed(() => sourceRegistry.getSourceAbility(currentSourceId.value, 'searchAlbums')?.available ?? false);
const hasArtistAbility = computed(() => sourceRegistry.getSourceAbility(currentSourceId.value, 'searchArtists')?.available ?? false);
const hasPlaylistAbility = computed(() => sourceRegistry.getSourceAbility(currentSourceId.value, 'searchPlaylists')?.available ?? false);

// --- 状态 ---
const searchInput = ref<HTMLInputElement>();
const tmpSearchVal = ref('');
const showSuggestBar = ref(false);
const suggests = ref<string[]>([]);
const suggestSelected = ref(-1);

const resultSongList = ref<SongBase[]>([]);
const resultAlbumList = ref<SearchAlbumItem[]>([]);
const resultArtistList = ref<SearchArtistItem[]>([]);
const resultPlaylistList = ref<SearchPlaylistItem[]>([]);
const total = ref(0);
/** 歌曲分页大小:由 source 的 searchSongs 返回值决定,跨源会变 */
const songPageSize = ref(30);

const nowPage = ref(1);
const nowGroup = ref(0);

const songLoading = ref(false);
const albumLoading = ref(false);
const singerLoading = ref(false);
const playlistLoading = ref(false);
const paginationLoading = ref(false);

// --- 搜索建议 ---
function acceptSuggest(text: string) {
  if (!searchInput.value) return;
  searchInput.value.value = text;
  suggestSelected.value = -1;
  search();
}

const refreshSuggests = debounce(async function () {
  if (!searchInput.value || !searchInput.value.value) {
    suggests.value = [];
    return;
  }
  const ability = sourceRegistry.getSourceAbility(currentSourceId.value, 'suggest');
  if (!ability?.available) { suggests.value = []; return; }
  try {
    suggests.value = await ability.invoke(searchInput.value.value);
    suggestSelected.value = -1;
    showSuggestBar.value = true;
  } catch { suggests.value = []; }
}, 200);

function lastSuggest() { if (suggestSelected.value > -1) suggestSelected.value--; }
function nextSuggest() { if (suggestSelected.value < suggests.value.length - 1) suggestSelected.value++; }

function selectSource(sourceId: string) {
  currentSourceId.value = sourceId;
  showSourceSelector.value = false;
  suggests.value = [];
  suggestSelected.value = -1;
  if (tmpSearchVal.value) doSearch(tmpSearchVal.value, nowPage.value);
}

// --- 搜索 ---
function search() {
  if (!searchInput.value) return;
  showSuggestBar.value = false;
  if (suggestSelected.value !== -1) {
    const text = suggests.value[suggestSelected.value];
    if (text) searchInput.value.value = text;
    suggestSelected.value = -1;
  }
  const query = searchInput.value.value;
  nowPage.value = 1;
  nowGroup.value = 0;
  tmpSearchVal.value = query;
  doSearch(query, 1);
}

function changePage() { fetchSongs(tmpSearchVal.value, nowPage.value); }

async function fetchSongs(query: string, page: number) {
  const ability = sourceRegistry.getSourceAbility(currentSourceId.value, 'searchSongs');
  if (!ability?.available) return;
  songLoading.value = true;
  paginationLoading.value = true;
  try {
    const res: PaginatedResult<SongBase> = await ability.invoke(query, page, songPageSize.value);
    resultSongList.value = res.data;
    total.value = res.total;
    songPageSize.value = res.pageSize;
  } catch { resultSongList.value = []; total.value = 0; }
  finally { songLoading.value = false; paginationLoading.value = false; }
}

async function doSearch(query: string, page: number) {
  if (!query) return;
  const src = currentSourceId.value;

  const tasks: Promise<void>[] = [];

  // 歌曲
  const songAbility = sourceRegistry.getSourceAbility(src, 'searchSongs');
  if (songAbility?.available) {
    songLoading.value = true;
    paginationLoading.value = true;
    tasks.push(songAbility.invoke(query, page, songPageSize.value)
      .then((res: PaginatedResult<SongBase>) => {
        resultSongList.value = res.data;
        total.value = res.total;
        songPageSize.value = res.pageSize;
      })
      .catch(() => { resultSongList.value = []; total.value = 0; })
      .finally(() => { songLoading.value = false; paginationLoading.value = false; })
    );
  }

  // 专辑
  const albumAbility = sourceRegistry.getSourceAbility(src, 'searchAlbums');
  if (albumAbility?.available) {
    albumLoading.value = true;
    tasks.push(albumAbility.invoke(query, page, 10)
      .then((res: PaginatedResult<SearchAlbumItem>) => { resultAlbumList.value = res.data; })
      .catch(() => { resultAlbumList.value = []; })
      .finally(() => { albumLoading.value = false; })
    );
  } else { resultAlbumList.value = []; }

  // 歌手
  const artistAbility = sourceRegistry.getSourceAbility(src, 'searchArtists');
  if (artistAbility?.available) {
    singerLoading.value = true;
    tasks.push(artistAbility.invoke(query, page, 10)
      .then((res: PaginatedResult<SearchArtistItem>) => { resultArtistList.value = res.data; })
      .catch(() => { resultArtistList.value = []; })
      .finally(() => { singerLoading.value = false; })
    );
  } else { resultArtistList.value = []; }

  // 歌单
  const playlistAbility = sourceRegistry.getSourceAbility(src, 'searchPlaylists');
  if (playlistAbility?.available) {
    playlistLoading.value = true;
    tasks.push(playlistAbility.invoke(query, page, 10)
      .then((res: PaginatedResult<SearchPlaylistItem>) => { resultPlaylistList.value = res.data; })
      .catch(() => { resultPlaylistList.value = []; })
      .finally(() => { playlistLoading.value = false; })
    );
  } else { resultPlaylistList.value = []; }

  await Promise.all(tasks);
}

// --- 播放 & 右键菜单 ---
function tryPlaySong(song: SongBase) { emitter.emit('playSongV2', song, true); }

function onSongContextMenu(e: MouseEvent, song: SongBase) {
  showContextMenu<{ song: SongBase }>({
    position: { left: e.clientX, top: e.clientY },
    items: [
      {
        title: '播放',
        action: ({ song }) => emitter.emit('playSongV2', song),
      },
      {
        title: '添加到歌单',
        action: ({ song }) => showDialog(AddToPlaylistDialog, { song }),
      },
    ],
    args: { song },
  });
}

// --- 搜索结果点击 ---
function openAlbum(album: SearchAlbumItem) {
  const ref: SourceEntityRef = { sourceType: currentSourceId.value, symbol: album.id, type: SourceEntityType.Album };
  navigateToAlbumDetail(ref);
}
function openArtist(artist: SearchArtistItem) {
  const ref: SourceEntityRef = { sourceType: currentSourceId.value, symbol: artist.id, type: SourceEntityType.Artist };
  navigateToArtistDetail(ref);
}
function openPlaylist(playlist: SearchPlaylistItem) {
  const ref: SourceEntityRef = { sourceType: currentSourceId.value, symbol: playlist.id, type: SourceEntityType.Playlist };
  const rp: RuntimePlaylist = {
    document: {
      SchemaVersion: 2,
      title: playlist.title,
      pic: playlist.pic ?? '',
      entries: [{ kind: 'playlistRef', ref }],
    },
    metadata: {
      origin: ref,
      status: { loading: false },
    },
  };
  navigateToPlaylistDetail(rp);
}

// --- 全局点击关闭 ---
onMounted(() => {
  const l = (e: Event) => {
    if ((e.target as HTMLElement).tagName !== 'INPUT' &&
        !(e.target as HTMLElement).classList.contains('suggest') &&
        !(e.target as HTMLElement).closest('.sourceSelector')) {
      showSuggestBar.value = false;
      showSourceSelector.value = false;
    }
  };
  document.body.addEventListener('click', l);
  onUnmounted(() => document.body.removeEventListener('click', l));
});
</script>

<style scoped>
.partContainer {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
}
.searchBar {
    margin-top: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
}
.searchBar .searchInputContainer {
  align-self: center;
    width: 50%;
    position: relative;
}
.searchBar input {
    border: none;
    height: 28px;
    line-height: 28px;
    border-bottom: 1px solid var(--ymk-text-color);
    background-color: transparent;
    font-size: 18px;
    width: 100%;
    color: var(--ymk-text-color);
    padding: 5px 10px;
    padding-right: 150px;
    font-family: SourceSansCNM;
}
.searchBar .searchButton {
    width: 24px;
    height: 24px;
    position: absolute;
    right: 0;
    top: 2px;
}
.searchBar .searchButton svg {
    width: 100%;
    height: 100%;
    color: var(--ymk-text-color);
}
.searchBar .searchInputContainer .suggestBar {
    color: var(--ymk-text-color);
    position: absolute;
    width: 100%;
    border: 1px solid var(--ymk-text-color);
    background-color: rgba(0,0,0,.4);
    border-top: 0;
    z-index: 102;
    max-height: 320px;
}
.searchBar .searchInputContainer .suggestBar .suggest {
    height: 32px;
    line-height: 32px;
    padding: 0 5px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    word-break: break-all;
    transition: all .15s;
    cursor: pointer;
}
.searchBar .searchInputContainer .suggestBar .suggest.active {
    background-color: rgba(0,0,0,.6);
    color: #fff;
}
.pagination {
    margin: 20px 0;
}
.searchResult {
  flex: 1;
  min-height: 0;
  display: grid;
  padding: 10px 20px;
  grid-gap: 20px;
  grid-template-columns: repeat(24, 1fr);
  grid-template-rows: 100%;
  overflow-y: scroll;
}
.searchResult::-webkit-scrollbar, .searchResultPart .main::-webkit-scrollbar {
  display: none;
}
.searchResultSongTable .song {
  display: grid;
  grid-template-columns: 40px 1fr 1fr;
  grid-auto-rows: 45px;
  line-height: 45px;
}
.songs {
  flex-direction: column;
}
.songs .container {
  min-height: 0;
}
.searchResultPart {
  background-color: var(--ymk-container-bg-color);
  box-shadow: 0 0 5px var(--ymk-container-bg-color);
  backdrop-filter: blur(2px);
  color: #fff;
  height: 100%;
}
.searchResultSongTable {
  color: var(--ymk-text-color);
}
.searchResultSongTable .song {
  transition: background .15s;
}
.searchResultSongTable .song:hover, .searchResultSongTable .song.active {
  background-color: rgba(0,0,0,.35);
  color: #fff;
}
.searchResultSongTable .song .songTitle, .searchResultSongTable .song .songSinger {
  padding: 0 10px;
}
.searchResultSongTable .song .songIndex {
  text-align: center;
  color: #eee;
  font-weight: bold;
}
.searchResultPart.albums {
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow-x: hidden;
  font-family: SourceSansCNM;
}
.searchResultPart .header {
  padding: 10px;
  font-size: 22px;
}
.searchResultPart .main {
  min-height: 0;
  overflow-y: scroll;
  overflow-x: hidden;
  overscroll-behavior-y: contain;
}
.searchResultPart.albums .main {
  flex: 1;
}
.searchResultPart.albums .albumItem {
  cursor: pointer;
  padding: 10px;
  height: 80px;
  display: grid;
  grid-template-columns: 60px 1fr;
  grid-template-rows: 60px;
  grid-column-gap: 10px;
  transition: all .15s;
}
.searchResultPart.albums .albumItem:hover {
  background-color: rgba(0,0,0,.35);
}
.searchResultPart.albums .albumItem .info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.searchResultPart.albums .albumItem .info .title {
  font-size: 18px;
  margin-bottom: 5px;
}
.searchResultPart.albums .albumItem .info .intro {
  font-size: 14px;
}
.searchResultPart img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.searchResultPart.singers .main, .searchResultPart.playlists .main {
  justify-content: center;
  display: grid;
  padding: 10px;
  grid-template-columns: repeat(auto-fill, 100px);
  grid-auto-rows: 130px;
  grid-gap: 15px;
}
.searchResultPart.singers .main .singerItem, .searchResultPart.playlists .main .playlistItem {
  cursor: pointer;
  display: grid;
  grid-template-rows: 100px 20px;
  grid-gap: 10px;
  text-align: center;
}
.searchResultPart.singers .main .singerItem img {
  border-radius: 50%;
}
.searchResultPart.singers .main .singerItem .name, .searchResultPart.playlists .main .playlistItem .name {
  font-size: 16px;
  line-height: 20px;
}
.searchResultPart.singers .main .pic, .searchResultPart.playlists .main .pic {
  width: 100%;
}

.sourceSelector {
  color: var(--ymk-text-color);
  position: relative;
  width: 132px;
  margin-right: 18px;
  font-family: SourceSansCNM;
  user-select: none;
  z-index: 103;
}
.sourceSelector .currentSource {
  height: 38px;
  padding: 0 12px 0 14px;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 19px;
  background: rgba(0,0,0,.22);
  box-shadow: 0 6px 18px rgba(0,0,0,.16), inset 0 0 0 1px rgba(255,255,255,.04);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all .18s;
}
.sourceSelector .currentSource:hover {
  border-color: rgba(255,255,255,.42);
  background: rgba(255,255,255,.08);
}
.sourceSelector .currentSource span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
}
.sourceSelector .arrow {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  margin-left: 8px;
  opacity: .78;
  transition: transform .18s;
}
.sourceSelector .arrow.open {
  transform: rotate(180deg);
}
.sourceSelector .sourceOptions {
  position: absolute;
  left: 0;
  top: 46px;
  width: 100%;
  padding: 6px;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 14px;
  background: rgba(18,18,18,.72);
  box-shadow: 0 12px 28px rgba(0,0,0,.32);
  backdrop-filter: blur(12px);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sourceSelector .sourceOption {
  height: 34px;
  line-height: 34px;
  padding: 0 10px;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all .15s;
}
.sourceSelector .sourceOption:hover {
  background: rgba(255,255,255,.1);
  color: #fff;
}
.sourceSelector .sourceOption.active {
  background: rgba(255,255,255,.18);
  color: #fff;
}
</style>
