import winston from "winston";
declare const getLogger: (moduleName: string) => winston.Logger;
export default getLogger;
