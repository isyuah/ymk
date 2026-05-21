<template>
  <div class="dialogPreviewContainer DEF-DIALOG-CONTENT">
    <div class="header">
      预览
    </div>
    <div class="content">
      <div class="typeChoose">
        <DSelect
          v-model="targetPlatform"
          style="width: 400px"
          :options="platformOptions"
        />
      </div>
      <div>
        <input
          v-model="previewLink"
          style="width: 400px"
          type="text"
          placeholder="输入链接或 ID"
        >
      </div>
    </div>
    <div class="footer">
      <button
        class="dialogBtn confirm"
        @click="preview"
      >
        预览
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

<script setup lang='ts'>
import {ref, computed} from 'vue';
import DSelect from '@/components/DSelect.vue';
import {showMessage} from "@/utils/message";
import {sourceRegistry} from "@/sources/registry";
import {navigateToPlaylistDetail} from "@/utils/v2/playlist";
import {SourceEntityType, type SourceEntityRef, type RuntimePlaylist, type MusicSource} from "@/sources/musicSource";

const previewLink = ref('');
const targetPlatform = ref('auto');

const props = defineProps<{
  closeDialog: () => void
  data: any
}>()

/** 动态生成平台选项：自动检测 + 所有有 resolvePlaylist 的 source */
const platformOptions = computed(() => {
  const sources = [...sourceRegistry.sources.values()]
    .filter(s => s.getAvailability('resolvePlaylist').available);
  return [
    { label: '自动检测', value: 'auto' },
    ...sources.map(s => ({ label: s.name, value: s.id }))
  ];
})

/** 用 getPlaylistInfo 拉取歌单基本信息填充到 RuntimePlaylist，拉不到就 fallback */
async function buildRuntimePlaylist(ref: SourceEntityRef): Promise<RuntimePlaylist> {
  let title = '预览';
  let pic = '';

  const src = sourceRegistry.sources.get(ref.sourceType);
  if (src) {
    const infoAbility = src.getAvailability('getPlaylistInfo');
    if (infoAbility.available) {
      try {
        const info = await infoAbility.invoke(ref);
        title = info.title ?? title;
        pic = info.pic ?? pic;
      } catch (e) {
        console.warn('[PreviewDialog] getPlaylistInfo failed, using fallback', e);
      }
    }
  }

  return {
    document: {
      SchemaVersion: 2,
      title,
      pic,
      entries: [{ kind: 'playlistRef', ref }]
    },
    metadata: {
      origin: ref,
      status: { loading: false }
    }
  }
}

async function resolveRef(src: MusicSource, input: string): Promise<SourceEntityRef> {
  const parseLinkAbility = src.getAvailability('parseLink');
  if (parseLinkAbility.available) {
    const parsed = await parseLinkAbility.invoke(input);
    if (parsed) return parsed;
  }
  // fallback: 直接把输入当歌单 ID
  return { sourceType: src.id, symbol: input, type: SourceEntityType.Playlist };
}

async function preview() {
  const input = previewLink.value.trim();
  if (!input) {
    showMessage('请输入链接或 ID');
    return;
  }

  showMessage('加载中');

  try {
    if (targetPlatform.value === 'auto') {
      // 遍历所有有 parseLink 能力的 source，第一个返回非 null 的就用
      const parseLinkSources = sourceRegistry.listByCapability('parseLink');
      for (const src of parseLinkSources) {
        const ability = src.getAvailability('parseLink');
        if (!ability.available) continue;
        const ref = await ability.invoke(input);
        if (ref) {
          props.closeDialog();
          const runtimePlaylist = await buildRuntimePlaylist(ref);
          await navigateToPlaylistDetail(runtimePlaylist);
          return;
        }
      }
      showMessage('无法识别该链接，请手动选择平台');
    } else {
      const src = sourceRegistry.sources.get(targetPlatform.value);
      if (!src) {
        showMessage(`未找到源: ${targetPlatform.value}`);
        return;
      }

      const ref = await resolveRef(src, input);
      props.closeDialog();
      const runtimePlaylist = await buildRuntimePlaylist(ref);
      await navigateToPlaylistDetail(runtimePlaylist);
    }
  } catch (e: any) {
    showMessage(`预览失败: ${e?.message ?? e}`);
  }
}
</script>

<style scoped>

</style>
