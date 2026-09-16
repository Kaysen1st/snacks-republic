import * as initial from './migrations/001-initial.js';import * as integrity from './migrations/002-integrity-and-brand.js';
const migrations={'001-initial':initial,'002-integrity-and-brand':integrity};
export const migrationSource={getMigrations:async()=>Object.keys(migrations),getMigrationName:(name:string)=>name,getMigration:async(name:string)=>migrations[name as keyof typeof migrations]};

