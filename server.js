const express = require('express');
const bcrypt = require('bcrypt');
const cors = require('cors');
const helmet = require('helmet');
const { rateLimit } = require('express-rate-limit');
const path = require('node:path');
const { isIP } = require('node:net');

function createApp(DB, { authLimit = 30, trustedProxies = process.env.TRUSTED_PROXIES || '' } = {}) {
  const app = express();
  const proxyIPs = trustedProxies.split(',').map(ip => ip.trim()).filter(Boolean);
  if (proxyIPs.some(ip => !isIP(ip))) {
    throw new Error('TRUSTED_PROXIES must contain comma-separated proxy IP addresses.');
  }
  // Match known peers rather than a hop count: tunnel routes can have different lengths.
  if (proxyIPs.length) app.set('trust proxy', proxyIPs);
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: [process.env.CLIENT_ORIGIN, process.env.DEV_CLIENT_ORIGIN].filter(Boolean) }));
  app.use(express.json({ limit: '16kb' }));
  const api = express.Router();
  app.use('/api', api);
  api.use((_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  const fail = (res, status, msg) => res.status(status).json({ msg });
  const validText = (value, max) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
  const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: authLimit, standardHeaders: 'draft-8', legacyHeaders: false, message: { msg: 'Too many attempts. Please try again in 15 minutes.' } });
  // Readiness is public so Docker can check it without a user's session.
  api.get('/health', async (_req, res) => {
    try {
      await DB.ping();
      res.json({ status: 'ok' });
    } catch {
      res.status(503).json({ status: 'unavailable' });
    }
  });
  api.use('/auth/login', authLimiter);
  api.use('/auth/register', authLimiter);
  for (const action of ['register', 'login']) {
    api.post(`/auth/${action}`, async (req, res) => {
      const { username, password } = req.body || {};
      if (!validText(username, 100) || typeof password !== 'string' || !password.length || Buffer.byteLength(password) > 72 || (action === 'register' && password.length < 8)) {
        return fail(res, 400, action === 'register' ? 'Enter a username and a password of at least 8 characters (at most 72 bytes).' : 'Enter a valid username and password.');
      }
      let user = await DB.getUser(username);
      if (action === 'register') {
        if (user) return fail(res, 409, 'That username is already registered.');
        user = await DB.createUser(username, password);
      } else {
        if (!user || !await bcrypt.compare(password, user.password)) return fail(res, 401, 'Incorrect username or password.');
        user = await DB.ensureSession(user);
      }
      res.status(action === 'register' ? 201 : 200).json({ id: user._id, username: user.username, token: user.token });
    });
  }
  api.use(async (req, res, next) => {
    const match = /^Bearer ([a-zA-Z0-9-]{32,128})$/.exec(req.get('authorization') || '');
    if (!match) return fail(res, 401, 'Please log in to continue.');
    const user = await DB.getUserByToken(match[1]);
    if (!user) return fail(res, 401, 'Your session is no longer valid. Please log in again.');
    req.user = user;
    next();
  });
  api.post('/auth/logout', async (req, res) => { await DB.clearSession(req.user); res.sendStatus(204); });
  api.get('/user/:username', (req, res) => res.json({ username: req.user.username, authenticated: req.params.username === req.user.username }));
  api.get('/plants', async (req, res) => res.json(await DB.getPlants(req.user.username)));
  api.post('/plant', async (req, res) => {
    if (!validText(req.body?.name, 200)) return fail(res, 400, 'Enter a plant name of 1–200 characters.');
    await DB.addPlant({ name: req.body.name.trim(), owner: req.user.username, actions: [], flagged: false });
    res.status(201).json(await DB.getPlants(req.user.username));
  });
  api.param('id', async (req, res, next, id) => {
    if (!/^[a-f\d]{24}$/i.test(id)) return fail(res, 400, 'Invalid plant ID.');
    const plant = await DB.getPlantById(id);
    if (!plant || plant.owner !== req.user.username) return fail(res, 404, 'Plant not found.');
    req.plant = plant;
    next();
  });
  api.get('/plant/:id', (req, res) => res.json(req.plant));
  for (const [action, label] of Object.entries({ water: 'Watered', fertilize: 'Fertilized', repot: 'Repotted' })) {
    api.post(`/plant/:id/${action}`, async (req, res) => res.json(await DB.addActionToPlant(req.params.id, label)));
  }
  api.post('/plant/:id/flag', async (req, res) => res.json(await DB.flagPlant(req.params.id, !req.plant.flagged)));
  api.put('/plant/:id', async (req, res) => {
    if (!validText(req.body?.name, 200)) return fail(res, 400, 'Enter a plant name of 1–200 characters.');
    await DB.updatePlant(req.params.id, { name: req.body.name.trim() });
    res.json(await DB.getPlantById(req.params.id));
  });
  api.delete('/plant/:id', async (req, res) => {
    await DB.deletePlant(req.params.id);
    res.json(await DB.getPlants(req.user.username));
  });
  api.post('/search', async (req, res) => {
    const { query, maxEdits = 1 } = req.body || {};
    if (!validText(query, 200) || ![1, 2].includes(maxEdits)) return fail(res, 400, 'Enter a search term and a valid search tolerance.');
    res.json(await DB.searchPlants(query, req.user.username, maxEdits));
  });
  api.use((_req, res) => fail(res, 404, 'API endpoint not found.'));
  const publicDir = path.join(__dirname, 'app', 'dist');
  app.use(express.static(publicDir));
  app.get('/{*path}', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));
  app.use((err, _req, res, _next) => {
    if (err.code === 11000) return fail(res, 409, 'That username is already registered.');
    if (err.type === 'entity.too.large') return fail(res, 413, 'Request is too large.');
    if (err.type === 'entity.parse.failed') return fail(res, 400, 'Invalid JSON request.');
    console.error('Request failed:', err.name);
    fail(res, 500, 'Something went wrong. Please try again.');
  });
  return app;
}
module.exports = { createApp };
