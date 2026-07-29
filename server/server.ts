import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dashboardRouter } from './routes/dashboard.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);


  app.use(express.json());


  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });


  const { chatRouter } = await import('./routes/chat.js');
  app.use('/api/chat', chatRouter);


  const { eventsRouter } = await import('./routes/events.js');
  app.use('/api/events', eventsRouter);


  const { authRouter } = await import('./routes/auth.js');
  app.use('/api/auth', authRouter);
  app.use('/api/dashboard', dashboardRouter);


  const { transactionsRouter } = await import('./routes/transactions.js');
  app.use('/api/transactions', transactionsRouter);


  const { reviewsRouter } = await import('./routes/reviews.js');
  app.use('/api/reviews', reviewsRouter);


  const { bookingsRouter } = await import('./routes/bookings.js');
  app.use('/api/bookings', bookingsRouter);


  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {

    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }


  const { expireOldPendingBookings } = await import('./services/bookingExpiry.js');
  setInterval(async () => {
    try {
      const n = await expireOldPendingBookings();
      if (n > 0) console.log(`[Scheduler] Expired ${n} stale booking(s) and restored their seats.`);
    } catch (err) {
      console.error('[Scheduler] booking expiry failed:', err);
    }
  }, 5 * 60 * 1000);




  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
