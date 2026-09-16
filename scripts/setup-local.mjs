import mysql from 'mysql2/promise';
import { randomBytes } from 'node:crypto';import { writeFile,access } from 'node:fs/promises';import { spawnSync } from 'node:child_process';
try{await access('.env');throw new Error('.env already exists. Setup will not overwrite it.');}catch(e){if(e.code!=='ENOENT')throw e;}
const password=()=>randomBytes(24).toString('hex');
const rootPassword=password(),migrationPassword=password(),appPassword=password(),staffPassword=password(),secret=password();
const connection=await mysql.createConnection({host:'127.0.0.1',port:3307,user:'root',password:''});
await writeFile('.runtime/mysql-admin.json',JSON.stringify({host:'127.0.0.1',port:3307,user:'root',password:rootPassword}));
await connection.query("ALTER USER 'root'@'localhost' IDENTIFIED BY ?",[rootPassword]);
await connection.query('CREATE DATABASE IF NOT EXISTS snacks_republic_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
for(const [user,pass]of [['snacks_migrator',migrationPassword],['snacks_app',appPassword]]){
 await connection.query('CREATE USER ?@? IDENTIFIED BY ?',[user,'127.0.0.1',pass]);
 await connection.query((user==='snacks_migrator'?'GRANT ALL PRIVILEGES':'GRANT SELECT, INSERT, UPDATE, DELETE')+' ON snacks_republic_demo.* TO ?@?',[user,'127.0.0.1']);
}
await connection.end();
const config={NODE_ENV:'development',PORT:'3001',APP_ORIGIN:'http://127.0.0.1:5173',DB_HOST:'127.0.0.1',DB_PORT:'3307',DB_NAME:'snacks_republic_demo',DB_USER:'snacks_app',DB_PASSWORD:appPassword,SESSION_SECRET:secret,SESSION_TTL_HOURS:'12',DEMO_MODE:'true',VITE_API_BASE_URL:'/api/v1'};
await writeFile('.env',Object.entries(config).map(([key,value])=>key+'='+value).join('\n')+'\n');
await writeFile('.runtime/migration-env.json',JSON.stringify({...config,DB_USER:'snacks_migrator',DB_PASSWORD:migrationPassword}));
for(const command of ['migrate','seed','export']){
 const child=spawnSync(process.execPath,['--import','tsx','src/backend/src/database/cli.ts',command],{stdio:'inherit',env:{...process.env,...config,DB_USER:'snacks_migrator',DB_PASSWORD:migrationPassword}});
 if(child.status)process.exit(child.status);
}
const result=spawnSync(process.execPath,['--import','tsx','src/backend/src/database/create-staff.ts'],{stdio:'inherit',env:{...process.env,...config,STAFF_USERNAME:'admin',STAFF_NAME:'Demo manager',STAFF_PASSWORD:staffPassword}});
if(result.status)process.exit(result.status);
await writeFile('.runtime/demo-access.txt','Local demo only\nStorefront: http://127.0.0.1:5173\nStaff: http://127.0.0.1:5173/staff\nUsername: admin\nPassword: '+staffPassword+'\nMySQL Workbench: 127.0.0.1:3307, database snacks_republic_demo\nRuntime DB credentials are in .env.\nMigration credentials are in .runtime/migration-env.json.\n');
console.log('[setup:Local] Ready. Local credentials saved in .runtime/demo-access.txt; no secrets printed.');

