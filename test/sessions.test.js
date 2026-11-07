const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient } = require('mongodb');

// Exercise the real session functions against an in-memory collection.
test('sessions persist until manual logout', async t => {
  let stored;
  const matches = query => stored && Object.entries(query).every(([key, value]) => {
    if (value && typeof value === 'object') {
      if ('$exists' in value) return (key in stored) === value.$exists;
      if ('$gt' in value) return stored[key] > value.$gt;
    }
    return stored[key] === value;
  });
  const users = {
    async findOne(query) { return matches(query) ? { ...stored } : null; },
    async insertOne(user) { stored = { ...user, _id: 'alice-id' }; },
    async updateOne(query, update) {
      if (!matches(query)) return;
      Object.assign(stored, update.$set);
      for (const key of Object.keys(update.$unset || {})) delete stored[key];
    },
  };
  t.mock.method(MongoClient.prototype, 'db', () => ({ collection: () => users }));
  const previousUri = process.env.MONGODB_URI;
  process.env.MONGODB_URI = 'mongodb://localhost:27017';
  const DB = require('../database');
  t.after(async () => {
    await DB.close();
    if (previousUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = previousUri;
  });

  await t.test('new accounts have a persistent token', async () => {
    const user = await DB.createUser('alice', 'password123');
    assert.ok(user.token);
    assert.equal(user.tokenExpiresAt, undefined);
    assert.equal((await DB.getUserByToken(user.token)).username, 'alice');
  });
  await t.test('existing tokens work even with an old expiration date', async () => {
    stored.tokenExpiresAt = new Date('2000-01-01');
    const user = await DB.getUserByToken(stored.token);
    assert.equal(user.username, 'alice');
    assert.equal((await DB.ensureSession(user)).token, user.token);
    assert.equal((await DB.ensureSession(user)).token, user.token);
  });
  await t.test('logout revokes the old token and login creates a fresh one', async () => {
    const oldToken = stored.token;
    await DB.clearSession({ ...stored });
    assert.equal(await DB.getUserByToken(oldToken), null);
    const user = await DB.ensureSession({ ...stored });
    assert.ok(user.token);
    assert.notEqual(user.token, oldToken);
    assert.equal(await DB.getUserByToken(oldToken), null);
    assert.equal((await DB.getUserByToken(user.token)).username, 'alice');
  });
  await t.test('simultaneous logins after logout share a token', async () => {
    const oldSession = { ...stored };
    await DB.clearSession(oldSession);
    const loggedOutUser = { ...stored };
    const [first, second] = await Promise.all([
      DB.ensureSession(loggedOutUser), DB.ensureSession(loggedOutUser),
    ]);
    assert.equal(first.token, second.token);
    // A delayed logout for the previous session must not revoke the new token.
    await DB.clearSession(oldSession);
    assert.equal((await DB.getUserByToken(first.token)).username, 'alice');
  });
  await t.test('missing or object tokens never match an account', async () => {
    for (const token of [undefined, null, '', { $ne: null }]) {
      assert.equal(await DB.getUserByToken(token), null);
    }
  });
});
