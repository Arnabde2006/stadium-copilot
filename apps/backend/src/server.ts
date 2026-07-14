import app from './app';
import { startCrowdSimulation, stopCrowdSimulation } from './services/crowdSimulator';

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🏟️  Stadium Copilot Server listening on port ${PORT}`);
  console.log(`🚀 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===============================================`);

  // Start background crowd simulator interval
  startCrowdSimulation(8000);
});

// Graceful shutdown handling
const gracefulShutdown = () => {
  console.log('\nStopping server, cleaning up resources...');
  stopCrowdSimulation();
  server.close(() => {
    console.log('Server shut down successfully.');
    process.exit(0);
  });
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
