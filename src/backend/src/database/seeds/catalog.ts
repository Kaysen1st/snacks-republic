import type { Knex } from 'knex';
import { env } from '../../shared/config/env.js';
export async function seed(k:Knex){
 if(await k('categories').first()) throw new Error('Seed only an empty application database. Existing data was not changed.');
 await k.transaction(async t=>{
 await t('roles').insert(['admin','manager','cashier','kitchen'].map(code=>({code,name:code})));
 await t('categories').insert(['Fruity Soda','Silog Meals','Kanto Foods','Samyang Noodles','Sandwiches','Other Drinks'].map((name,i)=>({id:i+1,name,slug:name.toLowerCase().replaceAll(' ','-')})));
 await t('serving_options').insert(['12 oz','16 oz','22 oz','1 stick','3 pieces','4 pieces','Regular serving'].map((name,i)=>({id:i+1,name})));
 await t('option_groups').insert([{id:1,name:'Flavor',required:true,max_selections:1},{id:2,name:'Add-ons',required:false,max_selections:4}]);
 await t('options').insert(['Strawberry','Green Apple','Lychee','Blueberry','Fresh Lemonade'].map((name,i)=>({id:i+1,name,option_group_id:1})));
 await t('options').insert(['Extra Cheese Sauce','Chicken Poppers','Egg','Spam Slice'].map((name,i)=>({id:i+6,name,option_group_id:2})));
 const products=[
 {name:'Fruity Soda',category:1,description:'A little fizz. A lot of happiness. Pick your fruity flavor and make it your kind of refreshment.',image:'soda-hero.png',variants:[[1,30],[2,40],[3,50]]},
 ...['Bangsilog','Hotsilog','Longsilog','Porksilog','Siomai Rice','Shanghai Rice','Spam Rice'].map(name=>({name,category:2,description:'A filling favorite from our silog and rice menu. Details coming soon.',image:'02-overview-menu.png',variants:[[7,null]]})),
 ...[['Fish Ball',4,10],['Kikiam',4,10],['Kwek Kwek',6,20],['Hotdog on Stick',4,15],['French Fries',7,15],['Siomai',5,20],['Shanghai',5,75]].map(([name,serving,price])=>({name:String(name),category:3,description:'Your merienda favorite, made for a happy snack break.',image:'04-kanto-foods-menu.png',variants:[[serving,price]]})),
 ...['Cheesy Spicy Samyang Noodles','Cheesy Spicy Samyang Carbonara','Cheesy Samyang Noodles'].map(name=>({name,category:4,description:'Cozy, cheesy noodles for a big craving. Make it yours with your favorite add-ons.',image:'noodles.png',variants:[[7,130]]})),
 {name:'Spam Sandwich Overload',category:5,description:'Layers of satisfying bites in our signature overloaded sandwich.',image:'spam-sandwich.png',variants:[[7,175]]},
 {name:'Hotdog Sandwich Overload',category:5,description:'A fully loaded hotdog sandwich for your next merienda moment.',image:'hotdog-sandwich.png',variants:[[7,65]]},
 {name:'Strawberry Summer Drink',category:6,description:'A strawberry moment from our summer drink collection. Details coming soon.',image:'07-strawberry-drink.png',variants:[[7,null]]}
 ];
 await t('units').insert({id:1,name:'demo serving'});
 for(const [index,p]of products.entries()){
 const id=index+1; const slug=p.name.toLowerCase().replaceAll(' ','-');
 await t('products').insert({id,name:p.name,slug,category_id:p.category,description:p.description,image_path:'/assets/'+p.image,is_published:p.variants.some(v=>v[1]!==null)});
 if(p.category===1||p.category===4)await t('product_option_groups').insert({product_id:id,option_group_id:p.category===1?1:2});
 for(const [serving,price]of p.variants){
 const [variant]=await t('product_variants').insert({product_id:id,serving_option_id:serving,sku:slug+'-'+serving,price,recipe_ready:env.DEMO_MODE&&price!==null});
 if(p.category===1||p.category===4){const opts=p.category===1?[1,2,3,4,5]:[6,7,8,9];for(const option_id of opts)await t('variant_options').insert({variant_id:variant,option_id,price:option_id<=5?0:[40,35,20,25][option_id-6]});}
 if(env.DEMO_MODE&&price!==null){
 const [ingredient]=await t('ingredients').insert({name:'DEMO · '+p.name+' · '+serving,unit_id:1,reorder_level:10});
 await t('inventory_balances').insert({ingredient_id:ingredient,quantity:100});
 await t('recipe_items').insert({variant_id:variant,ingredient_id:ingredient,quantity:1});
 await t('inventory_movements').insert({ingredient_id:ingredient,quantity:100,reason:'Development sample stock — replace with real recipes',operation_key:'demo-seed-'+ingredient});
 }
 }
 }
 await t('store_settings').insert({id:1,name:'Snacks Republic by PJRB',headline:'Fruity sips. Happy bites.',about:'Welcome to Snacks Republic by PJRB—your spot for refreshing fruity sodas and satisfying bites. Choose your favorite fruity flavor and pair it with kanto snacks, silog meals, cheesy Samyang noodles, or an overloaded sandwich. From a quick merienda to a filling meal, find something for your craving.',facebook_url:'https://www.facebook.com/profile.php?id=61591189150675',currency:'PHP',accepting_orders:env.DEMO_MODE});
 });
}
