import { createContext,useContext,useEffect,useState } from 'react';import type { ReactNode } from 'react';import type { CartItem,Product,Variant } from '../../../contracts/types';
interface CartContextValue {items:CartItem[];add:(p:Product,v:Variant,options:number[],quantity:number)=>void;setQuantity:(key:string,n:number)=>void;clear:()=>void;total:number;count:number;open:boolean;setOpen:(v:boolean)=>void}
const CartContext=createContext<CartContextValue|null>(null);
export function lineUnit(item:CartItem){return Number(item.variant.price)+item.option_ids.reduce((sum,id)=>sum+Number(item.product.options.find(o=>o.id===id&&o.variant_id===item.variant.id)?.price||0),0);}
export function CartProvider({children}:{children:ReactNode}){
 const [items,setItems]=useState<CartItem[]>(()=>{try{const raw=JSON.parse(localStorage.getItem('sr-cart')||'[]');return Array.isArray(raw)?raw.filter(i=>i?.product?.id&&i?.variant?.id&&Number.isInteger(i.quantity)&&i.quantity>0&&i.quantity<=50&&Array.isArray(i.option_ids)):[];}catch{return [];}});
 const [open,setOpen]=useState(false);
 useEffect(()=>{localStorage.setItem('sr-cart',JSON.stringify(items));},[items]);
 function add(product:Product,variant:Variant,option_ids:number[],quantity:number){const sorted=[...option_ids].sort((a,b)=>a-b),key=variant.id+':'+sorted.join(',');setItems(old=>{const found=old.find(i=>i.key===key);return found?old.map(i=>i.key===key?{...i,quantity:Math.min(50,i.quantity+quantity)}:i):[...old,{key,product,variant,option_ids:sorted,quantity}];});}
 function setQuantity(key:string,n:number){setItems(old=>n<=0?old.filter(i=>i.key!==key):old.map(i=>i.key===key?{...i,quantity:Math.min(50,n)}:i));}
 return <CartContext.Provider value={{items,add,setQuantity,clear:()=>setItems([]),total:items.reduce((sum,i)=>sum+Math.round(lineUnit(i)*100)*i.quantity,0)/100,count:items.reduce((n,i)=>n+i.quantity,0),open,setOpen}}>{children}</CartContext.Provider>;
}
export const useCart=()=>{const cart=useContext(CartContext);if(!cart)throw new Error('CartProvider is missing');return cart;};

