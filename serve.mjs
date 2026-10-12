import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const mime = {
  html: 'text/html',
  css: 'text/css',
  js: 'application/javascript',
  png: 'image/png',
  jpg: 'image/jpeg',
  svg: 'image/svg+xml',
  json: 'application/json'
};

const server = http.createServer((req, res) => {
  let file = req.url === '/' ? 'index.html' : req.url.slice(1).split('?')[0];
  let fullPath = path.resolve(file);
  
  if (!fs.existsSync(fullPath) || fs.statSync(fullPath).isDirectory()) {
    fullPath = path.resolve(file, 'index.html');
  }

  if (!fs.existsSync(fullPath)) {
    res.statusCode = 404;
    return res.end('Not found');
  }

  const ext = path.extname(fullPath).slice(1);
  res.setHeader('Content-Type', mime[ext] || 'application/octet-stream');
  fs.createReadStream(fullPath).pipe(res);
});

server.listen(8088, () => {
  console.log('Local preview server listening on http://localhost:8088');
});
