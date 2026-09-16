import { randomBytes, scrypt, timingSafeEqual, createHash, createHmac } from 'node:crypto';
import { promisify } from 'node:util';
import { env } from '../config/env.js';
const derive=promisify(scrypt);
export const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
export const token=()=>randomBytes(32).toString('hex');
export const tracking=(nonce:string)=>createHmac('sha256',env.SESSION_SECRET).update('order:'+nonce).digest('hex');
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');const value=await derive(password,salt,64) as Buffer;return salt+':'+value.toString('hex');}
export async function verifyPassword(password:string,stored:string){const [salt,value]=stored.split(':');if(!salt||!value)return false;const result=await derive(password,salt,64) as Buffer;const expected=Buffer.from(value,'hex');return result.length===expected.length&&timingSafeEqual(result,expected);}

