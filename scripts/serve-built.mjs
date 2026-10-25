// Static preview matching production's clean-URL -> .html mapping. No writes.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve('dist');
const types = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.xml':'application/xml', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon', '.woff2':'font/woff2', '.txt':'text/plain' };
http.createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = resolve(root, '.' + pathname);
    if (file !== root && !file.startsWith(root + sep)) throw new Error('path');
    if (pathname.endsWith('/')) file = resolve(file, 'index.html');
    else if (!extname(file)) file += '.html';
    await stat(file);
    res.writeHead(200, {'Content-Type':types[extname(file)] || 'application/octet-stream'});
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, {'Content-Type':'text/html; charset=utf-8'});
    res.end(await readFile(resolve(root, '404.html')));
  }
}).listen(Number(process.env.PORT || 4326), '127.0.0.1', () => console.log('Built site: http://127.0.0.1:' + (process.env.PORT || 4326)));
