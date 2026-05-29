import fs from "node:fs";
import path from "node:path";
import {clipboard, dialog, shell} from "electron";
import {getResDir, getListsDir} from "./utils/paths.js";

export function getLocalPlaylists() {
  const lists = fs.readdirSync(getListsDir()).filter(file => file.endsWith('.json'))
  let results = []
  for (let f of lists) {
    results.push({
      ...JSON.parse(fs.readFileSync(path.join(getListsDir(), f)).toString()),
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
  return fs.writeFileSync(path.join(getListsDir(), fn), JSON.stringify(t))
}
export function deletePlaylistFile(_, fn) {
  return fs.rmSync(path.join(getListsDir(), fn))
}
export function renamePlaylistFile(_, {fn, newName}) {
  const filePath = path.join(getListsDir(), fn)
  const content = JSON.parse(fs.readFileSync(filePath).toString())
  content.title = newName
  fs.writeFileSync(filePath, JSON.stringify(content))
}
export function appendToPlaylistFile(_, {fn, song}) {
  const filePath = path.join(getListsDir(), fn)
  const content = JSON.parse(fs.readFileSync(filePath).toString())
  if (content.entries?.[0]?.kind === 'inlineSongs') {
    content.entries[0].songs.unshift(song)
  } else {
    content.entries.unshift({ kind: 'inlineSongs', songs: [song] })
  }
  fs.writeFileSync(filePath, JSON.stringify(content))
}
export function getConfig() {
  return JSON.parse(fs.readFileSync(path.join(getResDir(), 'config.json')).toString())
}
export function writeConfig(_, config) {
  return fs.writeFileSync(path.join(getResDir(), 'config.json'), config)
}
export function getSpecificConfig(_, fn) {
  return JSON.parse(fs.readFileSync(path.join(getResDir(), `${fn}.json`)).toString())
}
export function writeSpecificConfig(_, fn, config) {
  return fs.writeFileSync(path.join(getResDir(), `${fn}.json`), config)
}
export function readClipboard() {
  return clipboard.readText();
}
export function openUrl(_, url) {
  shell.openExternal(url)
}

export function saveSourceStorage(_, data) {
  return fs.writeFileSync(path.join(getResDir(), "source-storage.json"), data)
}
export function readSourceStorage() {
  try {
    return JSON.parse(fs.readFileSync(path.join(getResDir(), "source-storage.json")).toString())
  } catch (e) {
    console.warn(e.message)
    return {}
  }
}
