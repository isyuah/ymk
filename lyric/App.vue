<template>
  <div
    class="container"
    :class="{
      'locked': locked,
      'not-lock': !locked,
    }"
    @mouseleave="handleMouseLeave"
  >
    <div
      v-show="!locked"
      class="header"
    >
      <div class="move">
        <svg
          t="1761045662823"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="4558"
          width="32"
          height="32"
        >
          <path
            d="M550.034286 633.904762v154.331428l58.392381-56.661333 50.95619 52.46781-144.505905 140.288-147.065904-140.01981 50.419809-52.979809 58.684953 55.832381-0.024381-153.283048h73.142857z m234.008381-269.287619l140.288 144.505905-140.01981 147.065904-52.979809-50.419809 55.832381-58.684953H633.904762v-73.142857h154.331428l-56.661333-58.368 52.46781-50.95619z m-544.231619 0l52.467809 50.95619-56.685714 58.368H390.095238v73.142857H236.690286l55.832381 58.684953-52.955429 50.419809-140.019809-147.065904 140.263619-144.505905zM514.876952 99.669333l144.505905 140.288-50.95619 52.46781-58.368-56.661333L550.034286 390.095238h-73.142857V236.81219l-58.660572 55.832381-50.419809-52.979809 147.065904-140.01981z"
            p-id="4559"
            fill="currentColor"
          />
        </svg>
      </div>
      <div class="color-picker">
        <div 
          v-for="color in colorOptions" 
          :key="color.id"
          class="color-option"
          :class="{ active: selectedColor === color.id }"
          :style="getColorStyle(color)"
          :title="color.name"
          @click="selectColor(color.id)"
        />
      </div>
      <div
        class="close"
        @click="closeWindow"
      >
        <svg
          t="1761049833903"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="8740"
          width="32"
          height="32"
        >
          <path
            d="M801.645714 170.666667l51.833905 51.590095L565.150476 511.951238l288.353524 289.670095-51.833905 51.614477-288.109714-289.450667L225.426286 853.23581 173.592381 801.621333l288.329143-289.670095L173.592381 222.256762 225.426286 170.666667l288.109714 289.426285L801.645714 170.666667z"
            p-id="8741"
            fill="currentColor"
          />
        </svg>
      </div>
      <div
        class="lock"
        @click.stop="locked = !locked"
      >
        <svg
          t="1761045992310"
          class="icon"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          p-id="8288"
          width="32"
          height="32"
        >
          <path
            d="M512.804571 73.142857a207.238095 207.238095 0 0 1 207.238096 207.238095l-0.024381 60.952381H828.952381a73.142857 73.142857 0 0 1 73.142857 73.142857v438.857143a73.142857 73.142857 0 0 1-73.142857 73.142857H195.047619a73.142857 73.142857 0 0 1-73.142857-73.142857V414.47619a73.142857 73.142857 0 0 1 73.142857-73.142857h110.494476v-60.952381a207.238095 207.238095 0 0 1 207.238095-207.238095zM828.952381 414.47619H195.047619v438.857143h633.904762V414.47619z m-273.383619 121.904762v195.047619h-73.142857v-195.047619h73.142857zM512.804571 146.285714a134.095238 134.095238 0 0 0-134.095238 134.095238V341.333333h268.190477v-60.952381a134.095238 134.095238 0 0 0-134.095239-134.095238z"
            p-id="8289"
            fill="currentColor"
          />
        </svg>
      </div>
    </div>
    <div class="lyric-container">
      <div class="original-lyric">
        {{ lyric.none ? '暂无歌词' : lyric.text.original }}
      </div>
      <div
        v-if="lyric.text.translated"
        class="translated-lyric"
      >
        {{ lyric.text.translated }}
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { computed, onMounted, ref, watch } from 'vue'
import { Lyric, LyricType } from './types';
const lyricObj = ref<any>({});
const lyric = computed<Lyric>(() => {
  const l = lyricObj.value?.lyric;
  if (!l || !l.text || l.time === -1) {
    return {
      text: {
        original: '',
        translated: '',
      },
      type: LyricType.Mix,
      none: true,
    }
  } else {
    const originalText = l.text[0] || '';
    const translatedText = l.text[1] || '';
    
    return {
      text: {
        original: originalText,
        translated: translatedText,
      },
      type: LyricType.Mix,
      none: false,
    }
  }
})
const locked = ref<boolean>(false);
const selectedColor = ref<string>('white');

const colorOptions = [
  { id: 'white', name: '纯白', value: '#ffffff' },
  { id: 'light-blue', name: '浅蓝', value: '#87ceeb' },
  { id: 'light-green', name: '浅绿', value: '#90ee90' },
  { id: 'light-purple', name: '浅紫', value: '#dda0dd' },
  { id: 'light-pink', name: '浅粉', value: '#ffb6c1' },
  { id: 'gradient-blue', name: '蓝色渐变', value: 'linear-gradient(to right, #4facfe 0%, #00f2fe 100%)' },
  { id: 'gradient-purple', name: '紫色渐变', value: 'linear-gradient(to right, #667eea 0%, #764ba2 100%)' },
  { id: 'gradient-pink', name: '粉色渐变', value: 'linear-gradient(to right, #f093fb 0%, #f5576c 100%)' },
  { id: 'gradient-green', name: '绿色渐变', value: 'linear-gradient(to right, #43e97b 0%, #38f9d7 100%)' },
  { id: 'gradient-orange', name: '橙色渐变', value: 'linear-gradient(to right, #fa709a 0%, #fee140 100%)' }
];

const selectColor = (colorId: string) => {
  selectedColor.value = colorId;
  localStorage.setItem('lyric-color', colorId);
};

const handleMouseLeave = () => {
};

const closeWindow = () => {
  // 通知主进程关闭歌词窗口
  window.ymkAPI.closeLyricWindow();
};

const getColorStyle = (color: any) => {
  // 如果是渐变色，使用background而不是backgroundColor
  if (color.value.includes('gradient')) {
    return { background: color.value };
  }
  return { backgroundColor: color.value };
};

const currentColorStyle = computed(() => {
  const selectedOption = colorOptions.find(color => color.id === selectedColor.value);
  return selectedOption ? selectedOption.value : '#ffffff';
});

const strokeColor = computed(() => {
  // 根据选中的颜色返回不同的描边颜色
  switch (selectedColor.value) {
    case 'white':
      return 'rgba(0, 0, 0, 0.8)';
    case 'light-blue':
      return 'rgba(100, 150, 200, 0.6)';
    case 'light-green':
      return 'rgba(150, 200, 150, 0.6)';
    case 'light-purple':
      return 'rgba(200, 150, 200, 0.6)';
    case 'light-pink':
      return 'rgba(255, 200, 220, 0.6)';
    case 'gradient-blue':
      return 'rgba(150, 200, 255, 0.6)';
    case 'gradient-purple':
      return 'rgba(200, 150, 255, 0.6)';
    case 'gradient-pink':
      return 'rgba(255, 180, 200, 0.6)';
    case 'gradient-green':
      return 'rgba(180, 255, 200, 0.6)';
    case 'gradient-orange':
      return 'rgba(255, 200, 150, 0.6)';
    default:
      return 'rgba(0, 0, 0, 0.8)';
  }
});

watch(locked, (newValue) => {
  window.ymkAPI.setIgnoreMouseEvents(newValue);
});

onMounted(() => {
  // 从localStorage读取保存的颜色设置
  const savedColor = localStorage.getItem('lyric-color');
  if (savedColor) {
    selectedColor.value = savedColor;
  }
  
  window.ymkAPI.onLyric((_, lyricData) => {
    // console.log(JSON.parse(lyricData))
    lyricObj.value = JSON.parse(lyricData);
  })
  
  // 监听unlock事件，解锁歌词窗口
  window.ymkAPI.unlock(() => {
    locked.value = false;
  });
  
  // 初始化时设置鼠标事件穿透
  window.ymkAPI.setIgnoreMouseEvents(locked.value);
})

</script>

<style scoped>
.container {
  width: 100vw;
  height: 100vh;
  background-color: transparent;
  transition: all .2s;
  display: flex;
  flex-direction: column;
  color: white;
  font-family: 'SourceSansCNM', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  position: relative;
}
.container.not-lock {
  -webkit-app-region: drag;
  background-color: rgba(0, 0, 0, 0.7);
}

.container .header {
  width: 100%;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 20px;
  color: rgba(255, 255, 255, 1);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
}

.container .color-picker {
  display: flex;
  gap: 8px;
  -webkit-app-region: no-drag;
}

.container .color-option {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
}

.container .color-option:hover {
  transform: scale(1.1);
  border-color: rgba(255, 255, 255, 0.8);
}

.container .color-option.active {
  border-color: rgba(255, 255, 255, 1);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.6);
}

.container .move {
  cursor: pointer;
  -webkit-app-region: drag;
}

.container .move, .container .lock, .container .close {
  width: 32px;
  height: 32px;
}

.container .lock, .container .close {
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  -webkit-app-region: no-drag;
}

.lyric-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 20px 20px 20px;
  text-align: center;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  height: 100%;
  box-sizing: border-box;
}

.original-lyric {
  font-size: 32px;
  font-weight: 500;
  margin-bottom: 10px;
  line-height: 1.4;
  -webkit-text-stroke: 1px v-bind(strokeColor);
  color: v-bind(currentColorStyle);
  background: v-bind(currentColorStyle);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.translated-lyric {
  font-size: 28px;
  color: v-bind(currentColorStyle);
  background: v-bind(currentColorStyle);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.4;
  -webkit-text-stroke: 1px v-bind(strokeColor);
}
</style>