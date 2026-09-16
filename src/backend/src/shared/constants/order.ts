import type { OrderStatus } from '../../../../contracts/types.js';
export const transitions: Record<OrderStatus, OrderStatus[]> = { accepted:['preparing','cancelled'], preparing:['ready','cancelled'], ready:['completed','cancelled'], completed:[], cancelled:[] };
export const MANAGERS = ['admin','manager'] as const;

