<template>
<div ref="mouseMenuContainer" class="mouseMenuContainer forbidSelect">
    <div class="menulist">
        <div v-show="m.show ?? true" @click="handleClick(m)"
             v-for="m in menuItems" class="menuItem">
            {{ m.title }}
        </div>
    </div>
</div>
</template>

<script setup lang='ts' generic="T">


import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import type {ContextMenuItem} from "@/types";

const props = defineProps<{
  menuItems: ContextMenuItem<T>[]
  position: { left: number; top: number }
  args?: T
}>()

const emit = defineEmits(['close'])
const mouseMenuContainer = ref<HTMLDivElement>()
const adjustPosition = () => {
  if (!mouseMenuContainer.value) return
  const container = mouseMenuContainer.value!
  const { innerWidth, innerHeight } = window
  // 水平调整
  if (props.position.left + container.offsetWidth > innerWidth) {
    container.style.left = `${props.position.left - container.offsetWidth}px`
  } else {
    container.style.left = `${props.position.left}px`
  }

  // 垂直调整
  if (props.position.top + container.offsetHeight > innerHeight) {
    container.style.top = `${props.position.top - container.offsetHeight}px`
  } else {
    container.style.top = `${props.position.top}px`
  }
}

// 菜单点击处理
const handleClick = async (item: ContextMenuItem<T>) => {
  const result = await item.action?.(props.args!)
  emit('close', item, result)
}

// 点击外部关闭
const clickHandler = (e: MouseEvent) => {
  if (!mouseMenuContainer.value?.contains(e.target as Node)) {
    emit('close')
  }
}

onMounted(() => {
  adjustPosition()
  document.addEventListener('click', clickHandler)
})

onUnmounted(() => {
  document.removeEventListener('click', clickHandler)
})
</script>

<style scoped>
@keyframes menu-show {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
.mouseMenuContainer {
  animation: menu-show 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
  border-radius: 4px;
  z-index: 99999;
  position: fixed;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(255, 255, 255, .15);
  backdrop-filter: blur(4px) saturate(110%);
  min-width: 100px;
  font-family: "PingFang SC";
}
.menuItem {
  text-align: center;
  padding: 5px 15px;
  font-size: 16px;
  color: white;
  line-height: 30px;
  transition: all .25s;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
.menuItem:hover {
  cursor: pointer;
  background-color: rgba(255, 255, 255, .2);
}
</style>