import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env.config.js';
import apiRouter from './http/router.js';
import { notFound } from './middleware/notFound.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

const app = express();

app.use(cors({ origin: env.FRONTEND_URL }));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// All API routes are registered in one place.
app.use('/api', apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
