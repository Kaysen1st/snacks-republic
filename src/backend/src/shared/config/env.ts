import 'dotenv/config';
import { z } from 'zod';
export const env = z.object({
 NODE_ENV: z.enum(['development','test','production']).default('development'),
 PORT: z.coerce.number().int().min(1).max(65535).default(3001), HOST: z.string().default('127.0.0.1'),
 APP_ORIGIN: z.string().url().default('http://127.0.0.1:5173'),
 DB_HOST: z.string().default('127.0.0.1'), DB_PORT: z.coerce.number().default(3306),
 DB_NAME: z.string().regex(/^[a-zA-Z0-9_]+$/).default('snacks_republic'),
 DB_USER: z.string().default('snacks_app'), DB_PASSWORD: z.string().default(''),
 SESSION_TTL_HOURS: z.coerce.number().min(1).max(168).default(12),
 SESSION_SECRET: z.string().min(32),
 DEMO_MODE: z.enum(['true','false']).default('false').transform(v=>v==='true'),
 STAGING_MODE: z.enum(['true','false']).default('false').transform(v=>v==='true')
}).parse(process.env);
if (env.NODE_ENV === 'production' && env.DEMO_MODE && !env.STAGING_MODE) throw new Error('Demo mode is forbidden in production');
export const httpStaging = env.STAGING_MODE && new URL(env.APP_ORIGIN).protocol === 'http:';
