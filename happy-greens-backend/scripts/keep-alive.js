#!/usr/bin/env node

/**
 * Lightweight keep-alive ping for the Render backend.
 *
 * Recommended production setup:
 * - Use an external monitor such as UptimeRobot
 * - Ping https://your-backend.onrender.com/api/health every 10 minutes
 *
 * This script is useful if you want to run the same ping loop from another
 * worker, cron job, or always-on environment.
 */

const HEALTH_URL = process.env.KEEP_ALIVE_URL || 'https://happy-greens-18n3.onrender.com/api/health';
const INTERVAL_MS = Number(process.env.KEEP_ALIVE_INTERVAL_MS || 10 * 60 * 1000);

const pingHealth = async () => {
  const startedAt = Date.now();

  try {
    const response = await fetch(HEALTH_URL, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    const elapsed = Date.now() - startedAt;
    if (!response.ok) {
      console.error(`[keep-alive] ${response.status} from ${HEALTH_URL} in ${elapsed}ms`);
      return;
    }

    console.log(`[keep-alive] ok ${HEALTH_URL} in ${elapsed}ms`);
  } catch (error) {
    console.error(`[keep-alive] failed for ${HEALTH_URL}:`, error.message || error);
  }
};

void pingHealth();
setInterval(() => {
  void pingHealth();
}, INTERVAL_MS);
