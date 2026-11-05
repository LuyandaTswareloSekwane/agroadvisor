import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { fail } from './lib/response';
import { healthRoutes } from './routes/health';
import { speechRoutes } from './routes/speech';
import { visionRoutes } from './routes/vision';
import { weatherRoutes } from './routes/weather';
import type { AppEnv } from './types/env';

const app = new Hono<AppEnv>().basePath('/api');

app.use('*', (c, next) =>
  cors({
    origin: c.env.ALLOWED_ORIGIN,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    maxAge: 86400,
  })(c, next),
);

app.route('/health', healthRoutes);
app.route('/speech', speechRoutes);
app.route('/weather', weatherRoutes);
app.route('/vision', visionRoutes);

app.notFound((c) => fail(c, 'Route not found', 404));

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return fail(c, err.message, err.status);
  }
  console.error('Unhandled error:', err);
  return fail(c, 'Internal server error', 500);
});

export default app;
