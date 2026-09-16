let csrf='';
export function setCsrf(value:string){csrf=value;}
export async function api<T>(path:string,options:RequestInit={}):Promise<T>{
 let response:Response;
 try{response=await fetch((import.meta.env.VITE_API_BASE_URL||'/api/v1')+path,{...options,credentials:'same-origin',headers:{'Content-Type':'application/json',...(csrf?{'X-CSRF-Token':csrf}:{}),...options.headers}});}catch{throw new Error('We could not connect. Check your connection and try again.');}
 if(!response.ok){const data=await response.json().catch(()=>({error:'The service is unavailable. Please try again.'}));throw new Error(data.error||'Something went wrong.');}
 return response.status===204?undefined as T:response.json();
}
export const peso=(value:string|number)=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:2,minimumFractionDigits:0}).format(Number(value));

