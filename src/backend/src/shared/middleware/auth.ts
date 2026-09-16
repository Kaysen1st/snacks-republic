import type { RequestHandler } from 'express';
import { getSession } from '../../modules/auth/services.js';
import { assert } from '../errors/app-error.js';
export const authenticated:RequestHandler=async(req,res,next)=>{
 const session=req.cookies?.sr_session;assert(typeof session==='string',401,'Please sign in.');
 const staff=await getSession(session);assert(staff,401,'Your session has expired. Please sign in again.');
 if(!['GET','HEAD','OPTIONS'].includes(req.method))assert(req.get('X-CSRF-Token')===staff.csrf_token,403,'Your security token expired. Refresh and try again.');
 res.locals.staff={id:staff.id,name:staff.name,role:staff.role};res.locals.csrf=staff.csrf_token;next();
};
export const allow=(roles:string[]):RequestHandler=>(_req,res,next)=>{assert(roles.includes(res.locals.staff?.role),403,'You do not have permission for this action.');next();};

