import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import embedHandler from './api/embed.ts';
import analyzeHandler from './api/analyze.ts';
import briefHandler from './api/brief.ts';
import sampleDataHandler from './api/sample-data.ts';
import statusHandler from './api/status.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '15mb' }));

  // API endpoints
  app.post('/api/embed', async (req, res) => {
    await embedHandler(req, res);
  });

  app.post('/api/analyze', async (req, res) => {
    await analyzeHandler(req, res);
  });

  app.post('/api/brief', async (req, res) => {
    await briefHandler(req, res);
  });

  app.get('/api/sample-data', (req, res) => {
    sampleDataHandler(req, res);
  });

  app.get('/api/status', (req, res) => {
    statusHandler(req, res);
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static files from dist
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`DriftWatch server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
