import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  mongodbUri:
    process.env.MONGODB_URI ?? 'mongodb://localhost:27017/clawhub-layer',
  convexCloudUrl:
    process.env.CONVEX_CLOUD_URL ?? 'https://wry-manatee-359.convex.cloud',
  convexSiteUrl:
    process.env.CONVEX_SITE_URL ?? 'https://wry-manatee-359.convex.site',
  syncIntervalMinutes:
    parseInt(process.env.SYNC_INTERVAL_MINUTES ?? '60', 10) || 60,
  cacheTtlMs:
    (parseInt(process.env.CACHE_TTL_HOURS ?? '3', 10) || 3) * 60 * 60 * 1000,
  port: parseInt(process.env.PORT ?? '3000', 10),
}));
