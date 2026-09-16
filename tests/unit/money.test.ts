import { describe,it,expect } from 'vitest';import { cents,money } from '../../src/backend/src/shared/helpers/money.js';import { milli,quantity } from '../../src/backend/src/shared/helpers/quantity.js';
describe('exact monetary and inventory calculations',()=>{
 it('handles decimal prices exactly',()=>{expect(cents('0.10')+cents('0.20')).toBe(30);expect(money(17525)).toBe('175.25');});
 it('rejects invalid prices',()=>{for(const value of ['-1','NaN','1.234','1e2',''])expect(()=>cents(value)).toThrow();});
 it('handles fractional recipes and reversals',()=>{expect(milli('0.125')*3).toBe(375);expect(quantity(-375)).toBe('-0.375');expect(()=>milli('0.0001')).toThrow();});
});
