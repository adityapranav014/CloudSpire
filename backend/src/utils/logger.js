import pino from 'pino';
import { env } from '../config/env.js';

const transport =
    env.nodeEnv !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard', ignore: 'pid,hostname' } }
        : undefined;

export const logger = pino({
    level: env.nodeEnv === 'production' ? 'info' : 'debug',
    ...(transport && { transport }),
});
