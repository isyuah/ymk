<template>
  <div class="messageContainer">
    <Transition
      name="message"
      @after-leave="handleAfterLeave"
    >
      <div
        v-show="show && message"
        class="message"
      >
        <div class="text">
          {{ message }}
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang='ts'>

import {onMounted, ref} from "vue";

const props = defineProps({
  message: String,
  time: {
    type: Number,
    default: 4000
  }
});

const emit = defineEmits(['destroy']);
const show = ref(false);

onMounted(() => {
  show.value = true;
  setTimeout(() => {
    show.value = false;
  }, props.time);
});

function handleAfterLeave() {
  emit('destroy');
}
</script>

<style scoped>
.messageContainer {
    pointer-events: none;
    position: fixed;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    bottom: 20px;
    z-index: 102;
}
.messageContainer .message {
    max-width: 60%;
    border-radius: 6px;
    background-color: rgba(0, 0, 0, .4);
    padding: 5px 10px;
    max-height: 90px;
    overflow: hidden;
}
.messageContainer .message .text {
    font-size: 16px;
    color: #fff;
    line-height: 20px;
}
</style>