export class DownloadTimeoutError extends Error {
    constructor(msg) {
        super(msg ?? "Download Timed out");
    }
}
export class LoginTimeoutError extends Error {
    constructor(msg) {
        super(msg ?? "Login Timed out");
    }
}
