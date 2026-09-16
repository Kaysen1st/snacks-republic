import { Router } from 'express';import { z } from 'zod';import { rateLimit } from 'express-rate-limit';
import { login,logout } from './services.js';import { env,httpStaging } from '../../shared/config/env.js';import { authenticated } from '../../shared/middleware/auth.js';
export const authRoutes=Router();
authRoutes.post('/login',rateLimit({windowMs:15*60*1000,limit:15,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many sign-in attempts. Try again later.'}}),async(req,res)=>{
 const data=z.object({username:z.string().min(1).max(80),password:z.string().min(1).max(200)}).parse(req.body);
 const result=await login(data.username,data.password);res.cookie('sr_session',result.session,{httpOnly:true,secure:env.NODE_ENV==='production'&&!httpStaging,sameSite:'strict',maxAge:env.SESSION_TTL_HOURS*3600000,path:'/'});res.json({staff:result.staff,csrf:result.csrf});
});
authRoutes.get('/session',authenticated,(_req,res)=>res.json({staff:res.locals.staff,csrf:res.locals.csrf}));
authRoutes.post('/logout',authenticated,async(req,res)=>{await logout(req.cookies.sr_session);res.clearCookie('sr_session',{path:'/'});res.sendStatus(204);});
