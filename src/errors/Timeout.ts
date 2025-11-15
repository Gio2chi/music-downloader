export class DownloadTimeoutError extends Error { 
    constructor(msg?: string)
    {
        super(msg ?? "Download Timed out")
    }
}

export class LoginTimeoutError extends Error { 
    constructor(msg?: string)
    {
        super(msg ?? "Login Timed out")
    }
}
