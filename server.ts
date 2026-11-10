import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;
const SITES_PATH = path.join(ROOT, 'sites.json');
const REPORTS_DIR = path.join(ROOT, 'public', 'reports');

app.use(express.json());

// Helper to safely read JSON
async function readJson(filePath: string, fallback: any = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// 1. Get sites configuration
app.get('/api/sites', async (_req, res) => {
  try {
    const data = await readJson(SITES_PATH, { settings: {}, sites: [] });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Update sites configuration
app.post('/api/sites', async (req, res) => {
  try {
    const { settings, sites } = req.body;
    if (!Array.isArray(sites)) {
      return res.status(400).json({ error: 'sites must be an array' });
    }
    const current = await readJson(SITES_PATH, { settings: {}, sites: [] });
    const updated = {
      settings: settings || current.settings || {},
      sites
    };
    await fs.writeFile(SITES_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
    res.json({ success: true, count: sites.length });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Live site health check (HTTP probe)
app.post('/api/live-check', async (req, res) => {
  const { url, timeoutMs = 15000 } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SiteMonitor/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;

    res.json({
      url,
      status: response.ok ? 'OK' : 'FAIL',
      httpStatus: response.status,
      statusText: response.statusText,
      durationMs,
      checkedAt: new Date().toISOString()
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    const durationMs = Date.now() - startTime;
    res.json({
      url,
      status: 'FAIL',
      httpStatus: null,
      error: error.name === 'AbortError' ? `요청 시간 초과 (${timeoutMs}ms)` : error.message,
      durationMs,
      checkedAt: new Date().toISOString()
    });
  }
});

// 4. Batch live check for all configured sites
app.post('/api/live-check-all', async (_req, res) => {
  try {
    const config = await readJson(SITES_PATH, { sites: [] });
    const sites = config.sites || [];

    const results = await Promise.all(
      sites.map(async (site: any) => {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
          const response = await fetch(site.url, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 SiteMonitor/1.0',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            signal: controller.signal,
            redirect: 'follow'
          });
          clearTimeout(timeoutId);
          return {
            name: site.name,
            url: site.url,
            status: response.ok ? 'OK' : 'FAIL',
            httpStatus: response.status,
            statusText: response.statusText,
            durationMs: Date.now() - startTime,
            checkedAt: new Date().toISOString()
          };
        } catch (error: any) {
          clearTimeout(timeoutId);
          return {
            name: site.name,
            url: site.url,
            status: 'FAIL',
            httpStatus: null,
            error: error.name === 'AbortError' ? '요청 시간 초과 (15000ms)' : error.message,
            durationMs: Date.now() - startTime,
            checkedAt: new Date().toISOString()
          };
        }
      })
    );

    res.json({
      total: results.length,
      failed: results.filter(r => r.status !== 'OK').length,
      checkedAt: new Date().toISOString(),
      items: results
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Sync from GitHub Pages
app.get('/api/github-sync', async (_req, res) => {
  try {
    const targetUrl = 'https://jaytyk.github.io/site-monitor/reports/index.json?v=' + Date.now();
    const response = await fetch(targetUrl, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`GitHub Pages fetch returned ${response.status}`);
    }
    const data = await response.json();
    res.json({ success: true, source: 'https://jaytyk.github.io/site-monitor/', data });
  } catch (err: any) {
    res.status(502).json({ success: false, error: err.message });
  }
});

// Static files for reports & assets
app.use('/reports', express.static(REPORTS_DIR));
app.use('/assets', express.static(path.join(ROOT, 'public', 'assets')));

// Setup Vite or production static handler
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(ROOT, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(ROOT, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Site Monitor server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
