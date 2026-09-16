import { assert } from '../errors/app-error.js';
export function milli(value:string|number):number{const n=Number(value);assert(Number.isFinite(n),422,'Invalid quantity.');const amount=Math.round(n*1000);assert(Number.isSafeInteger(amount)&&Math.abs(amount/1000-n)<0.0000001,422,'Use up to three decimal places.');return amount;}
export const quantity=(n:number)=>(n/1000).toFixed(3);

