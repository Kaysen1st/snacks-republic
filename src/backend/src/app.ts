import express from 'express';import type { ErrorRequestHandler } from 'express';import cookieParser from 'cookie-parser';import helmet from 'helmet';import { rateLimit } from 'express-rate-limit';import { ZodError } from 'zod';import path from 'node:path';
import { env,httpStaging } from './shared/config/env.js';import { db } from './database/connection.js';import { AppError } from './shared/errors/app-error.js';import { authRoutes } from './modules/auth/routes.js';import { catalogRoutes } from './modules/catalog/routes.js';import { storefrontOrders,orderRoutes } from './modules/orders/routes.js';import { adminRoutes } from './modules/admin/routes.js';
export const app=express();app.disable('x-powered-by');app.use(helmet({contentSecurityPolicy:env.NODE_ENV==='production'?(httpStaging?{directives:{upgradeInsecureRequests:null}}:undefined):false,strictTransportSecurity:httpStaging?false:undefined}));app.use(express.json({limit:'100kb'}));app.use(cookieParser());
app.use('/api',(_req,res,next)=>{res.set('Cache-Control','no-store');next();});
app.use('/api',rateLimit({windowMs:60000,limit:300,standardHeaders:'draft-8',legacyHeaders:false,message:{error:'Too many requests. Please wait a moment.'}}));
app.use('/api',(req,_res,next)=>{if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.get('Origin')&&req.get('Origin')!==env.APP_ORIGIN)return next(new AppError(403,'Request origin is not allowed.'));next();});
app.get('/api/v1/health',async(_req,res)=>{await db.raw('SELECT 1');res.json({status:'ok',demo:env.DEMO_MODE});});
app.use('/api/v1/auth',authRoutes);app.use('/api/v1/catalog',catalogRoutes);app.use('/api/v1/storefront/orders',storefrontOrders);app.use('/api/v1/orders',orderRoutes);app.use('/api/v1/admin',adminRoutes);
app.use('/api',(_req,_res,next)=>next(new AppError(404,'Endpoint not found.')));
if(env.NODE_ENV==='production'){app.use(express.static(path.resolve('dist/client')));app.get('/{*path}',(_req,res)=>res.sendFile(path.resolve('dist/client/index.html')));}
const errors:ErrorRequestHandler=(error,_req,res,_next)=>{
 if(error instanceof ZodError){res.status(422).json({error:error.issues.map(i=>i.path.join('.')+': '+i.message).join('; ')});return;}
 if(error instanceof AppError){res.status(error.status).json({error:error.message});return;}
 if(error?.code==='ER_DUP_ENTRY'){res.status(409).json({error:'That record already exists, including archived records. Restore it or use a different identifier.'});return;}
 if(error?.code==='ER_ROW_IS_REFERENCED_2'){res.status(409).json({error:'This record is still in use.'});return;}
 console.error('[controller:API]',error instanceof Error?error.message:'Unexpected error');
 res.status(503).json({error:'The store service is temporarily unavailable. Please try again.'});
};app.use(errors);
