<template>
  <div class="songEl">
    <video
      ref="songSource"
      preload="auto"
      autoplay
      @loadeddata="whenLoadData"
      @error="videoOnError"
      @ended="playEnded"
      @timeupdate="updateTime"
      @volumechange="changeVolumeInfo"
      @play="whenPlay"
      @pause="whenPause"
    />
  </div>

  <div
    v-show="!runtimeData.showFullPlay"
    ref="fullContainer"
    class="play forbidSelect"
  >
    <Transition name="heightAnim">
      <div
        v-show="showPlaylistSonglist"
        class="playlistSonglist DEF-SONGLIST"
      >
        <div class="foreContainer">
          <div class="playlistSonglistTitle">
            播放列表
          </div>
          <div class="songs">
            <div class="container">
              <VirtualList
                v-slot="{item: song, index}"
                :item-height="38"
                :items="playerStore.playlist"
                :size="10"
                class-name="songTable"
              >
                <div
                  :class="{song: true, active: playerStore.config.indexInPlaylist === index}"
                  :data-song="song"
                  @dblclick="playSongV2(song)"
                  @contextmenu.prevent="showContextMenu({
                    items: [
                      {
                        title: '删除',
                        action: deleteSongInPlaylistSongList
                      }
                    ],
                    args: index
                  })"
                >
                  <div class="songInfo title">
                    {{ song.title }}<sub>{{ song.sourceType }}</sub>
                  </div>
                  <div class="songInfo author">
                    {{ song.singer }}
                  </div>
                </div>
              </VirtualList>
            </div>
          </div>
        </div>
      </div>
    </Transition>
    <div
      v-show="playerStore.currentSong?.pic"
      class="songface"
      @click="runtimeData.showFullPlay = true"
    >
      <img
        ref="songfaceImg"
        referrerpolicy="no-referrer"
        :src="playerStore.currentSong?.pic ?? ''"
        alt=""
      >
    </div>
    <div
      ref="progress_tooltip"
      style="display: none"
      class="progress-tooltip"
    >
      00:00
    </div>
    <div
      class="progress"
      @click="changeProgress"
      @mousemove="changeProgressTip"
      @mouseleave="closeProgressTip"
    >
      <div
        ref="progressChooseFill"
        class="chooseFill"
      />
      <div
        ref="progressFill"
        :style="{width: `${playerStore.config.progress}%`}"
        class="fill"
      />
    </div>
    <div
      ref="songInformation"
      class="songInformation"
    >
      <div
        class="title"
        @click="runtimeData.showFullPlay = true"
      >
        {{ playerStore.currentSong?.title ?? '' }}
      </div>
      <div class="singer">
        {{ playerStore.currentSong?.singer ?? '' }}
      </div>
    </div>
    <div class="controlButtons">
      <div class="playbutton play_last">
        <svg
          t="1711336017191"
          class="icon"
          viewBox="0 0 1024 1024"
          xmlns="http://www.w3.org/2000/svg"
          p-id="1537"
          @click="playPrevSong"
        ><path
          d="M772.930954 40.644923L301.575877 512l471.355077 471.355077a23.809313 23.809313 0 0 1-33.671221 33.67122L251.069046 528.83561a23.809313 23.809313 0 0 1 0-33.67122L739.259733 6.973703a23.809313 23.809313 0 0 1 33.671221 33.67122z"
          p-id="1538"
          fill="currentColor"
          stroke="currentColor"
          stroke-width="15"
          stroke-linecap="round"
          stroke-linejoin="round"
        /></svg>
      </div>
      <div class="playbutton play_pause">
        <svg
          v-show="playerStore.config.status === 'play'"
          t="1711335223450"
          class="icon playbutton_pause"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="6684"
          @click="playerStore.config.status = 'pause'"
        ><path
          d="M325.008696 0c-28.93913 0-51.2 22.26087-51.2 51.2l0 919.373913c0 28.93913 22.26087 51.2 51.2 51.2s51.2-22.26087 51.2-51.2L376.208696 53.426087C376.208696 24.486957 351.721739 0 325.008696 0zM698.991304 0c-28.93913 0-51.2 22.26087-51.2 51.2l0 919.373913c0 28.93913 22.26087 51.2 51.2 51.2s51.2-22.26087 51.2-51.2L750.191304 53.426087C752.417391 24.486957 727.930435 0 698.991304 0z"
          fill="currentColor"
          p-id="6685"
        /></svg>
        <svg
          v-show="playerStore.config.status === 'pause'"
          t="1711335286889"
          class="icon playbutton_play"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="2003"
          @click="playerStore.config.status = 'play'"
        ><path
          d="M897.113042 467.478259 182.539132 8.904348C166.956523-2.226087 144.695654-2.226087 129.113045 6.678261c-15.582609 8.904348-26.713043 26.713043-26.713043 44.521739l0 919.373909c0 20.034783 11.130435 35.617391 26.713043 44.521739C138.017393 1021.773909 144.695654 1023.999996 153.600001 1023.999996c8.904348 0 20.034783-2.226087 28.93913-8.904348L897.113042 556.521737c15.582609-8.904348 24.486956-26.713043 24.486956-44.521739C921.599998 494.191302 912.695651 478.608694 897.113042 467.478259zM204.800001 877.078257 204.800001 146.921739 774.67826 511.999998 204.800001 877.078257z"
          fill="currentColor"
          p-id="2004"
        /></svg>
      </div>
      <div class="playbutton play_next">
        <svg
          b="1711336037990"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="1699"
          @click="playNextSong"
        ><path
          d="M251.069046 983.355077l471.355077-471.355077L251.069046 40.644923A23.809313 23.809313 0 0 1 284.740267 6.973703l488.190687 488.190687a23.809313 23.809313 0 0 1 0 33.67122L284.740267 1017.026297A23.809313 23.809313 0 0 1 251.069046 983.355077z"
          fill="currentColor"
          p-id="1700"
          stroke="currentColor"
          stroke-width="15"
          stroke-linecap="round"
          stroke-linejoin="round"
        /></svg>
      </div>
    </div>
    <div class="durationInfo">
      <div class="infoItem">
        {{ playerStore.config.curTime }} / {{ playerStore.config.durationTime }}
      </div>
    </div>
    <div class="volumeController">
      <div class="volumeTip">
        VOLUME {{ Math.round(100*playerStore.config.volume) }}
      </div>
      <div
        class="volumeProgress"
        @click="changeVolume"
      >
        <div
          ref="volumeProgressFill"
          :style="{width: `${100*playerStore.config.volume}%`}"
          class="volumeProgressFill"
        />
      </div>
    </div>
    <div class="playmodeController">
      <Transition
        mode="out-in"
        name="playcontroller"
      >
        <div
          v-if="playerStore.config.mode === 'list'"
          class="modeitem mode_list"
          @click="playerStore.config.mode = 'loop'"
        >
          <svg
            t="1711798875114"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="4579"
          ><path
            d="M920 760H336c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM920 192H336c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM920 476H336c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h584c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM216 712H100c-2.2 0-4 1.8-4 4v34c0 2.2 1.8 4 4 4h72.4v20.5h-35.7c-2.2 0-4 1.8-4 4v34c0 2.2 1.8 4 4 4h35.7V838H100c-2.2 0-4 1.8-4 4v34c0 2.2 1.8 4 4 4h116c2.2 0 4-1.8 4-4V716c0-2.2-1.8-4-4-4zM100 188h38v120c0 2.2 1.8 4 4 4h40c2.2 0 4-1.8 4-4V152c0-4.4-3.6-8-8-8h-78c-2.2 0-4 1.8-4 4v36c0 2.2 1.8 4 4 4zM216 428H100c-2.2 0-4 1.8-4 4v36c0 2.2 1.8 4 4 4h68.4l-70.3 77.7c-1.3 1.5-2.1 3.4-2.1 5.4V592c0 2.2 1.8 4 4 4h116c2.2 0 4-1.8 4-4v-36c0-2.2-1.8-4-4-4h-68.4l70.3-77.7c1.3-1.5 2.1-3.4 2.1-5.4V432c0-2.2-1.8-4-4-4z"
            p-id="4580"
            fill="currentColor"
          /></svg>
        </div>
        <div
          v-else-if="playerStore.config.mode === 'loop'"
          class="modeitem mode_loop"
          @click="playerStore.config.mode = 'rand'"
        >
          <svg
            t="1711355991685"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="3367"
          ><path
            d="M912.695652 359.513043V801.391304c0 24.486957-20.034783 44.521739-44.521739 44.521739H212.591304c-24.486957 0-44.521739-20.034783-44.521739-44.521739s20.034783-44.521739 44.521739-44.521739H823.652174V400.695652H263.791304l61.217392 62.330435c17.808696 17.808696 17.808696 46.747826 0 64.556522-8.904348 8.904348-20.034783 13.356522-31.165218 13.356521-11.130435 0-22.26087-4.452174-31.165217-13.356521L124.66087 390.678261c-8.904348-8.904348-13.356522-20.034783-13.356522-31.165218 0-12.243478 4.452174-23.373913 13.356522-31.165217l138.017391-136.904348c17.808696-17.808696 45.634783-17.808696 63.443478 0s16.695652 44.521739 0 62.330435L263.791304 311.652174H868.173913c24.486957 0 44.521739 23.373913 44.521739 47.860869z"
            p-id="3368"
            fill="currentColor"
          /></svg>
        </div>
        <div
          v-else-if="playerStore.config.mode === 'rand'"
          class="modeitem mode_rand"
          @click="playerStore.config.mode = 'list'"
        >
          <svg
            t="1711355957905"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="3201"
          ><path
            d="M759.095652 333.913043C712.347826 333.913043 595.478261 449.669565 509.773913 533.147826 380.66087 657.808696 258.226087 779.130435 160.278261 779.130435H100.173913c-24.486957 0-44.521739-20.034783-44.521739-44.521739s20.034783-44.521739 44.521739-44.521739h60.104348c62.330435 0 186.991304-124.66087 287.165217-221.495653 122.434783-117.982609 228.173913-223.721739 311.652174-223.721739h57.878261l-61.217391-58.991304c-17.808696-17.808696-17.808696-43.408696 0-61.217391s45.634783-17.808696 63.443478 0l136.904348 136.904347c8.904348 8.904348 13.356522 20.034783 13.356522 31.165218 0 12.243478-4.452174 23.373913-13.356522 31.165217L818.086957 460.8c-8.904348 8.904348-20.034783 12.243478-31.165218 12.243478-11.130435 0-22.26087-4.452174-31.165217-13.356521-17.808696-17.808696-17.808696-46.747826 0-63.443479l61.217391-62.330435h-57.878261z m58.991305 229.286957c-17.808696-17.808696-45.634783-17.808696-63.443479 0-17.808696 17.808696-17.808696 46.747826 0 64.556522l61.217392 62.330435h-57.878261c-36.730435 0-97.947826-54.53913-158.052174-110.191305-17.808696-16.695652-45.634783-16.695652-63.443478 1.113044-16.695652 17.808696-15.582609 47.86087 2.226086 64.556521 93.495652 85.704348 155.826087 133.565217 220.382609 133.565218h57.878261l-61.217391 58.991304c-17.808696 17.808696-17.808696 44.521739 0 62.330435 8.904348 8.904348 20.034783 12.243478 31.165217 12.243478 11.130435 0 22.26087-4.452174 31.165218-13.356522l136.904347-136.904347c8.904348-8.904348 13.356522-20.034783 13.356522-31.165218 0-12.243478-4.452174-23.373913-13.356522-31.165217L818.086957 563.2zM100.173913 333.913043h60.104348c46.747826 0 116.869565 60.104348 172.521739 110.191305 8.904348 7.791304 18.921739 12.243478 30.052174 12.243478 12.243478 0 24.486957-4.452174 33.391304-14.469565 16.695652-17.808696 15.582609-47.86087-3.33913-64.556522-86.817391-79.026087-160.278261-133.565217-232.626087-133.565217H100.173913c-24.486957 0-44.521739 20.034783-44.521739 44.521739S75.686957 333.913043 100.173913 333.913043z"
            p-id="3202"
            fill="currentColor"
          /></svg>
        </div>
      </Transition>
    </div>
    <div class="lyricButton">
      <SonglistTooltip text="歌词">
        <div
          class="lyricButtonInner"
          @click="toggleLyricWindow"
        >
          <svg
            fill="currentColor"
            t="1761048936789"
            class="icon"
            viewBox="0 0 1024 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="6873"
          ><path
            d="M922.158545 0H101.903515A102.120727 102.120727 0 0 0 0 101.903515v820.130909A102.151758 102.151758 0 0 0 101.903515 1024h820.19297A102.120727 102.120727 0 0 0 1024 922.096485V101.903515A102.027636 102.027636 0 0 0 922.158545 0z m8.316122 930.909091c0-0.434424-837.383758-0.496485-837.383758-0.496485 0.434424 0 0.496485-837.321697 0.496485-837.321697 0 0.434424 837.383758 0.496485 837.383758 0.496485-0.434424 0-0.496485 837.321697-0.496485 837.321697z m-139.636364-172.404364l0.496485 0.248243V275.859394c-1.675636-27.058424-20.293818-41.456485-55.823515-43.132121h-299.442425c-18.618182 1.675636-28.734061 13.529212-30.471757 35.498666 1.675636 21.969455 11.853576 33.82303 30.471757 35.498667h276.542061c5.08897 0 7.633455 2.544485 7.633455 7.633455V722.385455l0.682666 0.372363H625.260606c-9.743515 0-25.56897 12.660364-26.810182 32.954182 1.241212 21.969455 14.708364 33.82303 26.810182 35.498667h143.949576c12.784485-1.551515 19.983515-12.474182 21.659151-32.70594zM461.420606 405.255758c-16.942545-1.675636-26.189576-13.529212-27.927273-35.498667 1.675636-20.293818 10.984727-31.278545 27.927273-32.954182h208.027152c20.293818 1.675636 31.278545 12.660364 32.954181 32.954182-1.675636 21.969455-11.853576 33.82303-30.471757 35.498667h-210.509576zM254.138182 301.242182c-9.929697-1.675636-32.054303-13.529212-33.047273-35.560727 0.99297-20.293818 19.48703-31.278545 29.478788-32.954182h81.826909c11.977697 1.675636 29.106424 12.660364 30.099394 32.954182a38.074182 38.074182 0 0 1-30.099394 35.560727H254.138182z m98.179879 419.653818v-297.890909c1.675636-37.236364-12.660364-54.985697-43.132122-53.310061H248.304485c-18.618182 1.737697-28.734061 13.591273-30.471758 35.560728 1.675636 23.707152 11.853576 36.367515 30.471758 38.043151h25.413818c5.08897 0 7.633455 2.544485 7.633455 7.633455v300.621575a14.522182 14.522182 0 0 0-0.186182 2.358303c0.186182 4.406303 1.241212 8.378182 2.854788 11.977697 4.220121 13.839515 11.481212 21.038545 27.803151 25.072485a12.567273 12.567273 0 0 0 8.067879-1.551515h71.493818c10.550303-1.675636 30.223515-13.529212 31.216485-35.498667-0.930909-20.293818-19.673212-31.278545-31.216485-32.954181h-39.036121v-0.062061z m142.118787-31.464727c-35.498667 0-53.310061-16.942545-53.31006-50.765576V491.52c0-33.82303 15.204848-50.765576 45.676606-50.765576h149.690182c35.498667 0 52.441212 14.398061 50.765576 43.132121v154.779152c0 33.82303-15.204848 50.765576-45.676607 50.765576h-147.145697z m17.749334-73.603879c1.675636 3.413333 4.220121 5.895758 7.633454 7.633454h88.808728c5.08897 0 7.633455-2.544485 7.633454-7.633454v-98.924606c0-5.08897-2.544485-7.633455-7.633454-7.633455h-88.870788c-5.08897 0-7.633455 2.544485-7.633455 7.633455v98.924606h0.062061z"
            fill="currentColor"
            p-id="6874"
          /></svg>
        </div>
      </SonglistTooltip>
    </div>
    <div class="fullPlayBtn">
      <SonglistTooltip text="播放列表">
        <div
          class="fullPlayBtnInner"
          @click="showPlaylistSonglist = !showPlaylistSonglist"
        >
          <svg
            fill="currentColor"
            t="1713269837175"
            class="icon"
            viewBox="0 0 1029 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            p-id="1494"
          ><path
            d="M1018.125653 171.15136c-57.337173-65.010347-130.839893-115.985067-212.432213-147.75296-22.050133-8.864427-46.298453 2.218667-55.125333 23.64416-2.2016 5.1712-2.935467 10.3424-2.935467 15.5136v522.304853c-39.69024-31.030613-88.203947-48.018773-138.922667-48.018773-123.48416 0-224.18432 99.734187-224.18432 222.368427 0 122.630827 100.70016 222.365013 224.18432 222.365013 123.48416 0 224.191147-99.734187 224.191147-222.365013 0-2.218667 0-4.437333-0.740693-6.652587 0-1.477973 0.740693-2.21184 0.740693-3.693227V129.78176c45.568 25.11872 86.7328 58.361173 121.279147 96.77824 15.435093 17.732267 42.62912 19.21024 60.27264 3.69664 17.63328-14.779733 19.838293-41.376427 3.672746-59.10528zM608.703147 897.355093c-76.445013 0-138.922667-62.0544-138.922667-137.413973 0-75.352747 62.481067-137.407147 138.922667-137.407147 76.445013 0 138.922667 62.0544 138.922666 137.407147 0 75.362987-62.47424 137.413973-138.922666 137.413973zM42.728107 261.280427h491.73504c23.524693 0 42.632533-19.206827 42.632533-42.110294 0-23.640747-19.111253-42.10688-42.632533-42.10688H42.728107c-23.528107 0-42.632533 19.206827-42.632534 42.10688 0 22.903467 19.104427 42.110293 42.632534 42.110294z m299.158186 190.600533H42.728107c-23.528107 0-42.632533 19.21024-42.632534 42.110293s19.10784 42.110293 42.632534 42.110294h299.158186c23.52128 0 42.632533-19.21024 42.632534-42.110294s-19.114667-42.110293-42.632534-42.110293z m-127.901013 275.5584H42.728107c-23.528107 0-42.632533 19.21024-42.632534 42.110293 0 22.903467 19.10784 42.10688 42.632534 42.10688h171.257173c23.524693 0 42.632533-19.203413 42.632533-42.10688 0-22.900053-19.10784-42.110293-42.632533-42.110293z"
            p-id="1495"
          /></svg>
        </div>
      </SonglistTooltip>
    </div>
  </div>
</template>

<script setup lang='ts'>
import {onBeforeUnmount, onMounted, onUnmounted, ref, useTemplateRef, watch, watchEffect} from 'vue';
import '@/assets/songlist.css'
import {minmax, secondsToMmss} from '@/utils/u';
import emitter from '@/emitter'
import SonglistTooltip from "@/components/SonglistTooltip.vue";
import {showMessage} from "@/utils/message";
import VirtualList from "@/components/VirtualList.vue";
import {showContextMenu} from "@/utils/contextMenu";
import {usePlayerStore} from "@/stores/modules/player";
import {useRuntimeDataStore} from "@/stores/modules/runtimeData";
import {useConfigStore} from "@/stores/modules/config";
import {Creator} from '@/utils/blankCreator';
import type {SongBase, SourceEntityRef} from "@/sources/musicSource";
import {sourceRegistry} from "@/sources/registry";
import {ToSourceEntityRef} from "@/sources/song";

let songSource = ref<HTMLVideoElement>();
let progressFill = ref<HTMLDivElement>();
let progressChooseFill = ref<HTMLDivElement>();
let progress_tooltip = ref<HTMLDivElement>();
let volumeProgressFill = ref<HTMLDivElement>();
const playerStore = usePlayerStore();
const {onUrlScheme, playPauseStatusUpdate, onTrayControl_PlayPause, onTrayControl_PlaySong, toggleLyricWindow} = window.ymkAPI;
const runtimeData = useRuntimeDataStore()
const config = useConfigStore()
let songfaceImg = ref<HTMLImageElement>();
let songInformation = ref<HTMLDivElement>();
let keepCurrentTimeCausedByError = ref(-1);
const showPlaylistSonglist = ref(false)
const fullContainer = useTemplateRef('fullContainer')
function videoOnError(e: Event) {
  console.log(e);
  showMessage(JSON.stringify(e));
  if (songSource.value) {
    keepCurrentTimeCausedByError.value = songSource.value.currentTime;
    playSongV2(playerStore.currentSong!.origin)
  }
}
function whenLoadData() {
  if (songSource.value && keepCurrentTimeCausedByError.value > -1) {
    songSource.value.currentTime = keepCurrentTimeCausedByError.value;
    keepCurrentTimeCausedByError.value = -1;
  }
}
function whenPlay() {
  playPauseStatusUpdate(true);
  if (playerStore.config.status !== 'play') {
    playerStore.config.status = 'play';
  }
}
function whenPause() {
  playPauseStatusUpdate(false);
  if (playerStore.config.status !== 'pause') {
    playerStore.config.status = 'pause';
  }
}
function changeVolumeInfo() {
    if (songSource.value) {
        playerStore.config.volume = songSource.value.volume;
        playerStore.config.volume = songSource.value.volume
        config.saveConfig();
    }
}
function playEnded() {
  const noEffectWhenNotPlayable = false;
    if (playerStore.config.mode === 'pause') {

    }else if (!playerStore.playlist.length) {
      songSource.value!.currentTime = 0;
      songSource.value!.play();
    }else if (playerStore.config.mode === 'list') {
      let si = playerStore.config.indexInPlaylist;
      if (si === playerStore.playlist.length - 1) {
        playSongV2(playerStore.playlist[0], false, noEffectWhenNotPlayable);
      }else {
        playSongV2(playerStore.playlist[si + 1], false, noEffectWhenNotPlayable);
      }
    }else if (playerStore.config.mode === 'rand') {
      playSongV2(playerStore.playlist[Math.floor(Math.random() * (playerStore.playlist.length))], false, noEffectWhenNotPlayable
      )
    }else if (playerStore.config.mode === 'loop') {
      songSource.value!.currentTime = 0;
      songSource.value!.play();
    }
}
function updateTime() {
    if (songSource.value) {
        let c = songSource.value.currentTime;
        playerStore.config.progress = minmax(c / playerStore.config.duration * 100, 0, 100);
        playerStore.config.curTimeNum = c
        playerStore.config.curTime = secondsToMmss(c);
        emitter.emit('updateActiveLrcIndex');
    }
}
function changeProgress(e: MouseEvent) {
    if (songSource.value) {
        songSource.value.currentTime = minmax(Math.round(playerStore.config.duration * e.clientX / document.body.clientWidth), 0, playerStore.config.duration);
    }
}
function changeProgressTip(e: MouseEvent) {
    if (!progressChooseFill.value || !progress_tooltip.value) {
        return;
    }
    progressChooseFill.value.style.display = "block";
    progress_tooltip.value.style.display = "block"
    progress_tooltip.value.innerText = secondsToMmss(minmax(Math.round(playerStore.config.duration * e.clientX / document.body.clientWidth), 0, playerStore.config.duration));
    progress_tooltip.value.style.left = minmax(e.clientX - progress_tooltip.value.clientWidth / 2, 2, document.body.clientWidth - progress_tooltip.value.clientWidth - 2) + "px";
    progressChooseFill.value.style.width = minmax(e.clientX / document.body.clientWidth * 100, 0, 100) + "%"
}
function closeProgressTip() {
    if (!progressChooseFill.value || !progress_tooltip.value) {
        return;
    }
    progressChooseFill.value.style.display = "none";
    progress_tooltip.value.style.display = "none";
}
function changeVolume(e: any) {
    let toVolume = minmax(e.offsetX / (document.querySelector('.play .volumeProgress') as HTMLDivElement).clientWidth, 0, 100);
    if (songSource.value) {
        songSource.value.volume = toVolume;
    }
}
watchEffect(() => {
  if ('mediaSession' in navigator) {
    navigator.mediaSession.metadata!.title = playerStore.currentSong?.title ?? '';
    navigator.mediaSession.metadata!.artist = playerStore.currentSong?.singer ?? '';
    navigator.mediaSession.metadata!.artwork = [{
      src: playerStore.currentSong?.pic ?? '',
    }]
  }
})
async function resolveToCurrentSong(song: SongBase) {
  const ability = sourceRegistry.getSourceAbility(song.sourceType, 'resolvePlayback');
  if (!ability?.available) {
    console.warn(`歌曲来源 ${song.sourceType} 不支持播放能力`)
    showMessage(`歌曲来源 ${song.sourceType} 不支持播放能力`)
    throw new Error(`歌曲来源 ${song.sourceType} 不支持播放能力`)
  }
  const songRef = ToSourceEntityRef(song);
  const checkAbility = sourceRegistry.getSourceAbility(song.sourceType, 'checkSongPlayable');
  if (checkAbility?.available) {
    let result = await checkAbility.invoke(songRef);
    if (!result.playable) {
      showMessage(`歌曲无法播放： ${result.reason}`)
      if (playerStore.config.mode !== 'loop') playNextSong();
      throw new Error("歌曲无法播放")
    }
  }
  return await ability.invoke(songRef)
}
async function playSongV2(song: SongBase, justTry: boolean = false, noActionWhenNotPlayable = true) {
  const currentSong = Creator.currentSong(song)
  const r = await resolveToCurrentSong(song);
  Object.assign(currentSong, {
    url: r.url,
    pic: song.pic || r.pic,
    singer: song.singer || r.singer,
    title: song.title || r.title,
  })
  const lyricRef: SourceEntityRef = song.lyricOverride ?? ToSourceEntityRef(song);
  const lrcAbility = sourceRegistry.getSourceAbility(song.sourceType, 'resolveLyric');
  if (!lrcAbility?.available) {
    console.warn(`歌曲来源 ${song.sourceType} 不支持歌词能力`)
    showMessage(`歌曲来源 ${song.sourceType} 不支持歌词能力`)
  } else {
    currentSong.lyrics = await lrcAbility.invoke(lyricRef)
  }
  for (let langOption of playerStore.config.langPreferences) {
    if (langOption in currentSong.lyrics) {
      playerStore.config.lang = langOption;
      break;
    }
  }
  playerStore.currentSong = currentSong;
}

onUrlScheme((event: any, uri: any) => {
  console.log('@urlScheme', event, uri)
  const song = JSON.parse(decodeURIComponent(uri))
  if ('type' in song) {
    playSongV2(song, true)
  }
})

function handleCloseCurrentPlaylistUI(e: MouseEvent) {
  if (!fullContainer.value!.contains(e.target as Node)) showPlaylistSonglist.value = false
}

function changeVolumeTo(to: number) {
    if (songSource.value) {
        songSource.value.volume = to;
    }
}
function changeCurTimeTo(to: number) {
    if (songSource.value) {
        songSource.value.currentTime = to;
    }
}
function deleteSongInPlaylistSongList(index: number) {
  if (index < 0 || index >= playerStore.playlist.length) {
    return
  }
  playerStore.playlist.splice(index, 1);
  if (playerStore.config.indexInPlaylist === index) {
    playSongV2(playerStore.playlist[minmax(index, 0, playerStore.playlist.length - 1)]);
  }
}
function playPrevSong() {
  const noEffectWhenNotPlayable = false;
    if (playerStore.config.mode === 'list' || playerStore.config.mode === '' || playerStore.config.mode === 'loop') {
      let si = playerStore.config.indexInPlaylist;
      if (si <= 0 || si > playerStore.playlist.length - 1) {
        playSongV2(playerStore.playlist[playerStore.playlist.length - 1], false, noEffectWhenNotPlayable)
      }else {
        playSongV2(playerStore.playlist[si - 1], false, noEffectWhenNotPlayable);
      }
    }else if(playerStore.config.mode === 'rand') {
      playSongV2(playerStore.playlist[Math.floor(Math.random() * (playerStore.playlist.length))], false, noEffectWhenNotPlayable)
    }
}
function playNextSong() {
  if (playerStore.config.mode === 'loop') {
    let si = playerStore.config.indexInPlaylist;
      if (si === playerStore.playlist.length - 1) {
        playSongV2(playerStore.playlist[0], false, false)
      }else {
        playSongV2(playerStore.playlist[si + 1], false, false);
      }
  }else {
    playEnded();
  }
}
onMounted(() => {
  emitter.on("showPlayingSonglist", (show: boolean) => showPlaylistSonglist.value = show)
  watch(() => playerStore.config.volume, (nv) => {
    changeVolumeTo(minmax(playerStore.config.volume, 0, 1))
  }, {immediate: true})
  watch(() => playerStore.currentSong?.url, (nv) => {
    if (nv) {
      if (songSource.value) {
        songSource.value.src = nv;
        const listener = () => {
          if (songSource.value) {
            playerStore.config.duration = songSource.value.duration;
            playerStore.config.durationTime = secondsToMmss(songSource.value.duration)
            playerStore.config.status = 'play';
          }
          songSource.value?.removeEventListener('loadedmetadata', listener)
        }
        songSource.value.addEventListener('loadedmetadata', listener)
      }
    }
  })
  window.addEventListener('click', handleCloseCurrentPlaylistUI)
  onTrayControl_PlayPause((_e: any, status: boolean) => {
    if (!songSource.value) return;
    if (status) {
      playerStore.config.status = 'play';
    }else {
      playerStore.config.status = 'pause';
    }
  })
  onTrayControl_PlaySong((_e: any, direction: string) => {
    if (direction === 'last') {
      playPrevSong();
    }else if (direction === 'next') {
      playNextSong();
    }
  })
  window.addEventListener('keydown', keyDownEvent)
})
function keyDownEvent(e: KeyboardEvent) {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
    return;
  }

  if (!songSource.value || !playerStore.currentSong?.title) return;
  if (e.key === ' ') {
    e.preventDefault()
    if (songSource.value.paused) {
      playerStore.config.status = 'play'
    }else {
      playerStore.config.status = 'pause'
    }
  }
}
onBeforeUnmount(() => {
  onBeforeUnmount(() => {
    if (songSource.value) {
      songSource.value.pause();
      songSource.value.src = "";
      songSource.value.load();
    }
  });
  window.removeEventListener('keydown', keyDownEvent)
  window.removeEventListener('click', handleCloseCurrentPlaylistUI)
})
watch(() => playerStore.config.status, (nv) => {
    if (!songSource.value) return;
    if (nv === 'play') {
        try {
          songSource.value.play();
        } catch (e) {
          console.warn("[Playbar] songSource .play() error: " + (e as Error)?.message || e)
        }
    }else if (nv === 'pause') {
        songSource.value.pause();
    }
})
watch(() => playerStore.config.show_songface, (nv) => {
    if (!songInformation.value) {
        return;
    }
    if (nv) {
        songInformation.value.style.width = "300px";
    }else {
        songInformation.value.style.width = "358px";
    }
}, {immediate: true})
emitter.on('playSongV2', playSongV2)
emitter.on('playPrevSong', playPrevSong)
emitter.on('playNextSong', playNextSong)
emitter.on('changeVolumeTo', changeVolumeTo)
emitter.on('changeCurTimeTo', changeCurTimeTo)
onUnmounted(() => {
  emitter.off('playSongV2', playSongV2);
  emitter.off('changeVolumeTo', playPrevSong)
  emitter.off('playPrevSong', playPrevSong)
  emitter.off('playNextSong', playNextSong)
  emitter.off('changeCurTimeTo', changeCurTimeTo)
})
</script>

<style scoped>
.songEl {
    display: none;
}
.play {
  z-index: 5;
    height: 64px;
  background-color: rgba(0,0,0,.1);
}
.play {
    position: relative;
    display: flex;
    align-items: center;
}
.play .progress-tooltip {
    font-family: PingFang SC;
    position: absolute;
    top: -29px;
    background-color: rgba(0,0,0,.3);
    padding: 2px 5px;
    line-height: 20px;
    color: #fff;
    z-index: 1;
}
.play .progress {
    cursor: pointer;
    height: 4px;
    left: 0;
    right: 0;
    background-color: var(--ymk-progress-bg-color);
    position: absolute;
    top: 0;
    transition: all .1s;
}
.play .progress .fill {
    position: absolute;
    height: 4px;
    top: 0;
    width: 0;
    background-color: var(--ymk-progress-fill-color);
    transition: alls .1s;
}
.play .progress .chooseFill {
    position: absolute;
    height: 4px;
    top: 0;
    width: 0;
    background-color: var(--ymk-progress-choose-fill-color);
}
.play .songface {
  cursor: pointer;
    margin-left: 10px;
    width: 48px;
    height: 48px;
    margin-top: 2px;
}
.play .songface img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.play .songInformation {
    width: 358px;
    padding-left: 10px;
    padding-right: 20px;
}
.play .songInformation .title {
  cursor: pointer;
    font-family: PingFang SC;
    color: var(--ymk-text-color);
    font-size: 16px;
    white-space: nowrap;
    text-overflow: ellipsis;
    word-break: break-all;
    overflow: hidden;
    line-height: 16px;
    height: 16px;
}
.play .songInformation .singer {
  margin-top: 5px;
  padding-left: 7px;
  color: var(--ymk-text-color);
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  overflow: hidden;
  word-break: break-all;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
}
.play .controlButtons {
    display: flex;
}
.play .controlButtons .playbutton {
    cursor: pointer;
    width: 24px;
    height: 24px;
    color: var(--ymk-el-color);
    margin: 0 20px;
}
.play .durationInfo {
    display: flex;
    flex-direction: column;
    max-height: 100%;
    overflow: hidden;
    align-items: center;
    justify-content: center;
    width: 150px;
}
.play .durationInfo .infoItem {
    font-family: Bender;
    font-weight: bold;
    color: var(--ymk-el-color);
    font-size: 14px;
    letter-spacing: 1px;
    margin: 2px 10px;
}
.play .volumeController {
    margin-left: 20px;
    display: flex;
    flex-direction: column;
}
.play .volumeController .volumeTip {
    color: var(--ymk-text-color);
    font-size: 12px;
    font-weight: bold;
}
.play .volumeController .volumeProgress {
    position: relative;
    border: 1.5px solid var(--ymk-el-color);
    width: 150px;
    height: 14px;
}
.play .volumeController .volumeProgress .volumeProgressFill {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 100%;
    background-color: var(--ymk-el-color);
    transition: all .1s;
}
.play .playmodeController {
    height: 24px;
    margin-left: 20px;
}
.play .playmodeController .modeitem {
    cursor: pointer;
    color: var(--ymk-el-color);
    width: 24px;
    height: 24px;
}
.play .lyricButton {
  width: 24px;
  height: 24px;
  color: var(--ymk-el-color);
  margin-left: 10px;
}
.play .fullPlayBtn, .play .lyricButton {
  cursor: pointer;
  margin-left: 10px;
  /* margin-left: 20px; */
  width: 24px;
  height: 24px;
  color: var(--ymk-el-color);
}
.play .fullPlayBtn svg {
  color: var(--ymk-el-color);
}
.play .playlistSonglist {
  box-shadow: 0 0 10px rgba(255, 255, 255, .2);
  left: 0;
  right: 0;
  background-color: rgba(255, 255, 255,.1);
  position: absolute;
  bottom: 64px;
}
.play .playlistSonglist .foreContainer {
  backdrop-filter: blur(10px);
  box-shadow: 0 0 5px #000;
  height: 400px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.foreContainer .playlistSonglistTitle {
  margin-top: 10px;
  margin-left: 10px;
  padding-bottom: 10px;
  font-size: 20px;
  font-family: SourceSansCNM;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  color: var(--ymk-text-color);
}

.foreContainer .songTable .song:hover, .songTable .song.active {
  background-color: rgba(255,255,255,.3);
}
</style>
