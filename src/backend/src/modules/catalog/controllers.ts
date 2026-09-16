import type { RequestHandler } from 'express';import { getCatalog } from './services.js';
export const listCatalog:RequestHandler=async(_req,res)=>{res.json(await getCatalog());};

