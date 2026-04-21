const app = require('./app');
const db = require('./config/db');
const { PORT, SEED_ON_START } = require('./config/env');
const { seedUsers } = require('./utils/seed');

async function start() {
  await db.connect();
  if (SEED_ON_START) {
    const results = await seedUsers();
    console.log('Seed results:', results);
  }
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Auth service listening on port ${PORT}`);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await db.close();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start().catch((err) => {
  console.error('Fatal start error:', err);
  process.exit(1);
});
