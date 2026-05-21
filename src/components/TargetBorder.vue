<template>
  <div class="fixedContainer">
    <!--保证定位-->
    <Transition
      appear
      name="tb_appear"
    >
      <div class="tb_container">
        <div class="tb_b tb_left" />
        <div class="tb_b tb_right" />
        <div class="tb_b tb_top" />
        <div class="tb_b tb_bottom" />
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup lang='ts'>

</script>

<style scoped>
.fixedContainer {
    width: 182px;
    height: 182px;
}
.tb_container {
    position: relative;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 182px;
    height: 182px;
}
.tb_b {
    position: absolute;
    background-color: #343434;
}
.tb_left, .tb_right {
    height: 16%;
    width: 4px;
}
.tb_top, .tb_bottom {
    height: 4px;
    width: 16%;
}
.tb_left {
    top: 0;
    left: 0;
}
.tb_bottom {
    bottom: 0;
    right: 0;
}
.tb_right {
    right: 0;
    bottom: 0;
}
.tb_top {
    top: 0;
    left: 0;
}

.tb_appear-enter-active,
.tb_appear-leave-active {
    position: absolute;
    transition: all .3s ease-in-out;
}
.tb_appear-enter-to,
.tb_appear-leave-from {
    width: 182px;
    height: 182px;
}
.tb_appear-enter-from,
.tb_appear-leave-to {
    width: 0;
    height: 0;
}
</style>