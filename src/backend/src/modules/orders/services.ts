import type { Knex } from 'knex';
import type { OrderInput, Staff, OrderStatus } from '../../../../contracts/types.js';
import { db } from '../../database/connection.js';
import { assert, AppError } from '../../shared/errors/app-error.js';
import { cents,money } from '../../shared/helpers/money.js';
import { milli,quantity } from '../../shared/helpers/quantity.js';
import { hash,token,tracking } from '../../shared/helpers/security.js';
import { transitions } from '../../shared/constants/order.js';
import { readOrder } from './models.js';

async function priceLine(t:Knex.Transaction,item:OrderInput['items'][number]){
 const v=await t('product_variants as v').join('products as p','v.product_id','p.id').join('categories as c','p.category_id','c.id').join('serving_options as s','v.serving_option_id','s.id').where('v.id',item.variant_id).whereNull('v.deleted_at').whereNull('p.deleted_at').whereNull('c.deleted_at').whereNull('s.deleted_at').where('p.is_published',true).select('v.*','p.name','s.name as serving').first();
 assert(v&&v.price!==null,422,'A selected item is unavailable or has no price.');assert(v.recipe_ready,409,'This item is not ready for ordering yet.');
 assert(new Set(item.option_ids).size===item.option_ids.length,422,'Choose each option only once.');
 const groups=await t('product_option_groups as pg').join('option_groups as g','pg.option_group_id','g.id').where('pg.product_id',v.product_id).whereNull('pg.deleted_at').whereNull('g.deleted_at').select('g.*');
 const options=item.option_ids.length?await t('variant_options as vo').join('options as o','vo.option_id','o.id').join('option_groups as g','o.option_group_id','g.id').where('vo.variant_id',v.id).whereIn('o.id',item.option_ids).whereNull('vo.deleted_at').whereNull('o.deleted_at').whereNull('g.deleted_at').select('vo.id as variant_option_id','o.id','o.name','o.option_group_id','vo.price'):[];
 assert(options.length===item.option_ids.length,422,'An option is unavailable for this item.');
 assert(options.every(o=>groups.some(g=>g.id===o.option_group_id)),422,'An option does not belong to this product.');
 for(const group of groups){const count=options.filter(o=>o.option_group_id===group.id).length;assert(!group.required||count>0,422,'Choose '+group.name+'.');assert(count<=group.max_selections,422,'Too many selections for '+group.name+'.');}
 const recipe=await t('recipe_items').where({variant_id:v.id}).whereNull('deleted_at');
 assert(recipe.length>0,409,'The recipe for this item has not been configured.');
 const extra=options.length?await t('option_recipe_items').whereIn('variant_option_id',options.map(o=>o.variant_option_id)).whereNull('deleted_at'):[];
 const consumption=new Map<number,number>();
 for(const r of [...recipe,...extra]){const amount=milli(r.quantity);assert(amount>0,409,'Recipe quantities must be positive.');consumption.set(r.ingredient_id,(consumption.get(r.ingredient_id)||0)+amount*item.quantity);}
 const unit=cents(v.price)+options.reduce((sum,o)=>sum+cents(o.price),0);
 return {v,item,options,consumption,unit,total:unit*item.quantity};
}

export async function recordPayment(t:Knex.Transaction,order:any,input:{method:'cash'|'gcash';tendered:string;reference?:string},staff:Staff){
 assert(order.status!=='cancelled',409,'Cancelled orders cannot be paid.');assert(order.payment_status==='unpaid',409,'This order already has a payment.');
 const total=cents(order.total_amount),tendered=cents(input.tendered);
 assert(tendered>=total,422,'Payment does not cover the order total.');
 if(input.method==='gcash'){assert(input.reference?.trim(),422,'Enter the verified GCash reference.');assert(tendered===total,422,'GCash amount must match the order total.');}
 await t('payments').insert({order_id:order.id,staff_id:staff.id,method:input.method,amount:money(total),tendered:money(tendered),reference:input.reference||null});
 await t('orders').where({id:order.id}).update({payment_status:'paid'});
}
export async function createOrder(input:OrderInput,key:string,staff?:Staff){
 const scope=staff?'pos:'+staff.id:'online', requestHash=hash(JSON.stringify(input));
 const existing=async()=>{const found=await db('idempotency_keys').where({scope,request_key:key}).first();if(!found)return null;assert(found.request_hash===requestHash,409,'This request key was already used for another order.');assert(found.order_id,409,'Order is processing. Try again.');const row=await db('orders').where({id:found.order_id}).first();return {...await readOrder(found.order_id),tracking_token:tracking(row.tracking_nonce)};};
 const previous=await existing();if(previous)return previous;
 for(let attempt=0;attempt<3;attempt++){
 try{return await db.transaction(async t=>{
 await t('idempotency_keys').insert({scope,request_key:key,request_hash:requestHash});
 const settings=await t('store_settings').where({id:1}).whereNull('deleted_at').first();assert(settings?.accepting_orders,409,'Ordering is paused. Please check back soon.');
 const lines=[];for(const item of input.items)lines.push(await priceLine(t,item));
 const totals=new Map<number,number>();for(const line of lines)for(const [id,qty]of line.consumption)totals.set(id,(totals.get(id)||0)+qty);
 const ingredientIds=[...totals.keys()].sort((a,b)=>a-b);
 for(const id of ingredientIds){
 const ingredient=await t('ingredients').where({id}).whereNull('deleted_at').first();assert(ingredient,409,'An ingredient is unavailable.');
 const balance=await t('inventory_balances').where({ingredient_id:id}).whereNull('deleted_at').forUpdate().first();
 assert(balance&&milli(balance.quantity)>=totals.get(id)!,409,'Not enough stock for '+ingredient.name+'. Please update your basket.');
 await t('inventory_balances').where({id:balance.id}).update({quantity:quantity(milli(balance.quantity)-totals.get(id)!)});
 }
 const total=lines.reduce((sum,l)=>sum+l.total,0),nonce=token(),track=tracking(nonce);
 if(input.expected_total!==undefined)assert(cents(input.expected_total)===total,409,'Menu prices have changed. Refresh the menu and rebuild your basket before ordering.');
 const [id]=await t('orders').insert({order_number:'SR-'+Date.now().toString(36).toUpperCase()+'-'+token().slice(0,4).toUpperCase(),channel:staff?'pos':'online',staff_id:staff?.id||null,customer_name:input.customer_name,notes:input.notes||'',currency:settings.currency,subtotal:money(total),total_amount:money(total),tracking_hash:hash(track),tracking_nonce:nonce});
 for(const line of lines){
 const [lineId]=await t('order_items').insert({order_id:id,variant_id:line.v.id,product_name:line.v.name,serving:line.v.serving,quantity:line.item.quantity,unit_price:money(line.unit),line_total:money(line.total)});
 for(const option of line.options)await t('order_item_options').insert({order_item_id:lineId,option_id:option.id,name:option.name,price:option.price});
 for(const [ingredient_id,used]of line.consumption)await t('inventory_movements').insert({ingredient_id,order_item_id:lineId,staff_id:staff?.id||null,quantity:quantity(-used),reason:'Order consumption',operation_key:'sale-'+lineId+'-'+ingredient_id});
 }
 await t('order_status_history').insert({order_id:id,staff_id:staff?.id||null,new_status:'accepted'});
 if(staff&&input.payment_method)await recordPayment(t,{id,status:'accepted',payment_status:'unpaid',total_amount:money(total)},{method:input.payment_method,tendered:input.tendered||'0',reference:input.reference},staff);
 await t('idempotency_keys').where({scope,request_key:key}).update({order_id:id});
 return {...await readOrder(id,t),tracking_token:track};
 });}catch(e:any){
 if(e.code==='ER_DUP_ENTRY'){const found=await existing();if(found)return found;throw new AppError(409,'This operation conflicts with an existing record.');}
 if(e.code==='ER_LOCK_DEADLOCK'&&attempt<2)continue;throw e;
 }
 }throw new AppError(503,'Checkout is busy. Please try again.');
}
export async function changeStatus(id:number,status:OrderStatus,reason:string|undefined,staff:Staff){
 return db.transaction(async t=>{
 const order=await t('orders').where({id}).whereNull('deleted_at').forUpdate().first();assert(order,404,'Order not found.');
 assert(transitions[order.status as OrderStatus].includes(status),409,'This order cannot move to that status.');
 if(status==='cancelled'){assert(['admin','manager'].includes(staff.role),403,'A manager must cancel an order.');assert(reason?.trim(),422,'A cancellation reason is required.');}
 if(status==='completed')assert(order.payment_status==='paid',409,'Record payment before completing this order.');
 if(status==='cancelled'&&order.status==='accepted'){
 const movements=await t('inventory_movements as m').join('order_items as i','m.order_item_id','i.id').where('i.order_id',id).where('m.quantity','<',0).select('m.*').orderBy('m.ingredient_id');
 for(const movement of movements){
 const balance=await t('inventory_balances').where({ingredient_id:movement.ingredient_id}).forUpdate().first();assert(balance,409,'An inventory balance is missing.');
 await t('inventory_balances').where({id:balance.id}).update({quantity:quantity(milli(balance.quantity)-milli(movement.quantity))});
 await t('inventory_movements').insert({ingredient_id:movement.ingredient_id,order_item_id:movement.order_item_id,staff_id:staff.id,reversal_id:movement.id,quantity:quantity(-milli(movement.quantity)),reason:'Cancelled before preparation',operation_key:'reverse-'+movement.id});
 }
 }
 await t('orders').where({id}).update({status});await t('order_status_history').insert({order_id:id,staff_id:staff.id,previous_status:order.status,new_status:status,reason:reason||null});
 return readOrder(id,t);
 });
}
export async function payOrder(id:number,input:{method:'cash'|'gcash';tendered:string;reference?:string},staff:Staff){return db.transaction(async t=>{const row=await t('orders').where({id}).whereNull('deleted_at').forUpdate().first();assert(row,404,'Order not found.');await recordPayment(t,row,input,staff);return readOrder(id,t);});}
export async function refundOrder(id:number,amount:string,reason:string,staff:Staff){
 return db.transaction(async t=>{
 const order=await t('orders').where({id}).whereNull('deleted_at').forUpdate().first();assert(order,404,'Order not found.');
 const payment=await t('payments').where({order_id:id}).first();assert(payment,409,'No payment to refund.');
 const refunds=await t('refunds').where({payment_id:payment.id});const refunded=refunds.reduce((sum,r)=>sum+cents(r.amount),0),value=cents(amount);
 assert(value>0&&refunded+value<=cents(payment.amount),422,'Refund exceeds the remaining paid amount.');
 await t('refunds').insert({payment_id:payment.id,staff_id:staff.id,amount:money(value),reason});
 await t('orders').where({id}).update({payment_status:refunded+value===cents(payment.amount)?'refunded':'partially_refunded'});
 return readOrder(id,t);
 });
}
