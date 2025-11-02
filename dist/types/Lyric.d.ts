export type TLyric = {
    synced: boolean;
    lines: {
        timestamp?: number;
        text: string;
    }[];
};
