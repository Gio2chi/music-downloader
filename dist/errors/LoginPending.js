export class LoginPendingError extends Error {
    constructor(msg) {
        super(msg ?? "Login already pending for this chat");
    }
}
