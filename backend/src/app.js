// backend/src/app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import meRoutes from './routes/me.routes.js';
import groupRoutes from './routes/group.routes.js';
import assignmentRoutes from './routes/assignment.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { errorHandler } from './middleware/error.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/me', meRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandler);

export default app;