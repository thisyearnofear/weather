/**
 * Redis Service - Server-side caching layer
 * Handles all Redis operations that should only run on the server
 */

let redisClientPromise = null;

export const getRedisClient = async () => {
  // Only allow this to run on the server
  if (typeof window !== 'undefined') {
    console.warn('RedisService should not be imported in client-side code');
    return null;
  }

  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!redisClientPromise) {
    const { createClient } = await import('redis');
    const client = createClient({ url });
    client.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    await client.connect();
    redisClientPromise = client;
  }
  return redisClientPromise;
};