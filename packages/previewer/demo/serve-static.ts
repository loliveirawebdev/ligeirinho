// Serves the built demo app with an SPA fallback, for the smoke test and the e2e-kit end-to-end test.
// Usage: node demo/serve-static.ts [port]
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';

const browserDirectory = path.join(import.meta.dirname, 'dist', 'browser');
const port = Number(process.argv[2] ?? process.env['PORT'] ?? 4310);

const contentTypes: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

async function readAsset(urlPath: string): Promise<{ readonly body: Buffer; readonly extension: string }> {
  const requestedPath = path.normalize(path.join(browserDirectory, decodeURIComponent(urlPath)));
  const isInsideBrowserDirectory = requestedPath.startsWith(browserDirectory + path.sep);
  const extension = path.extname(requestedPath);
  if (isInsideBrowserDirectory && extension !== '') {
    return { body: await readFile(requestedPath), extension };
  }
  return { body: await readFile(path.join(browserDirectory, 'index.html')), extension: '.html' };
}

const server = createServer((request, response) => {
  const urlPath = new URL(request.url ?? '/', 'http://localhost').pathname;
  readAsset(urlPath).then(
    (asset) => {
      response.writeHead(200, { 'content-type': contentTypes[asset.extension] ?? 'application/octet-stream' });
      response.end(asset.body);
    },
    () => {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('Not found');
    },
  );
});

server.listen(port, () => {
  process.stdout.write(`Demo served at http://localhost:${port}\n`);
});
