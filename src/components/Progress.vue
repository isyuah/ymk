<template>
  <div
    ref="progresscontainer"
    class="progressbar"
    @click="handleProgressClick"
  >
    <div
      ref="progressfill"
      class="progressfill"
      :style="{width: `${progress}%`}"
    />
    <div
      ref="progresstip"
      class="progresstip"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';

const {
  tipProgress = false
} = defineProps<{
  tipProgress?: boolean,
  progress: number
}>()
const emit = defineEmits(['pclick'])
onMounted(() => {
  if (tipProgress) {
    progresscontainer.value!.addEventListener('mousemove', handleMouseMove)
    progresscontainer.value!.addEventListener('mouseleave', handleMouseLeave)
  }else {
    progresscontainer.value!.removeEventListener('mousemove', handleMouseMove)
    progresscontainer.value!.removeEventListener('mouseleave', handleMouseLeave)
  }
})
onBeforeUnmount(() => {
  progresscontainer.value!.removeEventListener('mousemove', handleMouseMove)
  progresscontainer.value!.removeEventListener('mouseleave', handleMouseLeave)
})
const progresstip = useTemplateRef('progresstip')
const progresscontainer = useTemplateRef('progresscontainer')
const progressfill = useTemplateRef('progressfill')
defineExpose({
  progresstip,
  progresscontainer,
  progressfill
})
function handleProgressClick(e: MouseEvent) {
  const rect = progresscontainer.value!.getBoundingClientRect()
  const target = (e.clientX - rect.left) / rect.width
  emit('pclick', target, e.clientX - rect.left, rect.width)
}
function handleMouseMove(e: MouseEvent) {
  const rect = progresscontainer.value!.getBoundingClientRect()
  const target = (e.clientX - rect.left) / rect.width * 100
  progresstip.value!.style.width = `${target}%`
}
function handleMouseLeave() {
  progresstip.value!.style.width = `0`
}
</script>

<style scoped>
.progressbar {
  cursor: pointer;
  overflow: hidden;
  height: 4px;
  border-radius: 4px;
  filter: drop-shadow(0 0 5px #999);
  background-color: #999;
}
.progressbar .progressfill {
  transition: width .2s;
  border-radius: 4px;
  height: 100%; 
  background-color: #fff;
}
.progressbar .progresstip {
  height: 100%;
  background-color: #ccc;
  z-index: -1;
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 4px;
}
</style>