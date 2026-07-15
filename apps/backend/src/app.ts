import dotenv from 'dotenv';
// Bootstrap environment configurations immediately
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import assistantRouter from './routes/assistant';
import reuniteRouter from './routes/reunite';
import staffRouter from './routes/staff';

const app = express();

// Restore req.url from Vercel's x-matched-path or x-invoke-path headers
app.use((req, res, next) => {
  const matchedPath = req.headers['x-matched-path'] || req.headers['x-invoke-path'];
  if (matchedPath) {
    const rawPath = Array.isArray(matchedPath) ? matchedPath[0] : matchedPath;
    req.url = rawPath;
  }
  next();
});

app.use(cors());
app.use(express.json());

// Register Assistant API routes
app.use('/api/assistant', assistantRouter);
app.use('/api/assistant', reuniteRouter);
app.use('/api/staff', staffRouter);

// Serves static client assets in production
const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));

// Support React client SPA routing
app.get('*', (req, res) => {
  // Prevent catching API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

export default app;
