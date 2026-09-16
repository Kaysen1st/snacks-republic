import { chromium } from '@playwright/test';
const browser=await chromium.launch();const page=await browser.newPage({viewport:{width:320,height:844}});
await page.goto('http://127.0.0.1:5173/');await page.getByRole('button',{name:'Add Fruity Soda',exact:true}).waitFor();
console.log(await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,elements:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+1||r.left< -1);}).map(e=>({tag:e.tagName,class:e.className,left:Math.round(e.getBoundingClientRect().left),right:Math.round(e.getBoundingClientRect().right),width:Math.round(e.getBoundingClientRect().width)})).slice(0,35)})));
await browser.close();
