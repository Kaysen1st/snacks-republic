import { db } from './connection.js';
import { hashPassword } from '../shared/helpers/security.js';
try{
 const username=process.env.STAFF_USERNAME, password=process.env.STAFF_PASSWORD, name=process.env.STAFF_NAME||username;
 if(!username||!password||password.length<12)throw new Error('Set STAFF_USERNAME, STAFF_NAME, and STAFF_PASSWORD (12+ characters) in your local environment.');
 const role=await db('roles').where({code:'admin'}).first();
 await db('staff').insert({name,username,password_hash:await hashPassword(password),role_id:role.id});
 console.log('[database:StaffSetup] Administrator created.');
}catch(e){console.error('[database:StaffSetup]',e instanceof Error?e.message:'Failed');process.exitCode=1;}finally{await db.destroy();}

