import {ipcMain, nativeImage, Tray, Menu} from 'electron'
import path from "path";
import { fileURLToPath } from 'url';
import { dirname } from 'path';

export function initTray(window, app, __dirname) {
    const dirPath = __dirname || dirname(fileURLToPath(import.meta.url));
    const tray = new Tray(path.resolve(dirPath, './logo.png'));
    const showWindow = () => {
        if (window.isDestroyed()) return;
        if (window.isMinimized()) window.restore();
        window.show();
        window.focus();
    };
    const contextMenu = Menu.buildFromTemplate([
        {
            label: '显示主窗口',
            click: showWindow,
        },
        {
            type: 'separator',
        },
        {
            label: '退出',
            click: () => {
                app.quit();
            }
        }
    ]);
    tray.setContextMenu(contextMenu);
    tray.on('click', showWindow);
    tray.on('double-click', showWindow);
    
    const thumbarButtons = [
        {
            icon: nativeImage.createFromPath(path.resolve(dirPath, './assets/controlBtnIcon/last.png')),
            tooltip: "上一首",
            click() {
                window.webContents.send('tray_play', 'last')
            }
        },
        {
            icon: nativeImage.createFromPath(path.resolve(dirPath, './assets/controlBtnIcon/play.png')),
            tooltip: "播放",
            click() {
                window.webContents.send('tray_playPause', true)
            }
        },
        {
            icon: nativeImage.createFromPath(path.resolve(dirPath, './assets/controlBtnIcon/pause.png')),
            tooltip: "暂停",
            flags: ['hidden'],
            click() {
                window.webContents.send('tray_playPause', false)
            }
        },
        {
            icon: nativeImage.createFromPath(path.resolve(dirPath, './assets/controlBtnIcon/next.png')),
            tooltip: "下一首",
            click() {
                window.webContents.send('tray_play', 'next')
            }
        }
    ]
    window.setThumbarButtons(thumbarButtons);
    ipcMain.on('playPauseStatusUpdate', (e, playing) => {
        if(playing) {
            thumbarButtons[1].flags = ['hidden']
            thumbarButtons[2].flags = []
        }
        else {
            thumbarButtons[1].flags = []
            thumbarButtons[2].flags = ['hidden']
        }
        window.setThumbarButtons(thumbarButtons)
    })
}
