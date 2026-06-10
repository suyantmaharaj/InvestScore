import dotenv from 'dotenv';
dotenv.config();  // must run before any import that reads process.env

import express from 'express';
import cors    from 'cors';

import authRoutes       from './routes/auth.routes';
import smeRoutes        from './routes/sme.routes';
import submissionRoutes from './routes/submission.routes';
import scoringRoutes    from './routes/scoring.routes';
import pmRoutes         from './routes/pm.routes';
import adminRoutes         from './routes/admin.routes';
import aiRoutes            from './routes/ai.routes';
import notificationRoutes  from './routes/notifications.routes';
import learningRoutes      from './routes/learning.routes';

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use('/api/auth',        authRoutes);
app.use('/api/sme',         smeRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/scoring',     scoringRoutes);
app.use('/api/pm',          pmRoutes);
app.use('/api/admin',       adminRoutes);
app.use('/api/ai',            aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/learning',      learningRoutes);

app.get('/health', (_, res) => res.json({ status: 'ok', service: 'InvestScore API' }));

app.listen(PORT, () => {
  console.log(`InvestScore API running on port ${PORT}`);
});

export default app;
