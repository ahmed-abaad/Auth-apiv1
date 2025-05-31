require('dotenv').config();
const app = require('./app');
const http = require('http');
const { pool } = require('./config/database');
const logger = require('./utils/logger');

// Get port from environment and store in Express
const port = process.env.PORT;
app.set('port', port);

// Create HTTP server
const server = http.createServer(app);

// Test database connection on startup
async function testDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    logger.info('✅ Database connection successful');
    connection.release();
  } catch (error) {
    logger.error('❌ Database connection failed:', error.message);
    process.exit(1); // Exit with failure
  }
}

// Graceful shutdown
function gracefulShutdown() {
  server.close(async () => {
    logger.info('🛑 Server closed');
    
    try {
      await pool.end();
      logger.info('✅ Database pool closed');
      process.exit(0);
    } catch (err) {
      logger.error('❌ Error closing database pool:', err);
      process.exit(1);
    }
  });

  // Force close server after 5 seconds
  setTimeout(() => {
    logger.error('❌ Forcing server shutdown');
    process.exit(1);
  }, 5000);
}

// Event listener for HTTP server "error" event
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
}

// Event listener for HTTP server "listening" event
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
  logger.info(`🚀 Server listening on ${bind}`);
}

// Server setup
async function startServer() {
  
  
  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);

  // Handle shutdown signals
  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
}

startServer();