import knex from 'knex';
import { env } from '../shared/config/env.js';
export const db = knex({client:'mysql2',connection:{host:env.DB_HOST,port:env.DB_PORT,user:env.DB_USER,password:env.DB_PASSWORD,database:env.DB_NAME,timezone:'Z',decimalNumbers:false},pool:{min:0,max:10,afterCreate:(connection:any, done:any)=>connection.query("SET time_zone = '+00:00'",(error:any)=>done(error,connection))}});

