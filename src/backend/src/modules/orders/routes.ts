import { Router } from 'express';import { authenticated,allow } from '../../shared/middleware/auth.js';import { placeOrder,trackOrder,listOrders,transition,pay,refund } from './controllers.js';
export const storefrontOrders=Router();storefrontOrders.post('/',placeOrder);storefrontOrders.get('/track/:token',trackOrder);
export const orderRoutes=Router();orderRoutes.use(authenticated);orderRoutes.get('/',listOrders);orderRoutes.post('/',allow(['admin','manager','cashier']),placeOrder);orderRoutes.post('/:id/transitions',transition);orderRoutes.post('/:id/payments',allow(['admin','manager','cashier']),pay);orderRoutes.post('/:id/refunds',allow(['admin','manager']),refund);

