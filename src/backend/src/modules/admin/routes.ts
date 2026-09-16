import { Router } from 'express';import { z } from 'zod';
import { db } from '../../database/connection.js';import { authenticated,allow } from '../../shared/middleware/auth.js';import { resources } from './constants.js';import { resourceFor,saveRecord,archiveRecord,adjustStock } from './services.js';import { listRecords } from './models.js';import { hashPassword } from '../../shared/helpers/security.js';import { assert } from '../../shared/errors/app-error.js';
export const adminRoutes=Router();adminRoutes.use(authenticated,allow(['admin','manager']));
const id=(v:unknown)=>z.coerce.number().int().positive().parse(v);
adminRoutes.get('/resources',(_req,res)=>res.json(resources));
adminRoutes.get('/inventory',async(_req,res)=>res.json(await db('ingredients as i').join('units as u','i.unit_id','u.id').join('inventory_balances as b','i.id','b.ingredient_id').whereNull('i.deleted_at').select('i.id','i.name','i.reorder_level','u.name as unit','b.quantity')));
adminRoutes.post('/inventory/:id/adjust',async(req,res)=>{const data=z.object({delta:z.string().regex(/^-?\d{1,9}(\.\d{1,3})?$/),reason:z.string().trim().min(3).max(255)}).parse(req.body);res.json(await adjustStock(id(req.params.id),data.delta,data.reason,res.locals.staff.id));});
adminRoutes.get('/movements',async(_req,res)=>res.json(await db('inventory_movements as m').join('ingredients as i','m.ingredient_id','i.id').select('m.*','i.name as ingredient').orderBy('m.id','desc').limit(100)));
adminRoutes.get('/reports',async(_req,res)=>{
 const [sales,refunds,counts,top]=await Promise.all([
 db('payments').sum('amount as total').first(),db('refunds').sum('amount as total').first(),
 db('orders').select('status').count('id as count').groupBy('status'),
 db('order_items as i').join('orders as o','i.order_id','o.id').whereNot('o.status','cancelled').select('i.product_name').sum('i.quantity as quantity').groupBy('i.product_name').orderBy('quantity','desc').limit(5)
 ]);res.json({gross:sales?.total||'0.00',refunds:refunds?.total||'0.00',counts,top});
});
adminRoutes.get('/settings',async(_req,res)=>res.json(await db('store_settings').where({id:1}).first()));
adminRoutes.patch('/settings',async(req,res)=>{
 const data=z.object({name:z.string().trim().min(1).max(100),headline:z.string().trim().min(1).max(150),about:z.string().trim().min(1).max(4000),address:z.string().max(255).nullable(),hours:z.string().max(255).nullable(),phone:z.string().max(40).nullable(),accepting_orders:z.boolean()}).strict().parse(req.body);
 await db.transaction(async t=>{await t('store_settings').where({id:1}).update(data);await t('audit_logs').insert({staff_id:res.locals.staff.id,action:'update',resource:'store_settings',resource_id:1,summary:'Updated store settings'});});res.json({ok:true});
});
adminRoutes.get('/staff',allow(['admin']),async(req,res)=>res.json(await db('staff as s').join('roles as r','s.role_id','r.id').select('s.id','s.name','s.username','r.code as role','s.deleted_at').orderBy('s.id')));
adminRoutes.post('/staff',allow(['admin']),async(req,res)=>{
 const data=z.object({name:z.string().trim().min(1).max(100),username:z.string().trim().min(3).max(80),password:z.string().min(12).max(200),role:z.enum(['admin','manager','cashier','kitchen'])}).parse(req.body);
 const role=await db('roles').where({code:data.role}).whereNull('deleted_at').first();assert(role,422,'Role not found.');
 const [staffId]=await db('staff').insert({name:data.name,username:data.username,password_hash:await hashPassword(data.password),role_id:role.id});res.status(201).json({id:staffId});
});
adminRoutes.patch('/staff/:id',allow(['admin']),async(req,res)=>{
 const staffId=id(req.params.id);const data=z.object({name:z.string().trim().min(1).max(100),role:z.enum(['admin','manager','cashier','kitchen']),password:z.string().min(12).max(200).optional()}).parse(req.body);
 assert(staffId!==res.locals.staff.id||data.role==='admin',409,'You cannot remove your own administrator role.');
 const role=await db('roles').where({code:data.role}).first();await db.transaction(async t=>{const row=await t('staff').where({id:staffId}).whereNull('deleted_at').first();assert(row,404,'Staff not found.');await t('staff').where({id:staffId}).update({name:data.name,role_id:role.id,...data.password?{password_hash:await hashPassword(data.password)}:{}});await t('staff_sessions').where({staff_id:staffId}).update({deleted_at:new Date()});});res.json({ok:true});
});
adminRoutes.post('/staff/:id/archive',allow(['admin']),async(req,res)=>{const staffId=id(req.params.id);assert(staffId!==res.locals.staff.id,409,'You cannot archive your own account.');await db.transaction(async t=>{await t('staff').where({id:staffId}).update({deleted_at:new Date()});await t('staff_sessions').where({staff_id:staffId}).update({deleted_at:new Date()});});res.json({ok:true});});
adminRoutes.post('/staff/:id/restore',allow(['admin']),async(req,res)=>{await db('staff').where({id:id(req.params.id)}).update({deleted_at:null});res.json({ok:true});});
adminRoutes.get('/audit',async(_req,res)=>res.json(await db('audit_logs').orderBy('id','desc').limit(100)));
adminRoutes.get('/:resource',async(req,res)=>{const resource=resourceFor(req.params.resource);res.json(await listRecords(req.params.resource,req.query.archived==='true',z.coerce.number().int().min(1).default(1).parse(req.query.page),z.string().max(100).default('').parse(req.query.q),Boolean(resource.fields.name)));});
adminRoutes.get('/:resource/:id',async(req,res)=>{resourceFor(req.params.resource);const row=await db(req.params.resource).where({id:id(req.params.id)}).whereNull('deleted_at').first();assert(row,404,'Record not found.');res.json(row);});
adminRoutes.post('/:resource',async(req,res)=>res.status(201).json(await saveRecord(req.params.resource,req.body,res.locals.staff.id)));
adminRoutes.patch('/:resource/:id',async(req,res)=>res.json(await saveRecord(req.params.resource,req.body,res.locals.staff.id,id(req.params.id))));
adminRoutes.delete('/:resource/:id',async(req,res)=>res.json(await archiveRecord(req.params.resource,id(req.params.id),false,res.locals.staff.id)));
adminRoutes.post('/:resource/:id/restore',async(req,res)=>res.json(await archiveRecord(req.params.resource,id(req.params.id),true,res.locals.staff.id)));

