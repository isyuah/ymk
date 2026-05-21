<template>
  <div class="line topleft" />
  <div class="line topright" />
  <div class="line lefttop" />
  <div class="line leftbottom" />
  <div class="line righttop" />
  <div class="line rightbottom" />
  <div class="line bottomleft" />
  <div class="line bottomright" />
  <slot />
</template>
    
<script setup lang='ts'>
</script>

<style scoped>
.line {
    position: absolute;
    background-color: var(--ymk-el-color);
    opacity: 0.9;
}
.topleft {
    top: 0;
    left: 0;
    height: 1px;
    width: 30px;
}
.topright {
    top: 0;
    right: 0;
    height: 1px;
    width: 30px;
}
.bottomleft {
    bottom: 0;
    left: 0;
    height: 1.5px;
    width: 30px;
}
.bottomright {
    bottom: 0;
    right: 0;
    height: 1.5px;
    width: 30px;
}
.lefttop {
    top: 0;
    left: 0;
    height: 30px;
    width: 1px;
}
.leftbottom {
    bottom: 0;
    left: 0;
    height: 30px;
    width: 1px;
}
.righttop {
    right: 0;
    top: 0;
    height: 30px;
    width: 1.5px;
}
.rightbottom {
    bottom: 0;
    right: 0;
    height: 30px;
    width: 1.5px;
}
</style>