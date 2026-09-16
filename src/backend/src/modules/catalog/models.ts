import type { Knex } from 'knex';
import { db } from '../../database/connection.js';
export async function catalogRows(k:Knex|Knex.Transaction=db,includeArchived=false){
 const productQuery=k('products as p').join('categories as c','p.category_id','c.id').select('p.*','c.name as category');
 if(!includeArchived)productQuery.whereNull('p.deleted_at').whereNull('c.deleted_at').where('p.is_published',true);
 const [products,categories,variants,options,store]=await Promise.all([
 productQuery.orderBy('p.id'),k('categories').whereNull('deleted_at').orderBy('id'),
 k('product_variants as v').join('serving_options as s','v.serving_option_id','s.id').whereNull('v.deleted_at').whereNull('s.deleted_at').select('v.*','s.name as serving'),
 k('variant_options as vo').join('options as o','vo.option_id','o.id').join('option_groups as g','o.option_group_id','g.id').whereNull('vo.deleted_at').whereNull('o.deleted_at').whereNull('g.deleted_at').select('o.id','o.name','g.id as group_id','g.name as group_name','g.required','vo.price','vo.variant_id'),
 k('store_settings').where({id:1}).whereNull('deleted_at').first()
 ]);
 return {products:products.map(p=>({...p,is_published:Boolean(p.is_published),variants:variants.filter(v=>v.product_id===p.id).map(v=>({...v,recipe_ready:Boolean(v.recipe_ready)})),options:options.filter(o=>variants.some(v=>v.product_id===p.id&&v.id===o.variant_id)).map(o=>({...o,required:Boolean(o.required)}))})),categories,store:store?{...store,accepting_orders:Boolean(store.accepting_orders)}:null};
}

