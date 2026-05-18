import * as fs from "node:fs";
import path from "path";
import * as os from "node:os";
import {defaultColorsJsonString, defaultConfigJsonString} from './stringResource.js'
const tmpPath = os.tmpdir()


export function checkFolders(dnArray) {
    for (let i of dnArray) {
        if (!fs.existsSync(i)) fs.mkdirSync(i);
    }
}
export async function startNcmServer() {
    // 检测是否存在 anonymous_token 文件,没有则生成
    if (!fs.existsSync(path.resolve(tmpPath, 'anonymous_token'))) {
        fs.writeFileSync(path.resolve(tmpPath, 'anonymous_token'), '', 'utf-8')
    }
    const server = await import("NeteaseCloudMusicApi/server.js");
    const generateConfig = await import("NeteaseCloudMusicApi/generateConfig.js");
    // 启动时更新anonymous_token
    await generateConfig.default();
    server.serveNcmApi({
        checkVersion: true,
        port: 35651
    })
}
export function checkResources() {
    if (!fs.existsSync('./res/config.json')) {
        fs.writeFileSync('./res/config.json', defaultConfigJsonString)
    }
    if (!fs.existsSync('./res/colors.json')) {
        fs.writeFileSync('./res/colors.json', defaultColorsJsonString)
    }
}