import { genSlug, isValidSlug, isValidUrl, timingSafeEqual } from './utils.js';

const RESERVED_SLUGS = new Set(['api', 'favicon.ico']);

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization,Content-Type',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function isAuthorized(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.replace(/^Bearer\s+/i, '');
  return Boolean(env.API_KEY) && timingSafeEqual(token, env.API_KEY);
}

async function listLinks(env) {
  const { keys } = await env.LINKS.list();
  return Promise.all(
    keys.map(async (k) => {
      const value = JSON.parse((await env.LINKS.get(k.name)) || '{}');
      return { slug: k.name, ...value };
    })
  );
}

async function createLink(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid json body' }, 400);
  }

  if (!isValidUrl(body.url)) return json({ error: 'invalid url' }, 400);

  let slug = (body.slug || '').trim();
  if (slug) {
    if (!isValidSlug(slug) || RESERVED_SLUGS.has(slug)) {
      return json({ error: 'invalid slug' }, 400);
    }
    if (await env.LINKS.get(slug)) return json({ error: 'slug already taken' }, 409);
  } else {
    do {
      slug = genSlug();
    } while (await env.LINKS.get(slug));
  }

  const record = { url: body.url, clicks: 0, created: new Date().toISOString() };
  await env.LINKS.put(slug, JSON.stringify(record));
  return json({ slug, ...record }, 201);
}

async function handleRedirect(slug, env) {
  const raw = await env.LINKS.get(slug);
  if (!raw) return new Response('Not found', { status: 404, headers: CORS_HEADERS });

  // ponytail: get-then-put isn't atomic under concurrent hits on the same
  // slug; KV is eventually consistent anyway, fine for personal-scale traffic.
  const record = JSON.parse(raw);
  record.clicks = (record.clicks || 0) + 1;
  await env.LINKS.put(slug, JSON.stringify(record));
  return Response.redirect(record.url, 302);
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (pathname === '/api/links') {
      if (!isAuthorized(request, env)) return json({ error: 'unauthorized' }, 401);
      if (request.method === 'GET') return json(await listLinks(env));
      if (request.method === 'POST') return createLink(request, env);
    }

    if (pathname.startsWith('/api/links/') && request.method === 'DELETE') {
      if (!isAuthorized(request, env)) return json({ error: 'unauthorized' }, 401);
      const slug = pathname.slice('/api/links/'.length);
      await env.LINKS.delete(slug);
      return json({ ok: true });
    }

    if (pathname === '/' && request.method === 'GET') {
      return new Response('SGLINK redirect service', { headers: CORS_HEADERS });
    }

    const slug = pathname.slice(1);
    if (request.method === 'GET' && slug && !pathname.startsWith('/api/')) {
      return handleRedirect(slug, env);
    }

    return new Response('Not found', { status: 404, headers: CORS_HEADERS });
  },
};
