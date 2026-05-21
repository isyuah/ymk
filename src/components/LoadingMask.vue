<template>
  <div class="loadingMaskContainer">
    <div :class="{mask: true, active: loading}" />
    <slot />
  </div>
</template>

<script setup lang='ts'>
defineProps<{
    loading: boolean
}>()
</script>

<style scoped>
.loadingMaskContainer {
    position: relative;
    max-height: 100%;
    max-width: 100%;
}
.mask {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 101;
    transition: all .2s;
    background-color: transparent;
    pointer-events: none;
}
.mask.active {
    background-color: #fff;
    pointer-events: all;
}
</style>