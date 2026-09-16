import { z } from 'zod';
export type Field={label:string;type:'text'|'textarea'|'number'|'boolean'|'money'|'quantity'|'reference';reference?:string;nullable?:boolean};
export type Resource={label:string;fields:Record<string,Field>};
const text=(label:string):Field=>({label,type:'text'}),ref=(label:string,reference:string):Field=>({label,type:'reference',reference});
export const resources:Record<string,Resource>={
 categories:{label:'Categories',fields:{name:text('Name'),slug:text('Slug')}},
 serving_options:{label:'Serving sizes',fields:{name:text('Serving label')}},
 products:{label:'Products',fields:{name:text('Name'),slug:text('Slug'),category_id:ref('Category','categories'),description:{label:'Description',type:'textarea'},image_path:text('Image path'),is_published:{label:'Published',type:'boolean'}}},
 product_variants:{label:'Product variants',fields:{product_id:ref('Product','products'),serving_option_id:ref('Serving','serving_options'),sku:text('SKU'),price:{label:'Price (PHP)',type:'money',nullable:true}}},
 option_groups:{label:'Option groups',fields:{name:text('Name'),required:{label:'Required choice',type:'boolean'},max_selections:{label:'Maximum choices',type:'number'}}},
 options:{label:'Options',fields:{name:text('Name'),option_group_id:ref('Group','option_groups')}},
 product_option_groups:{label:'Product option groups',fields:{product_id:ref('Product','products'),option_group_id:ref('Option group','option_groups')}},
 variant_options:{label:'Variant options',fields:{variant_id:ref('Variant','product_variants'),option_id:ref('Option','options'),price:{label:'Additional price (PHP)',type:'money'}}},
 units:{label:'Stock units',fields:{name:text('Name')}},
 ingredients:{label:'Ingredients',fields:{name:text('Name'),unit_id:ref('Base unit','units'),reorder_level:{label:'Low-stock threshold',type:'quantity'}}},
 recipe_items:{label:'Base recipes',fields:{variant_id:ref('Variant','product_variants'),ingredient_id:ref('Ingredient','ingredients'),quantity:{label:'Quantity per serving',type:'quantity'}}},
 option_recipe_items:{label:'Add-on recipes',fields:{variant_option_id:ref('Variant option','variant_options'),ingredient_id:ref('Ingredient','ingredients'),quantity:{label:'Quantity per option',type:'quantity'}}}
};
export const schemaFor=(resource:Resource,partial=false)=>{
 const shape:Record<string,z.ZodType>={};
 for(const [key,f]of Object.entries(resource.fields)){
 let s:z.ZodType=f.type==='boolean'?z.boolean():['reference','number'].includes(f.type)?z.number().int().positive().max(100000000):f.type==='money'?z.string().regex(/^\d{1,8}(\.\d{1,2})?$/):f.type==='quantity'?z.string().regex(/^\d{1,9}(\.\d{1,3})?$/):z.string().trim().max(f.type==='textarea'?4000:150);
 if(key==='image_path')s=z.string().regex(/^\/assets\/[a-zA-Z0-9._/-]+$/).max(255);
 if(key==='slug')s=z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(150);
 if(f.nullable)s=s.nullable();shape[key]=s;
 }
 const schema=z.object(shape).strict();return partial?schema.partial():schema;
};

