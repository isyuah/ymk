<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

type Placement = 'auto' | 'top' | 'bottom' | 'left' | 'right'
type RealPlacement = Exclude<Placement, 'auto'>

const {
  text,
  placement = 'auto',
  offset = 8,
  viewportPadding = 8,
} = defineProps<{
  text: string
  placement?: Placement
  offset?: number
  viewportPadding?: number
}>()

const triggerRef = ref<HTMLElement | null>(null)
const tooltipRef = ref<HTMLElement | null>(null)

const visible = ref(false)
const ready = ref(false)
const currentPlacement = ref<RealPlacement>('top')

const tooltipStyle = ref<Record<string, string>>({})

let listenerAttached = false

function getPosition(
  placement: RealPlacement,
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
) {
  const centerX = triggerRect.left + triggerRect.width / 2
  const centerY = triggerRect.top + triggerRect.height / 2

  switch (placement) {
    case 'top':
      return {
        top: triggerRect.top - tooltipRect.height - offset,
        left: centerX - tooltipRect.width / 2,
      }

    case 'bottom':
      return {
        top: triggerRect.bottom + offset,
        left: centerX - tooltipRect.width / 2,
      }

    case 'left':
      return {
        top: centerY - tooltipRect.height / 2,
        left: triggerRect.left - tooltipRect.width - offset,
      }

    case 'right':
      return {
        top: centerY - tooltipRect.height / 2,
        left: triggerRect.right + offset,
      }
  }
}

function isFullyVisible(
  position: { top: number; left: number },
  tooltipRect: DOMRect,
) {
  return (
    position.left >= viewportPadding &&
    position.top >= viewportPadding &&
    position.left + tooltipRect.width <= window.innerWidth - viewportPadding &&
    position.top + tooltipRect.height <= window.innerHeight - viewportPadding
  )
}

function clampPosition(
  position: { top: number; left: number },
  tooltipRect: DOMRect,
) {
  const maxLeft = window.innerWidth - tooltipRect.width - viewportPadding
  const maxTop = window.innerHeight - tooltipRect.height - viewportPadding

  return {
    left: Math.min(
      Math.max(position.left, viewportPadding),
      Math.max(maxLeft, viewportPadding),
    ),
    top: Math.min(
      Math.max(position.top, viewportPadding),
      Math.max(maxTop, viewportPadding),
    ),
  }
}

function updatePosition() {
  const trigger = triggerRef.value
  const tooltip = tooltipRef.value

  if (!trigger || !tooltip) return

  const triggerRect = trigger.getBoundingClientRect()
  const tooltipRect = tooltip.getBoundingClientRect()

  const placements: RealPlacement[] =
    placement === 'auto'
      ? ['top', 'bottom', 'left', 'right']
      : [placement]

  let finalPlacement = placements[0]
  let finalPosition = getPosition(finalPlacement, triggerRect, tooltipRect)

  for (const item of placements) {
    const position = getPosition(item, triggerRect, tooltipRect)

    if (isFullyVisible(position, tooltipRect)) {
      finalPlacement = item
      finalPosition = position
      break
    }
  }

  const clampedPosition = clampPosition(finalPosition, tooltipRect)

  currentPlacement.value = finalPlacement
  tooltipStyle.value = {
    top: `${Math.round(clampedPosition.top)}px`,
    left: `${Math.round(clampedPosition.left)}px`,
  }

  ready.value = true
}

function addListeners() {
  if (listenerAttached) return

  window.addEventListener('resize', updatePosition)
  window.addEventListener('scroll', updatePosition, true)

  listenerAttached = true
}

function removeListeners() {
  if (!listenerAttached) return

  window.removeEventListener('resize', updatePosition)
  window.removeEventListener('scroll', updatePosition, true)

  listenerAttached = false
}

async function show() {
  visible.value = true
  ready.value = false

  await nextTick()

  updatePosition()
  addListeners()
}

function hide() {
  visible.value = false
  ready.value = false
  removeListeners()
}

watch(
  () => [text, placement, offset, viewportPadding],
  async () => {
    if (!visible.value) return

    await nextTick()
    updatePosition()
  },
)

onBeforeUnmount(() => {
  removeListeners()
})
</script>

<template>
  <div
    ref="triggerRef"
    class="tooltip-trigger"
    @mouseenter="show"
    @mouseleave="hide"
    @focusin="show"
    @focusout="hide"
  >
    <slot />
  </div>

  <Teleport to="body">
    <div
      v-if="visible"
      ref="tooltipRef"
      class="tooltip-content"
      :class="[
        `is-${currentPlacement}`,
        {
          'is-ready': ready,
        },
      ]"
      :style="tooltipStyle"
      role="tooltip"
    >
      {{ text }}
    </div>
  </Teleport>
</template>

<style scoped>
.tooltip-trigger {
  display: inline-flex;
  align-items: center;
}

.tooltip-content {
  position: fixed;
  z-index: 9999;

  width: max-content;
  max-width: min(260px, calc(100vw - 16px));

  padding: 4px 8px;
  border-radius: 4px;

  background: rgba(0, 0, 0, 0.86);
  color: #fff;

  font-size: 12px;
  line-height: 1.5;
  font-family: PingFang SC, system-ui, sans-serif;

  overflow-wrap: break-word;
  pointer-events: none;

  opacity: 0;
  transition: opacity 0.12s ease;
}

.tooltip-content.is-ready {
  opacity: 1;
}
</style>