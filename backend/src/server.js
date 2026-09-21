import app from './app.js';
import env from './config/env.config.js';
import { connectDatabase } from './config/db.config.js';

connectDatabase()
  .then(() => app.listen(env.PORT, () => console.log(`API running on http://localhost:${env.PORT}`)))
  .catch((error) => {
    console.error('Could not start server:', error.message);
    process.exit(1);
  });
