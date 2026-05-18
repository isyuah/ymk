
export type SongLyricConfigBase = {
    status: string,
    lrc: SongLyric,
    enableAutoScroll: boolean,
    offset?: number
}
export type SongLyricConfigWeb = {
    type: 'web',
    path: string,
} & SongLyricConfigBase
export type SongLyricConfigLocal = {
    type: 'local',
    path: string,
} & SongLyricConfigBase
export type SongLyricConfigContent = {
    type: 'content',
    content: string,
} & SongLyricConfigBase
export type SongLyricItem = {
    time: number,
    text: string[],
}
export type SongLyricConfig = SongLyricConfigWeb | SongLyricConfigLocal | SongLyricConfigContent;
export type SongLyric = {
    enableAutoScroll: boolean,
    items: SongLyricItem[],
};

export type ContextMenuItem<T = never> = {
    title: string,
    action: (args: T) => Promise<void> | void,
    show?: boolean
}
