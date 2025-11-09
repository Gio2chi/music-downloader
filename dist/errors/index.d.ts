import { LoginPendingError } from "./LoginPending.js";
import { MediaNotFoundError } from "./MediaNotFound.js";
import { NoCoverFoundError } from "./NoCoverFound.js";
import { DownloadTimeoutError, LoginTimeoutError } from "./Timeout.js";
import { UnexpectedBehaviourError } from "./UnexpectedBehaviour.js";
import { UnsupportedMimeTypeError } from "./UnsupportedMimeType.js";
import { UnsupportedMusicFileError } from "./UnsupportedMusicFile.js";
export declare const DownloadErrors: {
    MediaNotFoundError: typeof MediaNotFoundError;
    DownloadTimeoutError: typeof DownloadTimeoutError;
    UnexpectedBehaviourError: typeof UnexpectedBehaviourError;
};
export declare const MetadataErrors: {
    NoCoverFoundError: typeof NoCoverFoundError;
    UnsupportedMimeTypeError: typeof UnsupportedMimeTypeError;
    UnsupportedMusicFileError: typeof UnsupportedMusicFileError;
};
export declare const SpotifyErrors: {
    LoginTimeoutError: typeof LoginTimeoutError;
    LoginPendingError: typeof LoginPendingError;
};
