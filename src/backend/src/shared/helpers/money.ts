import { AppError } from '../errors/app-error.js';
export function cents(value: string | number): number {
 const text=String(value); if(!/^\d+(\.\d{1,2})?$/.test(text)) throw new AppError(422,'Enter a valid amount with up to two decimal places.');
 const [whole, fraction='']=text.split('.'); const result=Number(whole)*100+Number(fraction.padEnd(2,'0'));
 if (!Number.isSafeInteger(result) || result>9999999999) throw new AppError(422,'Amount is too large.');
 return result;
}
export function money(value: number): string { if(!Number.isSafeInteger(value)||value<0)throw new AppError(422,'Invalid amount.'); return (value/100).toFixed(2); }

