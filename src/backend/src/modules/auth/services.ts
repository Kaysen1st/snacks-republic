import { db } from '../../database/connection.js';
import { hash, token, verifyPassword } from '../../shared/helpers/security.js';
import { AppError } from '../../shared/errors/app-error.js';
import { env } from '../../shared/config/env.js';
export async function login(username:string,password:string){
 const staff=await db('staff as s').join('roles as r','s.role_id','r.id').where('s.username',username).whereNull('s.deleted_at').whereNull('r.deleted_at').select('s.*','r.code as role').first();
 if(!staff||!await verifyPassword(password,staff.password_hash))throw new AppError(401,'Incorrect username or password.');
 const session=token(), csrf=token();
 await db('staff_sessions').insert({staff_id:staff.id,token_hash:hash(session),csrf_token:csrf,expires_at:new Date(Date.now()+env.SESSION_TTL_HOURS*3600000)});
 return {session,csrf,staff:{id:staff.id,name:staff.name,role:staff.role}};
}
export async function getSession(raw:string){
 return db('staff_sessions as ss').join('staff as s','ss.staff_id','s.id').join('roles as r','s.role_id','r.id').where('ss.token_hash',hash(raw)).where('ss.expires_at','>',new Date()).whereNull('ss.deleted_at').whereNull('s.deleted_at').whereNull('r.deleted_at').select('s.id','s.name','r.code as role','ss.csrf_token').first();
}
export async function logout(raw:string){await db('staff_sessions').where({token_hash:hash(raw)}).update({deleted_at:new Date()});}

