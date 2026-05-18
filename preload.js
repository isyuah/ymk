const {contextBridge, ipcRenderer} = require('electron')

function getLocalPlaylists() {
    return ipcRenderer.invoke('getLocalPlaylists')
}
function showAskDialog(options) {
    return ipcRenderer.invoke('showAskDialog', options)
}
function showChoosePlaylistDialog(options) {
    return ipcRenderer.invoke('showChoosePlaylistDialog', options)
}
function deletePlaylistFile(fn) {
    return ipcRenderer.invoke('deletePlaylistFile', fn)
}
function renamePlaylistFile(fn, newName) {
    return ipcRenderer.invoke('renamePlaylistFile', {fn, newName})
}
function appendToPlaylistFile(fn, song) {
    return ipcRenderer.invoke('appendToPlaylistFile', {fn, song})
}
function writePlaylistFile(filename, content) {
    return ipcRenderer.invoke('writePlaylistFile', {fn: filename, t: content})
}
function getConfig() {
    return ipcRenderer.invoke('getConfig')
}
function writeConfig(t) {
    return ipcRenderer.invoke('writeConfig', t)
}
function getSpecificConfig(fn) {
    return ipcRenderer.invoke('getSpecificConfig', fn)
}
function writeSpecificConfig(fn, t) {
    return ipcRenderer.invoke('writeSpecificConfig', fn, t)
}
function readClipboard() {
    return ipcRenderer.invoke('readClipboard')
}
function minimize() {
    ipcRenderer.send('minimize')
}
function exit(arg) {
    ipcRenderer.send('exit', arg)
}
function isMinimized() {
    return ipcRenderer.invoke('isMinimized')
}
function showImportPlaylistDialog() {
    return ipcRenderer.invoke('showImportPlaylistDialog')
}
function getCursorPos() {
    return ipcRenderer.invoke('getCursorPos')
}
function openUrl(url) {
    return ipcRenderer.invoke('openUrl', url)
}

function playPauseStatusUpdate(playing) {
    ipcRenderer.send('playPauseStatusUpdate', playing)
}

function onTrayControl_PlayPause(callback) {
    ipcRenderer.on('tray_playPause', callback)
}
function onTrayControl_PlaySong(callback) {
    ipcRenderer.on('tray_play', callback)
}
function saveSourceStorage(data) {
    return ipcRenderer.invoke('saveSourceStorage', JSON.stringify(data))
}
function readSourceStorage() {
    return ipcRenderer.invoke('readSourceStorage')
}
function loadPlugins() {
    return ipcRenderer.invoke('loadPlugins').then(list =>
        list.map(({ name, code }) => {
            const blob = new Blob([code], { type: 'text/javascript' })
            return { name, url: URL.createObjectURL(blob) }
        })
    )
}
const apis = {
    onTrayControl_PlayPause,
    onTrayControl_PlaySong,
    playPauseStatusUpdate,
    getLocalPlaylists,
    showAskDialog,
    showChoosePlaylistDialog,
    deletePlaylistFile,
    renamePlaylistFile,
    appendToPlaylistFile,
    writePlaylistFile,
    readClipboard,
    writeConfig,
    minimize,
    exit,
    getConfig,
    isMinimized,
    onRestore: callback => ipcRenderer.on('restore', (_event, value) => callback(value)),
    onRefreshPlaylists: callback => ipcRenderer.on('refreshPlaylists', (_event) => callback()),
    onShowMessage: callback => ipcRenderer.on('showMessage', (_event, m) => callback(m)),
    offRestore: callback => ipcRenderer.off('restore', callback),
    offRefreshPlaylists: callback => ipcRenderer.off('refreshPlaylists', callback),
    offShowMessage: callback => ipcRenderer.off('showMessage', callback),
    onUrlScheme: callback => ipcRenderer.on('urlScheme', callback),
    offUrlScheme: callback => ipcRenderer.off('urlScheme', callback),
    showImportPlaylistDialog,
    getCursorPos,
    getSpecificConfig,
    writeSpecificConfig,
    createLyricWindow: () => ipcRenderer.invoke('createLyricWindow'),
    closeLyricWindow: () => ipcRenderer.invoke('closeLyricWindow'),
    sendLyric: (lyric) => ipcRenderer.invoke('sendLyric', lyric),
    toggleLyricWindow: () => ipcRenderer.invoke('toggleLyricWindow'),
    openUrl,
    saveSourceStorage,
    readSourceStorage,
    loadPlugins,
}
contextBridge.exposeInMainWorld('ymkAPI', apis)
contextBridge.exposeInMainWorld('NeteaseAPI', {
    // Proxy不能被克隆，直接定义一个通用的执行函数
    call: (funcName, ...args) => {
        return ipcRenderer.invoke('NeteaseAPIProxy', {
            funcName: funcName,
            args: args
        });
    }
});
// window.ymkAPI = apis;
// window.NeteaseAPI = {
//     // Proxy不能被克隆，直接定义一个通用的执行函数
//     call: (funcName, ...args) => {
//         return ipcRenderer.invoke('NeteaseAPIProxy', {
//             funcName: funcName,
//             args: args
//         });
//     }
// };