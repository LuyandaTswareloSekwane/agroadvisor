import { Hono } from 'hono';
import { ok } from '../lib/response';
import type { AppEnv } from '../types/env';

interface HealthStatus {
  status: 'ok';
  timestamp: string;
}

export const healthRoutes = new Hono<AppEnv>();

healthRoutes.get('/', (c) => {
  const data: HealthStatus = { status: 'ok', timestamp: new Date().toISOString() };
  return ok(c, data, 'AgroAdvisor API is running');
});
