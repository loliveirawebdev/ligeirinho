// Serves the web app's development build to the e2e run: its files, index.html for every other route, and /api
// proxied to the e2e API without the prefix. The build comes from the Nx cache when the app didn't change, so the
// e2e skips compiling it.
// Usage: tsx tools/serve-e2e-web.ts <browser dir> <port> <api origin>
import { readFile } from 'node:fs/promises';
import { createServer, request as forward, type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';

class MissingArgument extends Error {
  override readonly name = 'MissingArgument';

  constructor(argumentName: string) {
    super(`${argumentName} is required. Usage: tsx tools/serve-e2e-web.ts <browser dir> <port> <api origin>`);
  }
}

function requireArgument(position: number, argumentName: string): string {
  const value = process.argv[position];
  if (value === undefined || value === '') {
    throw new MissingArgument(argumentName);
  }
  return value;
}

const browserDirectory = path.resolve(requireArgument(2, 'browser dir'));
const port = Number(requireArgument(3, 'port'));
const apiOrigin = new URL(requireArgument(4, 'api origin'));
const API_PREFIX = '/api';

const CONTENT_TYPES: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

async function readAsset(urlPath: string): Promise<{ readonly body: Buffer; readonly extension: string }> {
  const requestedPath = path.normalize(path.join(browserDirectory, decodeURIComponent(urlPath)));
  const extension = path.extname(requestedPath);
  if (requestedPath.startsWith(browserDirectory + path.sep) && extension !== '') {
    return { body: await readFile(requestedPath), extension };
  }
  return { body: await readFile(path.join(browserDirectory, 'index.html')), extension: '.html' };
}

function serveAsset(urlPath: string, response: ServerResponse): void {
  readAsset(urlPath).then(
    (asset) => {
      response.writeHead(200, { 'content-type': CONTENT_TYPES[asset.extension] ?? 'application/octet-stream' });
      response.end(asset.body);
    },
    () => {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('Not found');
    },
  );
}

function proxyToApi(incoming: IncomingMessage, response: ServerResponse, apiPath: string): void {
  const outgoing = forward(
    {
      hostname: apiOrigin.hostname,
      port: apiOrigin.port,
      path: apiPath,
      method: incoming.method,
      headers: { ...incoming.headers, host: apiOrigin.host },
    },
    (apiResponse) => {
      response.writeHead(apiResponse.statusCode ?? 502, apiResponse.headers);
      apiResponse.pipe(response);
    },
  );
  outgoing.on('error', () => {
    response.writeHead(502, { 'content-type': 'text/plain' });
    response.end('The e2e API is not answering');
  });
  incoming.pipe(outgoing);
}

const server = createServer((incoming, response) => {
  const url = new URL(incoming.url ?? '/', 'http://localhost');
  if (url.pathname === API_PREFIX || url.pathname.startsWith(`${API_PREFIX}/`)) {
    proxyToApi(incoming, response, `${url.pathname.slice(API_PREFIX.length) || '/'}${url.search}`);
    return;
  }
  serveAsset(url.pathname, response);
});

server.listen(port, () => {
  process.stdout.write(`Web app (development build) served at http://localhost:${String(port)}\n`);
});
