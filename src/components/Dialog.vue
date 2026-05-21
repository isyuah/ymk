<template>
  <Transition
    name="uianim"
    @after-leave="onDestroy"
  >
    <div
      v-show="visible"
      class="dialogMask"
    >
      <div class="dialogContainer">
        <component
          :is="component"
          :close-dialog="handleClose"
          :data="data"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import {onMounted, ref} from 'vue'

const props = defineProps<{
  component: object, // 动态组件
  data: any, // 动态组件的 props
}>()
const visible = ref(false);

const emit = defineEmits(['close', 'destroy'])
onMounted(() => {
  visible.value = true;
})
// 关闭对话框
const handleClose = () => {
  emit('close')
}

// 销毁对话框
const onDestroy = () => {
  emit('destroy')
}
</script>

<style scoped>
.dialogMask {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 105;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.4);
}
/*
.dialogContainer {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
*/
:deep(.DEF-DIALOG-CONTENT) {
  & {
    border: 1px;
    background-color: rgba(255, 255, 255, .5);
    backdrop-filter: blur(10px);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0 0 5px rgba(255, 255, 255, .4)
  }
  .header {
      font-family: SourceSansCNM;
      font-size: 18px;
      margin-bottom: 10px;
  }
  .header {
    font-family: SourceSansCNM;
    font-size: 20px;
  }
  .footer, .content {
      margin-top: 20px;
  }
  .dialogBtn {
    transition: all .25s;
    border-radius: 8px;
    border: none;
    background-color: #18191C;
    color: #fff;
    padding: 10px 15px;
    margin: 0 5px;
  }
  .dialogBtn:active {
    scale: 0.95
  }
  .dialogBtn:hover {
    cursor: pointer;
    background-color: #28292C;
  }
  select, input {
    margin: 5px 0;
    font-family: SourceSansCNM;
    font-size: 18px;
    height: 40px;
    line-height: 40;
    padding: 5px 10px;
    /* background: transparent; */
    outline: none;
    border: none;
    box-shadow: 0 0 5px rgba(255, 255, 255, .6);
    border-radius: 8px;
  }
  .asDataLabel {
      vertical-align: text-top;
      padding-left: 2px;
  }
}
</style>