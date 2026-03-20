import { createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.colorize(),
    format.printf(({ timestamp, level, message, stack, ...meta }) => {
      const output = stack ?? message;
      const metadata = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${level}] ${output}${metadata}`;
    }),
  ),
  transports: [new transports.Console()],
});
