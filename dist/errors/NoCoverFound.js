export class NoCoverFoundError extends Error {
    constructor(msg) {
        super(msg ?? "No cover found in tags");
    }
}
