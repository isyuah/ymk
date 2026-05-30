import {app, BrowserWindow, dialog, ipcMain, net, protocol, screen} from 'electron'
import path from 'path';
import {fileURLToPath, pathToFileURL} from 'url';
import {checkFolders, checkResources} from "./utils/utils.js";
import {getListsDir, getPluginsDir, getResDir} from "./utils/paths.js";
import {startService} from './KuGouMusicApi/server.js'
import express from "express";
import process from 'process';
import axios from "axios";
import {initTray} from "./utils/tray.js";
import * as NeteaseAPIModules from 'NeteaseCloudMusicApi';
const NeteaseAPI = NeteaseAPIModules.default;
import {
    deletePlaylistFile,
    getConfig,
    getLocalPlaylists,
    getSpecificConfig, openUrl,
    readClipboard,
    showAskDialog,
    showChoosePlaylistDialog,
    writeConfig,
    writePlaylistFile,
    writeSpecificConfig,
    readSourceStorage,
    saveSourceStorage,
    renamePlaylistFile,
    appendToPlaylistFile
} from "./functions.js";
import fs from "node:fs";

try {
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 统一开发与生产的 userData 目录（如 AppData/Roaming/yumuzk），需在任何 getPath('userData') 之前调用
app.setName('yumuzk');

let mainWindow = null;
let lyricWindow = null;

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
    app.quit()
} else {
    app.on('second-instance', (event, commandLine, _workingDirectory, _additionalData) => {
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore()
            mainWindow.focus()
        }
        const surl = commandLine.pop()
        mainWindow.webContents.send('urlScheme', surl.substring(9, surl.length - 1));
    })

    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('yumuzk', process.execPath, [path.resolve(process.argv[1])])
        }else {
            app.setAsDefaultProtocolClient('yumuzk')
        }
    }
    // 两个服务：
    // 35652: 代理
    // 35653: 酷狗
    startService()
    const proxyServer = express()
    proxyServer.use(express.json())
    proxyServer.post('/', async (req, res) => {
        try {
            console.log(req.body.headers)
            const res_1 = await axios({
                url: req.body.url,
                method: req.body.method,
                headers: req.body.headers,
                data: req.body.data,
                params: req.body.params,
                responseType: 'stream'
            });
            if (res_1.headers['set-cookie']) {
                res.setHeader('x-set-cookies', JSON.stringify(res_1.headers['set-cookie']));
            }
            Object.keys(res_1.headers).forEach(key => {
                res.header(key, res_1.headers[key]);
            });
            if (res_1.headers['content-type'] && res_1.headers['content-type'].includes('application/json')) {
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
            }
            res.status(res_1.status);
            res_1.data.pipe(res)
        } catch (err) {
            console.trace(err, '@proxyError');
            res.status(500).send(err);
        }
    })
    proxyServer.listen(35652)

    checkFolders([getResDir(), getListsDir()])
    checkResources()

    // 自定义协议，给local源
    app.whenReady().then(() => {
        protocol.handle('local-music://', (req) => {
            const fp = decodeURIComponent(req.url.replace('local-music://', ''));
            return net.fetch(pathToFileURL(fp).href)
        })
    })


    const createWindow = () => {
        mainWindow = new BrowserWindow({
            menuBarVisible: false,
            titleBarStyle: 'hidden',
            height: 720,
            width: 1080,
            webPreferences: {
                preload: path.resolve(__dirname, './preload.js'),
                webSecurity: false,
            },
            resizable: false,
        })
        ipcMain.handle('getLocalPlaylists', getLocalPlaylists)
        ipcMain.handle('showAskDialog', showAskDialog)
        ipcMain.handle('showChoosePlaylistDialog', showChoosePlaylistDialog)
        ipcMain.handle('deletePlaylistFile', deletePlaylistFile)
        ipcMain.handle('renamePlaylistFile', renamePlaylistFile)
        ipcMain.handle('appendToPlaylistFile', appendToPlaylistFile)
        ipcMain.handle('writePlaylistFile', writePlaylistFile)
        ipcMain.handle('getConfig', getConfig)
        ipcMain.handle('writeConfig', writeConfig)
        ipcMain.handle('getSpecificConfig', getSpecificConfig)
        ipcMain.handle('writeSpecificConfig', writeSpecificConfig)
        ipcMain.handle('readClipboard', readClipboard)
        ipcMain.handle('isMinimized', () => mainWindow.isMinimized())
        ipcMain.handle('getCursorPos', getCursorPos)
        ipcMain.handle('openUrl', openUrl)
        ipcMain.handle('showImportPlaylistDialog', showImportPlaylistDialog);
        ipcMain.handle('createLyricWindow', createLyricWindow);
        ipcMain.handle('closeLyricWindow', () => lyricWindow.close());
        ipcMain.handle('readSourceStorage', readSourceStorage);
        ipcMain.handle('saveSourceStorage', saveSourceStorage);
        ipcMain.handle('loadPlugins', () => {
            const pluginDir = getPluginsDir()
            if (!fs.existsSync(pluginDir)) return []
            return fs.readdirSync(pluginDir)
                .filter(f => f.endsWith('.js'))
                .map(f => {
                    const code = fs.readFileSync(path.join(pluginDir, f), 'utf-8');
                    return {
                        name: f,
                        code,
                    }
                })
        });
        ipcMain.handle('toggleLyricWindow', () => {
            if (lyricWindow) {
                if (lyricWindow.isVisible()) {
                    lyricWindow.hide();
                } else {
                    lyricWindow.show();
                    lyricWindow.webContents.send('unlock');
                }
            } else {
                createLyricWindow();
            }
        });
        ipcMain.handle('sendLyric', (_, lyric) => lyricWindow?.webContents.send('lyric', lyric))
        ipcMain.handle('setIgnoreMouseEvents', (_, ignore) => {
            if (lyricWindow) {
                lyricWindow.setIgnoreMouseEvents(ignore, { forward: true });
            }
        });

        ipcMain.handle('NeteaseAPIProxy', async (event, {funcName, args}) => {
            if (typeof NeteaseAPI[funcName] === 'function') {
                try {
                    return await NeteaseAPI[funcName](...args);
                } catch (e) {
                    return {
                        error: true,
                        message: e.message
                    }
                }
            }
            console.warn(`NeteaseAPI[${funcName}] not found`);
            throw new Error(`NeteaseAPI[${funcName}] not found`);
        })

        ipcMain.on('minimize', () => mainWindow.minimize());
        ipcMain.on('exit', () => {
            const config = getConfig();
            try {
                if (config.config.minimizeToTray) {
                    mainWindow.hide();
                } else {
                    mainWindow.close();
                }
            } catch (e) {
                console.error(e);
                mainWindow.close();
            }
        })
        mainWindow.on('restore', () => mainWindow.webContents.send('restore'))

        mainWindow.on('closed', () => {
            if (lyricWindow && !lyricWindow.isDestroyed()) {
                lyricWindow.close();
            }
        })

        initTray(mainWindow, app, __dirname)

        if (app.isPackaged) {
            mainWindow.loadFile(path.resolve(__dirname, './dist', 'index.html'))
        }else {
            mainWindow.loadURL('http://localhost:5201')
        }
    }

    const createLyricWindow = () => {
        if (lyricWindow) {
            lyricWindow.show();
            return;
        }

        lyricWindow = new BrowserWindow({
            menuBarVisible: false,
            titleBarStyle: 'hidden',
            frame: false,
            transparent: true,
            height: 180,
            width: 1000,
            alwaysOnTop: true,
            maximizable: false,
            minimizable: false,
            skipTaskbar: true,
            webPreferences: {
                preload: path.resolve(__dirname, './lyric/preload.js'),
                webSecurity: false,
            },
            resizable: false,
        })

        lyricWindow.on('closed', () => {
            lyricWindow = null;
        });

        if (app.isPackaged) {
            lyricWindow.loadFile(path.resolve(__dirname, './dist', 'lyric.html'))
        }else {
            lyricWindow.loadURL('http://localhost:5201/lyric.html')
        }
    }

    app.whenReady().then(() => {
        createWindow();
        app.on('activate', ()=>{
            if (BrowserWindow.getAllWindows().length === 0) createWindow()
        })
    })

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') {
            app.quit()
        }
    })


}

function showImportPlaylistDialog() {
    dialog.showOpenDialog({
        title: '请选择歌单文件',
        filters: [{
            name: 'JSON',
            extensions: ['json']
        }],
        properties : ['multiSelections']
    }).then(({canceled, filePaths}) => {
        if (canceled) return;
        let tasks = filePaths.map(fp => new Promise((resolve, reject) => {
            try {
                fs.copyFileSync(fp, path.join(getListsDir(), path.basename(fp)))
                resolve();
            } catch(err) {
                reject(err)
            }
        }))
        Promise.all(tasks).catch((e) => mainWindow.webContents.send('showMessage', e.message)).finally(() => {
            mainWindow.webContents.send('refreshPlaylists')
        })
    })
}

function getCursorPos() {
    let sp = screen.getCursorScreenPoint();
    let wp = mainWindow.getPosition()
    return {
        left: sp.x - wp[0],
        top: sp.y - wp[1],
    };
}
} catch(e) {
    console.error(e);
    process.exit(1)
}
