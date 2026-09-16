import { db } from '../../database/connection.js';
export const listRecords=(table:string,archived:boolean,page:number,q:string,searchable:boolean)=>{const query=db(table).where(function(){if(archived)this.whereNotNull('deleted_at');else this.whereNull('deleted_at');});if(q&&searchable)query.where('name','like','%'+q+'%');return query.orderBy('id','desc').limit(100).offset((page-1)*100);};

