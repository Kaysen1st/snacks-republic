import { Router } from 'express';import { listCatalog } from './controllers.js';
export const catalogRoutes=Router();catalogRoutes.get('/',listCatalog);

