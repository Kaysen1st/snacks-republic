import type { Knex } from 'knex';
export async function up(k:Knex){
 await k.schema.alterTable('payments',t=>t.unique(['method','reference'],'payments_method_reference_unique'));
 for(const [table,column]of [['recipe_items','quantity'],['option_recipe_items','quantity'],['order_items','quantity'],['option_groups','max_selections']])await k.raw('ALTER TABLE ?? ADD CONSTRAINT ?? CHECK (?? > 0)',[table,table+'_positive_'+column,column]);
 // Unknown prices remain drafts. Never interpret an absent price as a free serving.
 await k('products').whereIn('id',k('product_variants').select('product_id').whereNull('price')).update({is_published:false});
 await k('products').where({slug:'spam-sandwich-overload'}).update({image_path:'/assets/spam-sandwich.png'});
 await k('products').where({slug:'hotdog-sandwich-overload'}).update({image_path:'/assets/hotdog-sandwich.png'});
 await k('products').where('slug','like','%samyang%').update({image_path:'/assets/noodles.png'});
}
export async function down(k:Knex){
 for(const [table,column]of [['recipe_items','quantity'],['option_recipe_items','quantity'],['order_items','quantity'],['option_groups','max_selections']])await k.raw('ALTER TABLE ?? DROP CHECK ??',[table,table+'_positive_'+column]);
 await k.schema.alterTable('payments',t=>t.dropUnique(['method','reference'],'payments_method_reference_unique'));
 // Publication choices and image edits are intentionally retained on rollback.
}

