/* ============================================================
   serve.js — 本地静态服务器 + Kimi 代理（团队演示模式）
   ------------------------------------------------------------
   用法（Key 走环境变量，不落任何文件）：

   Windows CMD：
     set KIMI_API_KEY=sk-你的key && node serve.js
   Windows PowerShell：
     $env:KIMI_API_KEY="sk-你的key"; node serve.js
   macOS / Linux：
     KIMI_API_KEY=sk-你的key node serve.js

   可选：KIMI_MODEL 指定模型（默认 kimi-k2-0905-preview）
   可选：PORT 指定端口（默认 8080）

   访问 http://localhost:8080 —— 设了 Key 时「测一测」免填 Key；
   未设 Key 时代理自动关闭，页面退回「填 Key」模式。
   ============================================================ */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 8080;
const KIMI_KEY = process.env.KIMI_API_KEY || '';
const KIMI_MODEL = process.env.KIMI_MODEL || 'kimi-k2-0905-preview';
const MOONSHOT_URL = 'https://api.moonshot.cn/v1/chat/completions';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => { data += c; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

http.createServer(async (req, res) => {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  // ---- API：代理状态探测（前端据此决定走代理还是填 Key） ----
  if (req.method === 'GET' && urlPath === '/api/config') {
    sendJson(res, 200, { proxy: !!KIMI_KEY, model: KIMI_MODEL });
    return;
  }

  // ---- API：Kimi 代理（Key 只在服务器内存，前端永远碰不到） ----
  if (req.method === 'POST' && urlPath === '/api/chat') {
    if (!KIMI_KEY) {
      sendJson(res, 503, { error: { message: '代理未启用：服务器未配置 KIMI_API_KEY' } });
      return;
    }
    try {
      const body = await readBody(req);
      const upstream = await fetch(MOONSHOT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + KIMI_KEY },
        body: body
      });
      const text = await upstream.text();
      res.writeHead(upstream.status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(text);
    } catch (e) {
      sendJson(res, 500, { error: { message: '代理转发失败：' + e.message } });
    }
    return;
  }

  // ---- 静态文件 ----
  let filePath = urlPath === '/' ? '/index.html' : urlPath;
  const absPath = path.join(ROOT, filePath);
  if (!absPath.startsWith(ROOT)) { res.writeHead(403); res.end('Forbidden'); return; }
  fs.readFile(absPath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('404 Not Found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(absPath)] || 'application/octet-stream' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log('本地服务已启动：http://localhost:' + PORT);
  console.log(KIMI_KEY ? 'Kimi 代理：已启用（模型 ' + KIMI_MODEL + '）——测一测免填 Key' : 'Kimi 代理：未启用（未设置 KIMI_API_KEY，页面将要求填 Key）');
  console.log('按 Ctrl+C 停止');
});
