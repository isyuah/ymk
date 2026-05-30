import path from "node:path";
import {app} from "electron";

// 运行时数据（config / colors / source-storage / 本地歌单）放在各平台用户数据目录下，
// 开发与生产共用同一份（依赖 main.js 中的 app.setName('yumuzk')）。
export function getResDir() {
    return path.join(app.getPath('userData'), 'res');
}

export function getListsDir() {
    return path.join(getResDir(), 'lists');
}

// 插件目录跟随程序：打包后取可执行文件所在目录（如 X/yumuzk/plugins），
// 开发模式取项目根目录下的 plugins。
export function getPluginsDir() {
    const base = app.isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath();
    return path.join(base, 'plugins');
}
