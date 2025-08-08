const http = require('http');
const { parse } = require('url');
const { StringDecoder } = require('string_decoder');
const crypto = require('crypto');

/**
 * Simple in-memory data stores for demonstration.
 * NOTE: This is NOT production ready. Data will reset on server restart.
 */
const users = [];
const templates = [
  {
    id: 'template1',
    name: 'Basic Template',
    thumbnailUrl: '/static/basic-thumb.png',
    backgroundUrl: '/static/basic-bg.png',
    elements: []
  }
];
const orders = [];

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function generateId() {
  return crypto.randomBytes(8).toString('hex');
}

const server = http.createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', chunk => buffer += decoder.write(chunk));
  req.on('end', () => {
    buffer += decoder.end();
    let body = {};
    try { body = buffer ? JSON.parse(buffer) : {}; } catch(err) { body = {}; }

    // Routes
    if (req.method === 'POST' && parsedUrl.pathname === '/register') {
      const { email, password } = body;
      if (!email || !password) return sendJson(res, 400, { error: 'Missing fields' });
      const existing = users.find(u => u.email === email);
      if (existing) return sendJson(res, 400, { error: 'User exists' });
      const user = { id: generateId(), email, passwordHash: password, createdAt: Date.now() };
      users.push(user);
      return sendJson(res, 201, { id: user.id, email: user.email });
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/login') {
      const { email, password } = body;
      const user = users.find(u => u.email === email && u.passwordHash === password);
      if (!user) return sendJson(res, 401, { error: 'Invalid credentials' });
      return sendJson(res, 200, { message: 'Logged in', userId: user.id });
    }

    if (req.method === 'GET' && parsedUrl.pathname === '/templates') {
      return sendJson(res, 200, templates);
    }

    if (req.method === 'POST' && parsedUrl.pathname === '/orders') {
      const { userId, templateId, userData } = body;
      const user = users.find(u => u.id === userId);
      const template = templates.find(t => t.id === templateId);
      if (!user || !template) return sendJson(res, 400, { error: 'Invalid user or template' });
      const order = {
        id: generateId(),
        userId: user.id,
        templateId: template.id,
        userData: userData || {},
        status: 'pending_payment',
        paymentSlipUrl: '',
        finalPdfUrl: '',
        createdAt: Date.now(),
        approvedAt: null,
        expiresAt: null
      };
      orders.push(order);
      return sendJson(res, 201, order);
    }

    if (req.method === 'POST' && parsedUrl.pathname.match(/^\/orders\/[^\/]+\/payment$/)) {
      const orderId = parsedUrl.pathname.split('/')[2];
      const order = orders.find(o => o.id === orderId);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });
      order.status = 'pending_verification';
      order.paymentSlipUrl = body.paymentSlipUrl || '';
      return sendJson(res, 200, order);
    }

    if (req.method === 'GET' && parsedUrl.pathname.match(/^\/orders\/[^\/]+$/)) {
      const orderId = parsedUrl.pathname.split('/')[2];
      const order = orders.find(o => o.id === orderId);
      if (!order) return sendJson(res, 404, { error: 'Order not found' });
      return sendJson(res, 200, order);
    }

    sendJson(res, 404, { error: 'Not found' });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
