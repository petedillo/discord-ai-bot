import http from 'node:http';
import { getMetrics } from './index.js';
import { logger } from '../utils/index.js';

let server: http.Server | null = null;

/**
 * Create the metrics HTTP application
 */
export function getMetricsApp() {
  return async (req: http.IncomingMessage, res: http.ServerResponse) => {
    const url = req.url || '/';

    if (url === '/metrics') {
      try {
        const metrics = await getMetrics();
        res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end(metrics);
      } catch {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error generating metrics');
      }
    } else if (url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  };
}

/**
 * Start the metrics HTTP server
 */
export async function startMetricsServer(port: number): Promise<http.Server> {
  if (server) {
    throw new Error('Metrics server is already running');
  }

  const app = getMetricsApp();
  server = http.createServer(app);

  return new Promise((resolve, reject) => {
    if (!server) {
      reject(new Error('Failed to create server'));
      return;
    }

    server.listen(port, () => {
      resolve(server as http.Server);
    });

    server.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Stop the metrics HTTP server
 */
export async function stopMetricsServer(): Promise<void> {
  if (!server) {
    return;
  }

  return new Promise((resolve, reject) => {
    if (!server) {
      resolve();
      return;
    }

    server.close((error) => {
      if (error) {
        reject(error);
      } else {
        server = null;
        logger.debug('[Metrics] Server stopped');
        resolve();
      }
    });
  });
}
