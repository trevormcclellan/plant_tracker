const { test } = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcrypt');
const { createApp } = require('../server');
const id = '123456789012345678901234';
const token = '12345678-1234-1234-1234-123456789012';

async function setup(t, overrides = {}, options) {
  const state = { plant: { _id: id, owner: 'alice', name: 'Fern', actions: [] } };
  const DB = {
    getUserByToken: async value => value === token ? { username: 'alice', token } : null,
    getUser: async () => null,
    getPlants: async () => [state.plant],
    getPlantById: async () => state.plant,
    addPlant: async plant => { state.added = plant; },
    updatePlant: async (_id, update) => { state.updated = update; },
    addActionToPlant: async (_id, type) => ({ ...state.plant, actions: [{ type }] }),
    flagPlant: async (_id, flagged) => ({ ...state.plant, flagged }),
    deletePlant: async () => { state.deleted = true; },
    clearSession: async () => { state.loggedOut = true; },
    ...overrides,
  };
  const server = createApp(DB, options).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const request = async (path, { auth = token, body, method = 'GET' } = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api${path}`, {
      method, headers: { ...(auth ? { Authorization: `Bearer ${auth}` } : {}), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body), signal: AbortSignal.timeout(3000),
    });
    return { status: response.status, headers: response.headers, body: response.status === 204 ? null : await response.json() };
  };
  return { request, state };
}

test('missing and invalid tokens return promptly with 401', async t => {
  const { request } = await setup(t);
  for (const auth of [null, 'bad', '00000000-0000-0000-0000-000000000000']) assert.equal((await request('/plants', { auth })).status, 401);
});
test('object credentials cannot inject MongoDB query operators', async t => {
  const { request } = await setup(t, { getUser: () => { throw Error('must not query'); } });
  assert.equal((await request('/auth/login', { method: 'POST', body: { username: { $ne: null }, password: 'password' } })).status, 400);
});
test('creation ignores forged ownership and arbitrary fields', async t => {
  const { request, state } = await setup(t);
  assert.equal((await request('/plant', { method: 'POST', body: { name: ' Fern ', owner: 'bob', _id: id, actions: ['forged'] } })).status, 201);
  assert.deepEqual(state.added, { name: 'Fern', owner: 'alice', actions: [], flagged: false });
});
test('updates allow only the plant name', async t => {
  const { request, state } = await setup(t);
  assert.equal((await request(`/plant/${id}`, { method: 'PUT', body: { name: 'Palm', owner: 'bob', actions: [] } })).status, 200);
  assert.deepEqual(state.updated, { name: 'Palm' });
});
test('all detail and mutation routes enforce ownership', async t => {
  const { request } = await setup(t, { getPlantById: async () => ({ owner: 'bob' }) });
  for (const [suffix, method] of [['', 'GET'], ['', 'PUT'], ['', 'DELETE'], ['/water', 'POST'], ['/fertilize', 'POST'], ['/repot', 'POST'], ['/flag', 'POST']]) {
    assert.equal((await request(`/plant/${id}${suffix}`, { method, ...(method === 'PUT' ? { body: { name: 'Palm' } } : {}) })).status, 404);
  }
});
test('invalid IDs, empty names and search operators produce validation errors', async t => {
  const { request } = await setup(t);
  assert.equal((await request('/plant/invalid')).status, 400);
  assert.equal((await request('/plant', { method: 'POST', body: { name: '  ' } })).status, 400);
  assert.equal((await request('/search', { method: 'POST', body: { query: { $ne: null } } })).status, 400);
});
test('database failures return safe errors and security headers', async t => {
  const { request } = await setup(t, { getPlants: async () => { throw Error('database-secret'); } });
  const result = await request('/plants');
  assert.equal(result.status, 500);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  assert.equal(result.headers.get('x-content-type-options'), 'nosniff');
  assert.ok(!JSON.stringify(result.body).includes('database-secret'));
});
test('auth endpoints are rate limited', async t => {
  const { request } = await setup(t, {}, { authLimit: 2 });
  for (let i = 0; i < 2; i++) await request('/auth/login', { method: 'POST', body: {} });
  assert.equal((await request('/auth/login', { method: 'POST', body: {} })).status, 429);
});
test('login reuses the session and logout revokes it', async t => {
  const password = await bcrypt.hash('password123', 4);
  const { request, state } = await setup(t, {
    getUser: async () => ({ username: 'alice', password, token }),
    ensureSession: async user => user,
  });
  const result = await request('/auth/login', { method: 'POST', body: { username: 'alice', password: 'password123' } });
  assert.equal(result.status, 200);
  assert.equal(result.body.token, token);
  assert.equal((await request('/auth/logout', { method: 'POST' })).status, 204);
  assert.equal(state.loggedOut, true);
});
test('successful care operations preserve response format', async t => {
  const { request } = await setup(t);
  for (const [action, label] of [['water','Watered'], ['fertilize','Fertilized'], ['repot','Repotted']]) {
    const result = await request(`/plant/${id}/${action}`, { method: 'POST' });
    assert.equal(result.status, 200);
    assert.equal(result.body.actions[0].type, label);
  }
});
