<script setup lang="ts" generic="T">
import {computed, watch, ref, useTemplateRef, onUnmounted, nextTick} from "vue";
const {
  items,
  itemHeight,
  className = "",
  size = 10,
  eventName = "virtualList-refresh"
} = defineProps<{
  items: T[],
  itemHeight: number,
  className?: string,
  size?: number,
  eventName ?: string,
}>()
defineSlots<{
  default(props: {item: T, index: number}): any
}>()
const scrollTop = ref(0);
const bufferSize = 2;
const displayingItems = computed(() => {
  return items.slice(startIndex.value, endIndex.value)
})
const startIndex = computed(() => {
  return Math.max(0, Math.floor(scrollTop.value / itemHeight) - bufferSize)
})
const endIndex = computed(() => {
  return Math.min(items.length, startIndex.value + size + 1 + bufferSize * 2);
});
const offsetTop = computed(() => {
  return startIndex.value * itemHeight;
})
const containerEl = useTemplateRef<HTMLDivElement>('container')
function handleScroll() {
  if (!containerEl.value) return;
  scrollTop.value = containerEl.value.scrollTop;
}
function refresh() {
  handleScroll()
}
watch(() => items, refresh)
</script>

<template>
  <div
    ref="container"
    :class="className"
    class="list-container"
    @scroll.passive="handleScroll"
  >
    <div
      class="list"
      :style="{transform: `translateY(${offsetTop}px)`}"
    >
      <div
        v-for="(item, index) in displayingItems"
        :key="startIndex + index"
        class="list-item"
        :style="{ height: itemHeight + 'px' }"
      >
        <slot
          :item="item"
          :index="startIndex + index"
        />
      </div>
    </div>
    <div
      class="wrapper"
      :style="{height: `${itemHeight * items.length}px`}"
    />
  </div>
</template>

<style scoped>
.list-container {
  position: relative;
  height: 100%;
  width: 100%;
  overflow-y: auto;
  will-change: scroll-position;
}
.list {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  z-index: 1;
}
.wrapper {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: -1;
}
</style>