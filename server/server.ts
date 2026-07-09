import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parsing middleware
  app.use(express.json());

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  // Events REST endpoints
  const { eventsRouter } = await import('./routes/events.js');
  app.use('/api/events', eventsRouter);

  // Authentication REST endpoints
  const { authRouter } = await import('./routes/auth.js');
  app.use('/api/auth', authRouter);

  // Transactions & Promotions endpoints
  const { transactionsRouter } = await import('./routes/transactions.js');
  app.use('/api/transactions', transactionsRouter);

  // Event Reviews & Feedback endpoints
  const { reviewsRouter } = await import('./routes/reviews.js');
  app.use('/api/reviews', reviewsRouter);

  // Vite middleware integration for dynamic full-stack development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static frontend files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
