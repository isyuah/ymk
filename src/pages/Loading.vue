<template>
  <div class="partContainer">
    <div class="text">Loading</div>
    <div class="message">
      <TransitionGroup name="list">
        <div
            v-for="(item, index) in loadingStore.loadingStack"
            :key="index"
            class="tipMessage"
            :class="{ 'sub-item': index > 0 }"
            :style="{ '--index': index }"
        >
          <div v-if="index > 0" class="tree-line"></div>
          <div class="status-dot"></div>
          <span class="content">{{ item.text }}</span>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang='ts'>
import {useLoadingStore} from "@/stores/modules/loading";
const loadingStore = useLoadingStore();
</script>

<style scoped>
.partContainer {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: transparent;
}

.partContainer .text {
  font-family: NovecentoWide;
  font-size: 42px;
  color: var(--ymk-text-color);
  text-shadow: 0 0 10px var(--ymk-text-shadow-color);
  letter-spacing: 4px;
}

.partContainer .message {
  font-family: SourceSansCNM;
  display: flex;
  flex-direction: column;
  margin-top: 30px;
  min-width: 260px;
}

.tipMessage {
  position: relative;
  display: flex;
  align-items: center;
  padding: 8px 0;
  color: var(--ymk-text-color);
  font-size: 20px;
  transition: all 0.4s cubic-bezier(0.3, 0, 0.2, 1);
}

.sub-item {
  margin-left: 28px;
  font-size: 16px;
  opacity: calc(1 - var(--index) * 0.1);
}

.tree-line {
  position: absolute;
  left: -26px;
  top: -12px;
  width: 14px;
  height: 30px;
  border-left: 1.5px solid var(--ymk-text-color);
  border-bottom: 1.5px solid var(--ymk-text-color);
  border-bottom-left-radius: 6px;
  opacity: 0.4;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ymk-text-color);
  margin-right: 12px;
  flex-shrink: 0;
  box-shadow: 0 0 8px var(--ymk-text-shadow-color);
}

.tipMessage:last-child .status-dot {
  background: #1ce0aa;
  box-shadow: 0 0 12px #1ce0aa;
  animation: pulse 3s infinite;
}

.list-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.4); opacity: 0.6; }
  100% { transform: scale(1); opacity: 1; }
}
</style>