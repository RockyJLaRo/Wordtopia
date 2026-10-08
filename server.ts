import express from 'express';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import { authMiddleware } from './server/security';
import { authRouter } from './server/routes/auth';
import { progressRouter } from './server/routes/progress';
import { feedbackRouter } from './server/routes/feedback';
import { analyticsRouter } from './server/routes/analytics';
import { errorsRouter } from './server/routes/errors';
import { adminRouter } from './server/routes/admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';

  // Support command line arguments like --port 3000 --host 0.0.0.0 passed by runner
  const args = process.argv.slice(2);
  const portIndex = args.indexOf('--port');
  const cliPort = portIndex !== -1 && args[portIndex + 1] ? parseInt(args[portIndex + 1], 10) : undefined;
  const hostIndex = args.indexOf('--host');
  const cliHost = hostIndex !== -1 && args[hostIndex + 1] ? args[hostIndex + 1] : '0.0.0.0';

  // In development, prioritize CLI port or 3000 (never accidentally bind to Cloud Run's 8080 nginx port)
  const PORT = cliPort || (isProd && process.env.PORT ? parseInt(process.env.PORT, 10) : 3000);

  // Behind Cloud Run/AI Studio's proxy: use the client IP from X-Forwarded-For so login rate
  // limiting is per player rather than one shared bucket for everyone.
  if (isProd) app.set('trust proxy', 1);

  // gzip text responses (JS/CSS/HTML/JSON): roughly 3-4x less data on mobile connections
  app.use(compression());

  // Static files are served before body parsing/auth so asset requests skip session lookups.
  if (isProd) {
    // Vite emits content-hashed file names under /assets, so they can be cached "forever".
    app.use(
      '/assets',
      express.static(path.resolve(__dirname, 'dist/assets'), { immutable: true, maxAge: '1y', fallthrough: false })
    );
  }
  // Serve static assets from public (sprites rarely change; let browsers reuse them for a week)
  app.use(
    express.static(path.resolve(__dirname, 'public'), {
      setHeaders: (res, filePath) => {
        if (filePath.includes(`${path.sep}sprites${path.sep}`)) res.setHeader('Cache-Control', 'public, max-age=604800');
      },
    })
  );

  // Middlewares
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(cookieParser());
  app.use(authMiddleware);

  // Mount API endpoints
  app.use('/api/auth', authRouter);
  app.use('/api/progress', progressRouter);
  app.use('/api/feedback', feedbackRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/errors', errorsRouter);
  app.use('/api/admin', adminRouter);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Vite integration
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, 'vite.config.ts'),
      server: {
        middlewareMode: true,
        host: cliHost,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built dist folder. index.html and the service worker must always be
    // revalidated so players pick up new releases.
    app.use(
      express.static(path.resolve(__dirname, 'dist'), {
        setHeaders: (res, filePath) => {
          if (/(index\.html|sw\.js|manifest\.webmanifest)$/.test(filePath)) res.setHeader('Cache-Control', 'no-cache');
        },
      })
    );
    // Unknown API routes are real 404s, not the SPA page.
    app.use('/api', (_req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-cache');
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  // Graceful error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const status = Number(err?.status || err?.statusCode) || 500;
    if (status >= 500) console.error('Unhandled server error:', err);
    // e.g. a stale /assets/*.js request after a deploy must be a 404 (the client then reloads),
    // and a malformed JSON body is a 400, not a server crash.
    res.status(status).json({ error: status >= 500 ? 'Internal server error' : 'Request could not be processed' });
  });

  const server = app.listen(PORT, cliHost, () => {
    console.log(`[Wordtopia Server] Running on http://${cliHost}:${PORT} in ${isProd ? 'production' : 'development'} mode`);
  });

  // Handle process signals gracefully
  const handleShutdown = () => {
    server.close(() => {
      process.exit(0);
    });
    // Don't hang forever on keep-alive connections; pending DB writes flush on exit.
    setTimeout(() => process.exit(0), 5000).unref();
  };
  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
