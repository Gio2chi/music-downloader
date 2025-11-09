import { LoginPendingError } from "./LoginPending.js";
import { MediaNotFoundError } from "./MediaNotFound.js";
import { NoCoverFoundError } from "./NoCoverFound.js";
import { DownloadTimeoutError, LoginTimeoutError } from "./Timeout.js";
import { UnexpectedBehaviourError } from "./UnexpectedBehaviour.js";
import { UnsupportedMimeTypeError } from "./UnsupportedMimeType.js";
import { UnsupportedMusicFileError } from "./UnsupportedMusicFile.js";
export const DownloadErrors = {
    MediaNotFoundError,
    DownloadTimeoutError,
    UnexpectedBehaviourError
};
export const MetadataErrors = {
    NoCoverFoundError,
    UnsupportedMimeTypeError,
    UnsupportedMusicFileError
};
export const SpotifyErrors = {
    LoginTimeoutError,
    LoginPendingError
};
