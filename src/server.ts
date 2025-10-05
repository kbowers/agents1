import express from 'express';
import 'dotenv/config';
import { initDb } from '../db/index.ts';
import authRoutes from './routes/auth.ts';
import notesRoutes from './routes/notes.ts';
import { errorHandler } from './middleware/errorHandler.ts';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDb();

// JSON body parsing middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// API routes
app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);

// Central error handler
app.use(errorHandler);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

export default app;