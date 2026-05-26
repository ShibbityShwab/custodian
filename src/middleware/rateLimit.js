const REQUESTS_PER_MINUTE = 60;
const requestCounts = new Map();

export function rateLimit() {
  setInterval(() => requestCounts.clear(), 60 * 1000);

  return async (c, next) => {
    const ip = c.req.header('X-Forwarded-For') || c.req.header('X-Real-IP') || 'unknown';
    const count = (requestCounts.get(ip) || 0) + 1;
    requestCounts.set(ip, count);

    if (count > REQUESTS_PER_MINUTE) {
      return c.text('Too many requests', 429);
    }

    await next();
  };
}
