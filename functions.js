import fs from "node:fs";
import path from "node:path";
import {clipboard, dialog, shell} from "electron";

export function getLocalPlaylists() {
  const lists = fs.readdirSync(path.resolve('./res/lists')).filter(file => file.endsWith('.json'))
  let results = []
  for (let f of lists) {
    results.push({
      ...JSON.parse(fs.readFileSync(path.resolve('./res/lists', f)).toString()),
      originFilename: f,
    })
  }
  return results;
}
export function showChoosePlaylistDialog(_, options) {
  return dialog.showOpenDialogSync(options)
}
export function showAskDialog(_, options) {
  return dialog.showMessageBoxSync({
    buttons: ['取消', '确认'],
    ...options
  })
}
export function writePlaylistFile(_, {fn, t}) {
  return fs.writeFileSync(path.resolve('./res/lists', fn), JSON.stringify(t))
}
export function deletePlaylistFile(_, fn) {
  return fs.rmSync(path.resolve('./res/lists', fn))
}
export function renamePlaylistFile(_, {fn, newName}) {
  const filePath = path.resolve('./res/lists', fn)
  const content = JSON.parse(fs.readFileSync(filePath).toString())
  content.title = newName
  fs.writeFileSync(filePath, JSON.stringify(content))
}
export function appendToPlaylistFile(_, {fn, song}) {
  const filePath = path.resolve('./res/lists', fn)
  const content = JSON.parse(fs.readFileSync(filePath).toString())
  if (content.entries?.[0]?.kind === 'inlineSongs') {
    content.entries[0].songs.unshift(song)
  } else {
    content.entries.unshift({ kind: 'inlineSongs', songs: [song] })
  }
  fs.writeFileSync(filePath, JSON.stringify(content))
}
export function getConfig() {
  return JSON.parse(fs.readFileSync(path.resolve('./res', 'config.json')).toString())
}
export function writeConfig(_, config) {
  return fs.writeFileSync(path.resolve('./res', 'config.json'), config)
}
export function getSpecificConfig(_, fn) {
  return JSON.parse(fs.readFileSync(path.resolve('./res', `${fn}.json`)).toString())
}
export function writeSpecificConfig(_, fn, config) {
  return fs.writeFileSync(path.resolve('./res', `${fn}.json`), config)
}
export function readClipboard() {
  return clipboard.readText();
}
export function openUrl(_, url) {
  shell.openExternal(url)
}

export function saveSourceStorage(_, data) {
  return fs.writeFileSync(path.resolve("./res", "source-storage.json"), data)
}
export function readSourceStorage() {
  try {
    return JSON.parse(fs.readFileSync(path.resolve("./res", "source-storage.json")).toString())
  } catch (e) {
    console.warn(e.message)
    return {}
  }
}
