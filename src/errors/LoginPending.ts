export class LoginPendingError extends Error { 
    constructor(msg?: string)
    {
        super(msg ?? "Login already pending for this chat")
    }
}