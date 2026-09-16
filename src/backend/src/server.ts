import { app } from './app.js';import { env } from './shared/config/env.js';import { db } from './database/connection.js';
const server=app.listen(env.PORT,env.HOST,()=>console.log('[server:API] Listening on http://'+env.HOST+':'+env.PORT));
const close=()=>server.close(()=>{void db.destroy().then(()=>process.exit(0));});process.on('SIGINT',close);process.on('SIGTERM',close);
