import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/**
 * Dev-only: serves /api/<group>/<action> from the same files Vercel deploys,
 * so `pnpm dev` runs the whole app locally without the Vercel CLI.
 * Not used in production builds — Vercel runs /api itself.
 */
function localApi() {
  return {
    name: 'local-api',
    apply: 'serve',
    configureServer(server) {
      // Server-only env (no VITE_ prefix) for the /api code; never sent to the browser.
      const env = loadEnv(server.config.mode, process.cwd(), '');
      for (const [k, v] of Object.entries(env)) if (!(k in process.env)) process.env[k] = v;

      server.middlewares.use('/api', async (req, res) => {
        const [path] = (req.url ?? '').split('?');
        const match = /^\/([a-z-]+)\/([a-z-]+)$/.exec(path);
        if (!match) {
          res.statusCode = 404;
          return res.end(JSON.stringify({ error: 'Not found' }));
        }
        const [, group, action] = match;
        try {
          const chunks = [];
          for await (const c of req) chunks.push(c);
          req.body = Buffer.concat(chunks).toString() || '{}';
          req.query = { action };
          const mod = await server.ssrLoadModule(`/api/${group}/[action].js`);
          await mod.default(req, res);
        } catch (err) {
          console.error('[local-api]', err);
          if (!res.writableEnded) {
            res.statusCode = err.code === 'ERR_LOAD_URL' ? 404 : 500;
            res.end(JSON.stringify({ error: 'Not found or failed' }));
          }
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), localApi()],
});
