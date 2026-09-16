import { writeFile, mkdir, readFile } from 'node:fs/promises';
import knex from 'knex';
import { env } from '../shared/config/env.js';
import * as initial from './migrations/001-initial.js';
import { migrationSource } from './migration-source.js';
import { seed } from './seeds/catalog.js';
let local:any=null;
if(env.NODE_ENV!=='production'){try{local=JSON.parse(await readFile('.runtime/migration-env.json','utf8'));}catch(e:any){if(e.code!=='ENOENT')throw e;}}
const config=local||env;
const db=knex({client:'mysql2',connection:{host:config.DB_HOST,port:Number(config.DB_PORT),database:config.DB_NAME,user:config.DB_USER,password:config.DB_PASSWORD,timezone:'Z'}});
try{
 const command=process.argv[2];
 if(command==='migrate')await db.migrate.latest({migrationSource});
 else if(command==='rollback')await db.migrate.rollback({migrationSource});
 else if(command==='seed')await seed(db);
 else if(command==='export'){
 const statements:string[]=['-- Snacks Republic: exported schema. No customer data or credentials.','SET NAMES utf8mb4;'];
 for(const table of initial.tables){const [rows]=await db.raw('SHOW CREATE TABLE ??',[table]);statements.push(rows[0]['Create Table']+';');}
 await mkdir('docs/database',{recursive:true});await writeFile('docs/database/schema.sql',statements.join('\n\n')+'\n');
 const [relations]=await db.raw('SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL',[config.DB_NAME]);
 const lines=['# Database relationships','','Generated from the migrated MySQL foreign keys. Every application table ends with deleted_at, created_at, updated_at.','','~~~mermaid','erDiagram'];
 for(const r of relations)lines.push('  '+r.REFERENCED_TABLE_NAME+' ||--o{ '+r.TABLE_NAME+' : "'+r.COLUMN_NAME+'"');
 lines.push('~~~','');await writeFile('docs/database/ER_DIAGRAM.md',lines.join('\n'));
 }else throw new Error('Use migrate, rollback, seed, or export');
 console.log('[database:CLI] '+command+' complete');
}catch(e){console.error('[database:CLI]',e instanceof Error?e.message:'Failed');process.exitCode=1;}finally{await db.destroy();}
