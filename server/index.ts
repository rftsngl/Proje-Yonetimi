import express from 'express';
import { createServer } from 'node:http';
import path from 'node:path';
import { env } from './config/env.js';
import { initializeDatabase } from './db/init.js';
import { apiRouter } from './routes/api.js';

const app = express();

app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use('/api', apiRouter);

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  res.status(500).json({
    message: 'Sunucu tarafinda beklenmeyen bir hata olustu.',
  });
});

const listenWithFallback = (preferredPort: number, maxAttempts = 10) =>
  new Promise<number>((resolve, reject) => {
    const tryPort = (port: number, attempt: number) => {
      const server = createServer(app);

      server.once('error', (error: NodeJS.ErrnoException) => {
        if (error.code === 'EADDRINUSE' && attempt < maxAttempts) {
          console.warn(`Port ${port} zaten kullanimda. ${port + 1} deneniyor...`);
          tryPort(port + 1, attempt + 1);
          return;
        }

        reject(error);
      });

      server.once('listening', () => {
        resolve(port);
      });

      server.listen(port);
    };

    tryPort(preferredPort, 0);
  });

const start = async () => {
  await initializeDatabase();

  const activePort = await listenWithFallback(env.port);
  console.log(`Backend hazir: http://localhost:${activePort}`);

  if (activePort !== env.port) {
    console.warn(`.env icindeki PORT ve VITE_API_PROXY_TARGET degerlerini ${activePort} ile esitlemen iyi olur.`);
  }
};

start().catch((error) => {
  console.error('Sunucu baslatilamadi:', error);
  process.exit(1);
});
