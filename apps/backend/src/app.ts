import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import assistantRouter from './routes/assistant';
import reuniteRouter from './routes/reunite';
import staffRouter from './routes/staff';

// Bootstrap environment configurations
dotenv.config();

const app = express();

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
