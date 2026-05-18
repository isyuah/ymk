<template>
    <div class="line topleft"></div>
    <div class="line topright"></div>
    <div class="line lefttop"></div>
    <div class="line leftbottom"></div>
    <div class="line righttop"></div>
    <div class="line rightbottom"></div>
    <div class="line bottomleft"></div>
    <div class="line bottomright"></div>
    <slot></slot>
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