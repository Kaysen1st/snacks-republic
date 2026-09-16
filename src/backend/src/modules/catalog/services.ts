import { catalogRows } from './models.js';
import { env } from '../../shared/config/env.js';
import { AppError } from '../../shared/errors/app-error.js';
export async function getCatalog(){const data=await catalogRows();if(!data.store)throw new AppError(503,'Store setup is not complete. Please try again later.');return {...data,demo:env.DEMO_MODE};}

