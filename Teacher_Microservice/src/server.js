const app = require('./app');
const db = require('./config/db');
const envConfig = require('./config/env');

const PORT = envConfig.PORT;

const startServer = async () => {
  try {
    await db.connect();

    const server = app.listen(PORT, () => {
      console.log(`Teacher Service is running on port ${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        db.close();
      });
    });

    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        db.close();
      });
    });
  } catch (error) {
    console.error('Failed to start Teacher Service:', error.message);
    process.exit(1);
  }
};

startServer();
