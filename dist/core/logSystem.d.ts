import winston from "winston";
declare const getLogger: (config: {
    displayName: string;
    level: string;
}) => winston.Logger;
export default getLogger;
