require('dotenv').config();
const DB = require('./database');
const { createApp } = require('./server');

async function start() {
  await DB.initialize();
  const server = createApp(DB).listen(process.argv[2] || process.env.PORT || 4000, () => console.log('Plant tracker is listening.'));
  const shutdown = () => {
    const timeout = setTimeout(() => process.exit(1), 10000);
    timeout.unref();
    server.close(async () => { await DB.close(); process.exit(0); });
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}
start().catch(err => { console.error('Startup failed:', err.message); process.exit(1); });
