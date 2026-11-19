// Small helpers that work both on Vercel and in the local Vite dev middleware
// (plain Node req/res — no Express-style res.status()).

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}

/** Request body as a plain object; anything else (array, null, number) is a 400. */
function parseBody(req) {
  const raw = req.body; // a getter on Vercel — may throw on malformed JSON
  const body = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw ?? {});
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }
  return body;
}

/** Wraps a handler: POST-only, JSON body, uniform error responses. */
export function postHandler(fn) {
  return async (req, res) => {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return sendJson(res, 405, { error: 'Method not allowed' });
    }
    try {
      const body = parseBody(req);
      const result = await fn(req, body);
      return sendJson(res, 200, { ok: true, ...result });
    } catch (err) {
      if (err instanceof HttpError) return sendJson(res, err.status, { error: err.message });
      // Vercel throws its own error (statusCode 400) when req.body is malformed JSON
      if (err instanceof SyntaxError || err?.statusCode === 400) {
        return sendJson(res, 400, { error: 'Invalid JSON body' });
      }
      console.error('[api] unexpected error', err);
      return sendJson(res, 500, { error: 'Something went wrong. Please try again.' });
    }
  };
}
