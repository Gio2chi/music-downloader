import winston from "winston"
import DailyRotateFile from "winston-daily-rotate-file"

winston.addColors(winston.config.syslog.colors)

const warningTransport = new DailyRotateFile({
    level: 'warning',
    datePattern: 'YYYY-MM',
    zippedArchive: true,
    filename: 'warning-%DATE%.log',
    dirname: 'logs'
})

warningTransport.on('error', () => { })

const debugTransport = new DailyRotateFile({
    level: 'debug',
    datePattern: 'YYYY-MM',
    zippedArchive: true,
    filename: 'debug-%DATE%.log',
    dirname: 'logs',
    maxFiles: '90d'
})

debugTransport.on('error', () => { })

const consoleTransport = new winston.transports.Console({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.colorize({ all: true }),
        winston.format.printf(({ timestamp, level, message, label }) => {
            return `${timestamp} [${label || 'unknown'}] ${level}: ${message}`
        })
    )
})

const dynamicMetaFormat = winston.format((info) => {
    if (info.meta && typeof info.meta === 'object') {
        // Merge the meta object into the log entry
        Object.assign(info, info.meta);
        delete info.meta; // remove to avoid duplication
    }
    return info;
})()

const getLogger = (config: { displayName: string, level: string}): winston.Logger => {
    const {level, displayName} = config
    return winston.createLogger({
        level,
        format: winston.format.combine(
            winston.format.timestamp(),
            dynamicMetaFormat,
            winston.format.label({ label: displayName }),
            winston.format.json()
        ),
        levels: winston.config.syslog.levels,
        transports: [
            warningTransport,
            debugTransport,
            consoleTransport
        ],
        exitOnError: false
    })
}

export default getLogger