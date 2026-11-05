(() => {
  const apiBase = (new URLSearchParams(location.search).get('api') || 'https://zero5-nov-workshop-4.onrender.com').replace(/\/+$/, '');
  const assetBase = new URL('./', document.currentScript.src);
  const userKey = 'campuspulse-active-user';
  const frame = document.querySelector('#screen');
  const picker = document.querySelector('#active-user');
  const apiState = document.querySelector('#api-state');
  const loading = document.querySelector('#screen-loading');
  const usersById = new Map();
  window.CAMPUSPULSE_API_BASE = apiBase;

  const screens = {
    college_campus_events_hub: new URL('college_campus_events_hub/code.html', assetBase).href,
    events_catalog_discovery: new URL('events_catalog_discovery/code.html', assetBase).href,
    manage_create_events: new URL('manage_create_events/code.html', assetBase).href,
    registrations_attendees: new URL('registrations_attendees/code.html', assetBase).href,
    database_schema_viewer: new URL('database_schema_viewer/code.html', assetBase).href
  };

  async function getJson(path) {
    const response = await fetch(`${apiBase}${path}`);
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || `API returned ${response.status}`);
    return payload;
  }

  function setApiState(message, isError = false) {
    apiState.textContent = message;
    apiState.classList.toggle('is-error', isError);
  }

  function setCurrentUser(user) {
    localStorage.setItem(userKey, JSON.stringify(user));
    document.querySelector('#user-avatar').textContent = (user.name || user.email || '?').charAt(0).toUpperCase();
    window.dispatchEvent(new StorageEvent('storage', { key: userKey, newValue: JSON.stringify(user) }));
  }

  async function loadUsers() {
    const users = await getJson('/api/users');
    users.forEach((user) => {
      user.name = user.name || user.full_name || user.email?.split('@')[0] || user.id;
      usersById.set(user.id, user);
    });
    picker.replaceChildren(...users.map((user) => {
      const option = document.createElement('option');
      option.value = user.id;
      option.textContent = `${user.name} · ${user.role || 'user'}`;
      return option;
    }));
    const saved = JSON.parse(localStorage.getItem(userKey) || 'null');
    const selected = usersById.get(saved?.id) || users[0];
    if (selected) {
      picker.value = selected.id;
      setCurrentUser(selected);
    }
    setApiState('API CONNECTED');
  }

  picker.addEventListener('change', () => {
    const user = usersById.get(picker.value);
    if (user) setCurrentUser(user);
  });

  document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      if (!screens[view]) return;
      document.querySelectorAll('[data-view]').forEach((tab) => {
        if (tab === button) tab.setAttribute('aria-current', 'page');
        else tab.removeAttribute('aria-current');
      });
      loading.hidden = false;
      frame.src = screens[view];
    });
  });

  frame.addEventListener('load', () => {
    loading.hidden = true;
    try {
      const doc = frame.contentDocument;
      if (!doc || doc.querySelector('script[data-campus-api]')) return;
      const style = doc.createElement('style');
      style.textContent = 'header{display:none!important} main{padding-top:0!important}';
      doc.head.append(style);
      const script = doc.createElement('script');
      script.dataset.campusApi = 'true';
      script.src = new URL('backend-api.js', assetBase).href;
      doc.body.append(script);
    } catch (error) {
      setApiState('SCREEN ERROR', true);
    }
  });

  loadUsers().catch((error) => setApiState(error.message || 'API OFFLINE', true));
})();
