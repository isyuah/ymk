<script setup lang="ts">
import SourceAuthCard from "@/components/Login/SourceAuthCard.vue";
import { sourceRegistry } from "@/sources/registry";

const authSources = sourceRegistry.filter(s => !!s.auth);
</script>

<template>
  <div class="UserCenterContainer">
    <SourceAuthCard
      v-for="source in authSources"
      :key="source.id"
      :source="source"
    />
  </div>
</template>

<style scoped>
.UserCenterContainer {
  overflow-y: auto;
  width: 100%;
  height: 100%;
  color: var(--ymk-text-color);
}

:deep(.userContainer) {
  & {
    padding: 20px;
    background-color: rgba(255, 255, 255, .3);
    backdrop-filter: blur(8px) saturate(180%);
    margin: 20px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, .4);
    box-shadow: 0 0 8px rgba(255, 255, 255, .35);
  }
  & .title {
    color: #000;
    font-size: 32px;
    margin-bottom: 18px;
    font-weight: bold;
  }
  & .unloginTab {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
  & .loginBtn {
    color: #000;
    display: flex;
    justify-content: center;
    align-items: center;
    outline: 0;
    background-color: transparent;
    border: 0;
    /* font-weight: bold; */
    height: 45px;
    font-size: 20px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all .25s;
  }
  & .loginBtn:after {
    box-sizing: border-box;
    border: 1px solid transparent;
    content: "";
    position: absolute;
    height: 100%;
    width: 0;
    top: 0;
    left: 0;
    transition: all .25s;
    border-right: 0;
  }
  & .loginBtn:hover::after {
    border: 1px solid #000;
    width: 50%;
    border-right: 0;
  }
  & .loginBtn:before {
    box-sizing: border-box;
    border: 1px solid transparent;
    content: "";
    position: absolute;
    height: 100%;
    width: 0;
    top: 0;
    right: 0;
    transition: all .25s;
    border-left: 0;
  }
  & .loginBtn:hover::before {
    border: 1px solid #000;
    border-left: 0;
    width: 50%;
  }
}
</style>