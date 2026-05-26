const MAX_BODY_SIZE = 64 * 1024;

export function bodyLimit() {
  return async (c, next) => {
    const contentLength = parseInt(c.req.header('Content-Length') || '0', 10);
    if (contentLength > MAX_BODY_SIZE) {
      return c.text('Request body too large', 413);
    }
    await next();
  };
}
