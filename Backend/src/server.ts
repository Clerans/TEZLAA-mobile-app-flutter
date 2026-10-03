import http from 'http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/database.js';
import { initSocket } from './sockets/index.js';
import reservationService from './services/reservation.service.js';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSocket(server);

// Start HTTP Server
const PORT = Number(env.PORT) || 5000;

server.listen(PORT, () => {
  console.log(`
  ======================================================
  ☕ TEZLAA Artisan Food & Café API Server
  🚀 Environment: ${env.NODE_ENV}
  🌐 Listening on: http://localhost:${PORT}
  📡 API Base URL: http://localhost:${PORT}${env.API_PREFIX}
  💓 Health Check: http://localhost:${PORT}${env.API_PREFIX}/health
  ======================================================
  `);

  // Start periodic reservation cleanup (runs every 5 minutes)
  const cleanupTimer = setInterval(() => {
    reservationService.expireStaleReservations().catch((err) => {
      console.error('Reservation cleanup error:', err);
    });
  }, 5 * 60 * 1000);
  cleanupTimer.unref();
});

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('🔒 Closed HTTP Server.');
    try {
      await prisma.$disconnect();
      console.log('🗄️ Disconnected Prisma database client.');
    } catch (err) {
      console.error('Error disconnecting database:', err);
    }
    process.exit(0);
  });

  // Force shutdown after 10s if hung
  setTimeout(() => {
    console.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { server, io };
