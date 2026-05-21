<script setup lang="ts">
defineProps(['text'])

</script>

<template>
  <div class="TooltipContainer">
    <div class="tooltipText">
      {{ text }}
    </div>
    <slot />
  </div>
</template>

<style scoped>
.TooltipContainer {
  position: relative;
  width: 100%;
  height: 100%;
}
.TooltipContainer:hover .tooltipText {
  top: -100%;
  position: absolute;
  display: block;
}
.tooltipText {
  display: none;
  width: max-content;
  font-family: PingFang SC;
  background-color: rgba(0, 0, 0);
  padding: 2px 5px;
  line-height: 20px;
  color: #fff;
  z-index: 1;
}
</style>