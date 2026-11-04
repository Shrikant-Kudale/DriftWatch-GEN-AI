import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import embedHandler from './api/embed.ts';
import analyzeHandler from './api/analyze.ts';
import briefHandler from './api/brief.ts';

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

  // Helper endpoint to load all sample docs and sample change at once
  app.get('/api/sample-data', (req, res) => {
    try {
      const docsDir = path.join(__dirname, 'public', 'docs');
      const files = fs.readdirSync(docsDir).filter((f) => f.endsWith('.md'));
      const docs = files.map((file) => {
        const fullPath = path.join(docsDir, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        return { filename: file, content };
      });

      const sampleChangePath = path.join(__dirname, 'data', 'sample-change.txt');
      let sampleChange = '';
      if (fs.existsSync(sampleChangePath)) {
        sampleChange = fs.readFileSync(sampleChangePath, 'utf-8');
      }

      return res.status(200).json({ docs, sampleChange });
    } catch (e: any) {
      console.error('Error loading sample data:', e);
      return res.status(500).json({ error: 'Failed to load sample docs from disk.' });
    }
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
