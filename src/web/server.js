import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

let signals = [];
let scanStatus = { stocksScanned: 0, lastRefresh: null, scanning: false };

export function updateSignals(newSignals) {
  signals = newSignals;
}

export function updateScanStatus(status) {
  scanStatus = { ...scanStatus, ...status };
}

export function startWebServer(port = 3000) {
  const app = express();

  app.get('/api/signals', (req, res) => {
    res.json({ signals, status: scanStatus });
  });

  app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });

  app.listen(port, () => {
    console.log(`\n  Dashboard: http://localhost:${port}\n`);
  });
}
