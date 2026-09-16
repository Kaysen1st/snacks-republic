import { db } from '../../database/connection.js';import type { Knex } from 'knex';
import { resources,schemaFor } from './constants.js';import { assert } from '../../shared/errors/app-error.js';import { milli,quantity } from '../../shared/helpers/quantity.js';import { token } from '../../shared/helpers/security.js';
export function resourceFor(table:string){const resource=resources[table];assert(resource,404,'Resource not found.');return resource;}
async function audit(t:Knex.Transaction,staffId:number,action:string,resource:string,id:number){await t('audit_logs').insert({staff_id:staffId,action,resource,resource_id:id,summary:action+' '+resource+' #'+id});}
async function validateRelations(t:Knex.Transaction,table:string,data:any){
 for(const [field,config]of Object.entries(resourceFor(table).fields)){
 if(config.reference&&data[field]!==undefined){const row=await t(config.reference).where({id:data[field]}).whereNull('deleted_at').first();assert(row,422,'Choose an active '+config.label.toLowerCase()+'.');}
 }
 if(table==='products'&&data.is_published){assert(data.id,422,'Create the product as a draft, then add a priced variant.');const valid=await t('product_variants').where({product_id:data.id}).whereNull('deleted_at').whereNotNull('price').first();assert(valid,422,'Add a priced variant before publishing.');}
 if(['recipe_items','option_recipe_items'].includes(table))assert(milli(data.quantity)>0,422,'Recipe quantity must be positive.');
}
async function refreshRecipe(t:Knex.Transaction,table:string,data:any){
 if(table==='recipe_items'){const active=await t('recipe_items as r').join('ingredients as i','r.ingredient_id','i.id').where('r.variant_id',data.variant_id).whereNull('r.deleted_at').whereNull('i.deleted_at').select('r.id');await t('product_variants').where({id:data.variant_id}).update({recipe_ready:active.length>0});}
}
export async function saveRecord(table:string,body:unknown,staffId:number,id?:number){
 const data=schemaFor(resourceFor(table),Boolean(id)).parse(body);
 return db.transaction(async t=>{
 const old=id?await t(table).where({id}).whereNull('deleted_at').forUpdate().first():null;if(id)assert(old,404,'Record not found.');
 await validateRelations(t,table,{...old,...data});
 let savedId=id;if(id)await t(table).where({id}).update(data);else [savedId]=await t(table).insert(data);
 if(table==='ingredients'&&!id)await t('inventory_balances').insert({ingredient_id:savedId,quantity:0});
 await refreshRecipe(t,table,{...old,...data});
 if(old&&table==='recipe_items'&&data.variant_id&&old.variant_id!==data.variant_id)await refreshRecipe(t,table,old);
 await audit(t,staffId,id?'update':'create',table,savedId!);return t(table).where({id:savedId}).first();
 });
}
export async function archiveRecord(table:string,id:number,restore:boolean,staffId:number){
 resourceFor(table);
 return db.transaction(async t=>{
 const row=await t(table).where({id}).forUpdate().first();assert(row,404,'Record not found.');
 assert(restore?row.deleted_at:!row.deleted_at,409,restore?'Record is already active.':'Record is already archived.');
 if(restore)await validateRelations(t,table,row);
 // Products are aggregate roots: their variants remain for restore and receipt history.
 if(!restore&&table!=='products'){
 for(const [other,resource]of Object.entries(resources)){
 for(const [field,config]of Object.entries(resource.fields))if(config.reference===table){
 const dependent=await t(other).where({[field]:id}).whereNull('deleted_at').first();assert(!dependent,409,'Archive or reassign active '+resource.label.toLowerCase()+' first.');
 }
 }
 }
 await t(table).where({id}).update({deleted_at:restore?null:new Date()});await refreshRecipe(t,table,row);await audit(t,staffId,restore?'restore':'archive',table,id);
 return t(table).where({id}).first();
 });
}
export async function adjustStock(id:number,delta:string,reason:string,staffId:number){
 return db.transaction(async t=>{
 const ingredient=await t('ingredients').where({id}).whereNull('deleted_at').first();assert(ingredient,404,'Ingredient not found.');
 const row=await t('inventory_balances').where({ingredient_id:id}).forUpdate().first();assert(row,404,'Balance not found.');
 const change=milli(delta);assert(change!==0,422,'Enter a non-zero adjustment.');const next=milli(row.quantity)+change;assert(next>=0,422,'Adjustment would make stock negative.');
 await t('inventory_balances').where({id:row.id}).update({quantity:quantity(next)});await t('inventory_movements').insert({ingredient_id:id,staff_id:staffId,quantity:quantity(change),reason,operation_key:'adjust-'+token()});await audit(t,staffId,'stock adjustment','ingredients',id);
 return {quantity:quantity(next)};
 });
}

