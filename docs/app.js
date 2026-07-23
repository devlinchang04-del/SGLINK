const { WORKER_URL } = window.SGLINK_CONFIG;
const KEY_STORAGE = 'sglink_api_key';

const els = {
  keyInput: document.getElementById('api-key'),
  keySave: document.getElementById('save-key'),
  form: document.getElementById('create-form'),
  urlInput: document.getElementById('target-url'),
  slugInput: document.getElementById('custom-slug'),
  list: document.getElementById('link-list'),
  empty: document.getElementById('empty-state'),
  error: document.getElementById('error'),
  workerUrl: document.getElementById('worker-url'),
};

els.workerUrl.textContent = WORKER_URL;

function getKey() {
  return localStorage.getItem(KEY_STORAGE) || '';
}

function setKey(key) {
  localStorage.setItem(KEY_STORAGE, key);
}

function showError(msg) {
  els.error.textContent = msg || '';
}

async function api(path, options = {}) {
  const res = await fetch(`${WORKER_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getKey()}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `request failed (${res.status})`);
  return data;
}

function renderLinks(links) {
  els.list.innerHTML = '';
  els.empty.hidden = links.length > 0;

  links
    .sort((a, b) => (a.created < b.created ? 1 : -1))
    .forEach((link) => {
      const shortUrl = `${WORKER_URL}/${link.slug}`;
      const row = document.createElement('tr');

      const slugCell = document.createElement('td');
      const slugLink = document.createElement('a');
      slugLink.href = shortUrl;
      slugLink.target = '_blank';
      slugLink.rel = 'noopener';
      slugLink.textContent = `/${link.slug}`;
      slugCell.appendChild(slugLink);

      const targetCell = document.createElement('td');
      targetCell.className = 'target';
      targetCell.title = link.url;
      targetCell.textContent = link.url;

      const clicksCell = document.createElement('td');
      clicksCell.textContent = link.clicks ?? 0;

      const copyCell = document.createElement('td');
      const copyBtn = document.createElement('button');
      copyBtn.textContent = 'copy';
      copyBtn.addEventListener('click', async () => {
        await navigator.clipboard.writeText(shortUrl);
        copyBtn.textContent = 'copied!';
        setTimeout(() => (copyBtn.textContent = 'copy'), 1200);
      });
      copyCell.appendChild(copyBtn);

      const deleteCell = document.createElement('td');
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'delete';
      deleteBtn.className = 'danger';
      deleteBtn.addEventListener('click', async () => {
        if (!confirm(`Delete /${link.slug}?`)) return;
        try {
          await api(`/api/links/${link.slug}`, { method: 'DELETE' });
          loadLinks();
        } catch (err) {
          showError(err.message);
        }
      });
      deleteCell.appendChild(deleteBtn);

      row.append(slugCell, targetCell, clicksCell, copyCell, deleteCell);
      els.list.appendChild(row);
    });
}

async function loadLinks() {
  if (!getKey()) return;
  try {
    renderLinks(await api('/api/links'));
    showError('');
  } catch (err) {
    showError(err.message);
  }
}

els.keySave.addEventListener('click', () => {
  const value = els.keyInput.value.trim();
  if (!value) return;
  setKey(value);
  els.keyInput.value = '';
  loadLinks();
});

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');
  try {
    await api('/api/links', {
      method: 'POST',
      body: JSON.stringify({
        url: els.urlInput.value.trim(),
        slug: els.slugInput.value.trim() || undefined,
      }),
    });
    els.urlInput.value = '';
    els.slugInput.value = '';
    loadLinks();
  } catch (err) {
    showError(err.message);
  }
});

if (getKey()) {
  els.keyInput.placeholder = 'key saved on this browser (leave blank to keep it)';
}
loadLinks();
