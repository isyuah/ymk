<template>
  <div class="paginationContainer">
    <div
      v-show="groupCount > 1 && nowGroup > 0"
      class="pageControllerEl lastGroup"
      @click="lastGroup"
    >
      <svg
        fill="currentColor"
        t="1711786159876"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="5135"
        width="48"
        height="48"
      ><path
        d="M568.8 8c-16.8 0-31.2 9.6-40 21.6-0.8 0.8-3.2 0.8-4.8 2.4L57.6 499.2c-7.2 7.2-7.2 18.4 0 25.6l466.4 466.4c1.6 1.6 3.2 1.6 4.8 2.4 8.8 13.6 23.2 23.2 40.8 23.2 27.2 0 48.8-21.6 48.8-48.8 0-12-4.8-23.2-12.8-32l0.8-0.8-408.8-410.4c-7.2-7.2-7.2-18.4 0-25.6l406.4-407.2 3.2-3.2-0.8-0.8c7.2-8.8 12-20 12-32 0-26.4-21.6-48-49.6-48z m314.4 22.4c-1.6 0.8-3.2 0.8-4.8 2.4L411.2 499.2c-7.2 7.2-7.2 18.4 0 25.6l466.4 466.4c1.6 1.6 3.2 1.6 4.8 2.4 8.8 13.6 23.2 23.2 40.8 23.2 27.2 0 48.8-21.6 48.8-48.8 0-12-4.8-23.2-12.8-32l0.8-0.8-409.6-410.4c-7.2-7.2-7.2-18.4 0-25.6l406.4-406.4 3.2-3.2-0.8-0.8c7.2-8.8 12-20 12-32 0-27.2-21.6-48.8-48.8-48.8-16 0-30.4 9.6-39.2 22.4z"
        p-id="5136"
      /></svg>
    </div>
    <div
      v-show="nowPage > 1"
      class="pageControllerEl lastPage"
      @click="lastPage"
    >
      <svg
        fill="currentColor"
        t="1711786185057"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="5635"
        width="48"
        height="48"
      ><path
        d="M792.8 944c16.8 16.8 16.8 43.2 0 60-16.8 16.8-43.2 16.8-59.2 0L231.2 544c-8.8-8.8-12.8-20.8-12-32-0.8-11.2 3.2-23.2 12-32L732.8 20C749.6 3.2 776 3.2 792 20c16.8 16.8 16.8 43.2 0 60L320.8 512l472 432z"
        p-id="5636"
      /></svg>
    </div>
    <div class="pages">
      <div
        v-for="c in countInGroup"
        v-show="c + nowGroup * countInGroup <= pageCount"
        :key="c"
        :class="{pageBlock: true, active: nowPage === c + nowGroup * countInGroup}"
        @click="pageBlockClick(c + nowGroup * countInGroup)"
      >
        {{ c + nowGroup * countInGroup }}
      </div>
    </div>
    <div
      v-show="nowPage < pageCount"
      class="pageControllerEl nextPage"
      @click="nextPage"
    >
      <svg
        fill="currentColor"
        t="1711786178055"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="5469"
        width="48"
        height="48"
      ><path
        d="M233.6 938.4c-19.2 17.6-19.2 46.4 0 64s49.6 17.6 68 0l488-458.4c9.6-8.8 14.4-20.8 14.4-32 0-0.8-0.8-1.6-0.8-2.4 0-4.8-0.8-9.6-3.2-14.4-0.8-1.6-1.6-2.4-2.4-4-2.4-4-4-8-8-11.2l-488-458.4c-19.2-17.6-49.6-17.6-68 0-19.2 17.6-19.2 46.4 0 64L688 512l-454.4 426.4z"
        p-id="5470"
      /></svg>
    </div>
    <div
      v-show="groupCount > 1 && nowGroup < groupCount - 1"
      class="pageControllerEl nextGroup"
      @click="nextGroup"
    >
      <svg
        fill="currentColor"
        t="1711786171785"
        class="icon"
        viewBox="0 0 1024 1024"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        p-id="5301"
        width="48"
        height="48"
      ><path
        d="M455.2 8c-27.2 0-49.6 22.4-49.6 49.6 0 12 4.8 23.2 12 32l-0.8 0.8 2.4 2.4 406.4 407.2c7.2 7.2 7.2 18.4 0 25.6L416 935.2l0.8 0.8c-8 8.8-12.8 20-12.8 32 0 27.2 22.4 49.6 49.6 49.6 17.6 0 32-9.6 40.8-23.2 1.6-0.8 3.2-0.8 4.8-1.6l466.4-466.4c7.2-7.2 7.2-18.4 0-25.6L500.8 32.8c-1.6-1.6-3.2-1.6-5.6-2.4C486.4 17.6 472 8 455.2 8zM100.8 8C73.6 8 52 30.4 52 57.6c0 12 4.8 23.2 12 32l-0.8 0.8 2.4 2.4L472 500c7.2 7.2 7.2 18.4 0 25.6l-408.8 408 0.8 0.8c-7.2 8.8-12.8 20-12.8 32 0 27.2 21.6 49.6 49.6 49.6 17.6 0 32-9.6 40.8-23.2 1.6-0.8 3.2-0.8 4.8-1.6l466.4-466.4c7.2-7.2 7.2-18.4 0-25.6L146.4 32.8c-1.6-1.6-3.2-1.6-5.6-2.4-8.8-12.8-23.2-22.4-40-22.4z"
        p-id="5302"
      /></svg>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { minmax } from '@/utils/u';
import { computed, ref, watch } from 'vue';

let props = withDefaults(
    defineProps<{
        total?: number,
        countInGroup?: number
        countInPage?: number
    }>(), {
    total: 0,
    countInGroup: 5,
    countInPage: 30,
})
let pageCount = computed(() => Math.ceil(props.total / props.countInPage))
let groupCount = computed(() => Math.ceil(pageCount.value / props.countInGroup));
let nowGroup = defineModel<number>('group', {required: true});
let nowPage = defineModel<number>({required: true});
watch(() => props.total, () => {
    console.log(props.total, pageCount.value, groupCount.value, nowPage.value, nowGroup.value);
})
function nextPage() {
    if (!(nowPage.value % props.countInGroup)) {
        nowGroup.value++;
        nowPage.value++;
    }else {
        nowPage.value++;
    }
    emit('changePage');
}
function nextGroup() {
    nowGroup.value++;
    nowPage.value=Math.min(nowPage.value+props.countInGroup, pageCount.value);
    emit('changePage');
}
function lastPage() {
    if ((nowPage.value % props.countInGroup) === 1) {
        nowGroup.value--;
        nowPage.value--;
    }else {
        nowPage.value--;
    }
    emit('changePage');
}
function lastGroup() {
    nowGroup.value--;
    nowPage.value=Math.max(nowPage.value-props.countInGroup, 1);
    emit('changePage');
}
function pageBlockClick(to: number) {
    nowPage.value = minmax(to, 1, pageCount.value);
    emit('changePage');
}
let emit = defineEmits(['changePage'])
</script>

<style scoped>
.paginationContainer {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ymk-text-color);
}
.pages {
    display: flex;
    height: 34px;
}
.pages .pageBlock {
    width: 34px;
    height: 34px;
    margin: 0 5px;
    text-align: center;
    font-size: 20px;
    padding: 5px;
    line-height: 24px;
    transition: all .15s;
}
.pages .pageBlock:hover, .pageControllerEl:hover {
    background-color: rgba(0,0,0,.3);
    color: #fff;
}
.pageControllerEl {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 34px;
    width: 34px;
    transition: all .2s;
}
svg {
    width: 24px;
    height: 24px;
}
.pages .pageBlock.active {
  background-color: rgba(0,0,0,.4);
    color: #fff;
}
</style>