<template>
  <div
    class="custom-select"
    :class="{ 'is-open': isOpen, 'is-disabled': disabled }"
  >
    <div
      class="select-trigger"
      @click="toggleDropdown"
    >
      <span class="selected-value">{{ selectedLabel }}</span>
      <span class="select-arrow">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </span>
    </div>
    <Transition name="dropdown">
      <div
        v-show="isOpen"
        class="options-container"
      >
        <ul class="options-list">
          <li 
            v-for="option in options" 
            :key="option.value" 
            class="option-item" 
            :class="{ 'is-selected': modelValue === option.value }"
            @click="selectOption(option)"
          >
            {{ option.label }}
          </li>
        </ul>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

// 定义选项接口
interface SelectOption {
  value: string | number;
  label: string;
}

const props = defineProps({
  options: {
    type: Array as () => SelectOption[],
    required: true,
    validator: (value: SelectOption[]) => {
      return value.every(option => 'value' in option && 'label' in option);
    }
  },
  placeholder: {
    type: String,
    default: '请选择'
  },
  disabled: {
    type: Boolean,
    default: false
  }
});


const isOpen = ref(false);
const modelValue = defineModel<string | number>();
const selectedLabel = computed(() => {
  const selectedOption = props.options.find(option => option.value === modelValue.value);
  return selectedOption ? selectedOption.label : props.placeholder;
});

// 切换下拉菜单状态
const toggleDropdown = () => {
  if (!props.disabled) {
    isOpen.value = !isOpen.value;
  }
};

// 选择选项
const selectOption = (option: SelectOption) => {
  modelValue.value = option.value;
  isOpen.value = false;
};

// 点击外部关闭下拉菜单
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  const selectElement = document.querySelector('.custom-select');
  if (selectElement && !selectElement.contains(target)) {
    isOpen.value = false;
  }
};

// 挂载和卸载时添加/移除事件监听器
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.custom-select {
  position: relative;
  font-family: SourceSansCNM;
  font-size: 18px;
  width: 100%;
  display: inline-block;
  user-select: none;
}
.options-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
}
.options-container::-webkit-scrollbar-track {
  display: none;
}

.select-trigger {
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  height: 40px;
  padding: 5px 15px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.25s ease;
}

.is-open .select-trigger {
  border-radius: 8px 8px 0 0;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
}

.select-arrow {
  transition: transform 0.3s ease;
}

.is-open .select-arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  transform: rotate(180deg);
}

.options-container {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  max-height: 200px;
  overflow-y: auto;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 0 0 8px 8px;
  /* box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); */
  box-shadow: 0 0 5px rgba(255, 255, 255, 0.6);
  z-index: 10;
}

.options-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.option-item {
  padding: 10px 15px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.option-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.option-item.is-selected {
  background-color: rgba(0, 0, 0, 0.1);
}

/* 禁用状态 */
.is-disabled .select-trigger {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 下拉动画 */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style> 