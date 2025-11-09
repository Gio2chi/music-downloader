export class NoCoverFoundError extends Error { 
    constructor(msg?: string)
    {
        super(msg ?? "No cover found in tags")
    }
}
