import express from 'express';
import cookieParser from 'cookie-parser';
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

  // Middlewares
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(cookieParser());
  app.use(authMiddleware);

  // Serve static assets from public
  app.use(express.static(path.resolve(__dirname, 'public')));

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
    // Production: serve built dist folder
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  // Graceful error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  const server = app.listen(PORT, cliHost, () => {
    console.log(`[Wordtopia Server] Running on http://${cliHost}:${PORT} in ${isProd ? 'production' : 'development'} mode`);
  });

  // Handle process signals gracefully
  const handleShutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };
  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
