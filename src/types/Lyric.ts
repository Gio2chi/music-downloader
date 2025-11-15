export type TLyric = {
    instrumental: boolean,
    synced: boolean,
    lines: TLyricLine[]
}

export type TLyricLine = {
    text: string;
    timestamp?: number;
};

export type TLyricTaskResult = {
    synced: boolean,
    instrumental: boolean,
    lyric: TLyricLine[]
}