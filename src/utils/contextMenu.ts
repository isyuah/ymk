import {type App, createApp} from 'vue'
import MouseMenu from '@/components/MouseMenu.vue'
import type {ContextMenuItem} from "@/types";

let currentApp: App<Element> | null = null
let containerEl: HTMLElement | null = null

type ContextMenuResult<T> =
  | {
  item: ContextMenuItem<T>,
  result?: any;
} | {
  item: null
}

export async function showContextMenu<T>(options: {
  items: ContextMenuItem<T>[]
  args?: T
  position?: { left: number; top: number }
}): Promise<ContextMenuResult<T>> {
  const {promise, resolve} = Promise.withResolvers<ContextMenuResult<T>>();
  if (options.items.filter(i => i.show ?? true).length === 0) {
    resolve({item: null})
  }
  currentApp?.unmount()
  containerEl?.remove()
  currentApp = null
  const position = options.position || (await window.ymkAPI.getCursorPos())
  containerEl = document.createElement('div')
  document.body.appendChild(containerEl)
  currentApp = createApp(MouseMenu, {
    menuItems: options.items,
    args: options.args,
    position: {
      left: position.left,
      top: position.top
    },
    onClose: (item: ContextMenuItem<T>, data: any) => {
      resolve({
        item: item,
        result: data
      })
      currentApp?.unmount()
      currentApp = null
      containerEl?.remove()
    }
  })
  currentApp.mount(containerEl)
  return promise;
}