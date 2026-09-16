import type { Knex } from 'knex';import { db } from '../../database/connection.js';import { assert } from '../../shared/errors/app-error.js';
export async function readOrder(id:number,k:Knex|Knex.Transaction=db){
 const row=await k('orders').where({id}).whereNull('deleted_at').first();assert(row,404,'Order not found.');
 const items=await k('order_items').where({order_id:id}).orderBy('id');
 const options=items.length?await k('order_item_options').whereIn('order_item_id',items.map(i=>i.id)):[];
 const {tracking_hash:_hash,tracking_nonce:_nonce,...order}=row;
 return {...order,items:items.map(item=>({...item,options:options.filter(o=>o.order_item_id===item.id)}))};
}

