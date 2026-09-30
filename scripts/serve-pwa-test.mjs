import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/foody-clear-front/browser');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const path = resolve(root, `.${pathname}`);
    if (path !== root && !path.startsWith(root + sep)) {
      response.writeHead(403).end(); return;
    }
    // Dynamic API data is never served as the HTML shell or cached here.
    if (pathname.startsWith('/api/')) {
      response.writeHead(503, { 'Content-Type': 'application/json' }).end(JSON.stringify({ message: 'Test API offline' })); return;
    }
    let content;
    let extension = extname(path);
    try { content = await readFile(path); }
    catch {
      if (extension) { response.writeHead(404).end(); return; }
      content = await readFile(resolve(root, 'index.html')); extension = '.html';
    }
    response.writeHead(200, { 'Content-Type': mime[extension] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' }).end(content);
  } catch { response.writeHead(500).end(); }
});
server.listen(4300, '127.0.0.1');
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
