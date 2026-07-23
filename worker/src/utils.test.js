import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidSlug, isValidUrl, timingSafeEqual, genSlug } from './utils.js';

test('isValidSlug accepts alnum/dash/underscore only', () => {
  assert.equal(isValidSlug('my-link_1'), true);
  assert.equal(isValidSlug('bad slug'), false);
  assert.equal(isValidSlug(''), false);
  assert.equal(isValidSlug('a'.repeat(33)), false);
});

test('isValidUrl requires http(s) scheme', () => {
  assert.equal(isValidUrl('https://example.com'), true);
  assert.equal(isValidUrl('http://example.com/path?x=1'), true);
  assert.equal(isValidUrl('javascript:alert(1)'), false);
  assert.equal(isValidUrl('not a url'), false);
});

test('timingSafeEqual compares full strings', () => {
  assert.equal(timingSafeEqual('secret', 'secret'), true);
  assert.equal(timingSafeEqual('secret', 'wrong'), false);
  assert.equal(timingSafeEqual('a', 'ab'), false);
});

test('genSlug produces requested length from url-safe alphabet', () => {
  const slug = genSlug(8);
  assert.equal(slug.length, 8);
  assert.match(slug, /^[A-Za-z0-9]+$/);
});
