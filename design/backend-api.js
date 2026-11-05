(() => {
  const apiBase = window.parent.CAMPUSPULSE_API_BASE || window.location.origin;
  const userKey = 'campuspulse-active-user';
  const eventsContainer = document.querySelector('#eventsContainer');
  let events = [];
  let registrations = [];
  let myRegistrations = [];
  let users = [];
  let activeStatus = 'all';
  let searchText = '';
  let myEventsOnly = false;
  let showMyRegistrations = false;

  const currentUser = () => {
    try { return JSON.parse(localStorage.getItem(userKey) || 'null'); }
    catch { return null; }
  };

  async function api(path, options = {}) {
    const response = await fetch(`${apiBase}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status})`);
    return result;
  }

  function showMessage(message, isError = false) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `position:fixed;z-index:9999;right:20px;bottom:20px;max-width:min(360px,calc(100vw - 40px));padding:12px 16px;border:1px solid ${isError ? '#ff8e83' : '#4ee0a4'};border-radius:8px;background:#1b211d;color:#e8eee9;font:13px sans-serif;box-shadow:0 12px 30px #0008`;
    document.body.append(toast);
    window.setTimeout(() => toast.remove(), 3500);
  }

  function categoryFor(event) {
    const text = event.title.toLowerCase();
    if (/career|network|recruit|job fair/.test(text)) return 'Career & Networking';
    if (/startup|pitch|venture/.test(text)) return 'Startups & Pitch';
    if (/game|creative|showcase/.test(text)) return 'Creative & Gaming';
    if (/workshop|bootcamp|class/.test(text)) return 'Workshops';
    return 'Tech & AI';
  }

  function eventStatus(event, count) {
    if (count >= event.capacity) return 'sold-out';
    if (event.capacity && count / event.capacity >= 0.8) return 'almost-full';
    return 'open';
  }

  function cardTitle(card) {
    return card.querySelector('h3')?.textContent.trim() || '';
  }

  function setCardText(card, selector, text) {
    const element = card.querySelector(selector);
    if (element) element.textContent = text;
  }

  function decorateCard(card, event, count) {
    const category = categoryFor(event);
    const status = eventStatus(event, count);
    const percentage = event.capacity ? Math.min(100, Math.round(count / event.capacity * 100)) : 0;
    const title = card.querySelector('h3');
    if (title) title.textContent = event.title;
    card.id = event.id;
    card.dataset.eventId = event.id;
    const organizerId = event.organiser_id || event.organizer_id || '';
    card.dataset.owner = organizerId;
    card.dataset.capacity = String(event.capacity || 0);
    card.dataset.status = status;
    card.dataset.category = category.toLowerCase();

    const categoryBadge = [...card.querySelectorAll('.font-badge-caps')]
      .find((badge) => /tech|network|interactive|database|venture|oss/i.test(badge.textContent));
    if (categoryBadge) categoryBadge.textContent = category.toUpperCase();
    const statusBadge = [...card.querySelectorAll('.font-badge-caps')]
      .find((badge) => /open|capacity|almost|sold out/i.test(badge.textContent));
    if (statusBadge) statusBadge.textContent = status === 'sold-out' ? 'SOLD OUT' : status === 'almost-full' ? 'ALMOST FULL' : 'OPEN';

    const dateBadge = [...card.querySelectorAll('span')]
      .find((item) => /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}\b/i.test(item.textContent.trim()) || /SCHEDULE TBA/i.test(item.textContent.trim()));
    const scheduledAt = event.starts_at || event.start_at || event.start_time || event.event_date || event.date;
    if (dateBadge) dateBadge.textContent = scheduledAt ? new Date(scheduledAt).toLocaleString() : 'SCHEDULE TBA';
    const locationIcon = [...card.querySelectorAll('.material-symbols-outlined')]
      .find((item) => item.textContent.trim() === 'location_on');
    const venue = event.location || event.venue || event.venue_name;
    if (locationIcon?.nextElementSibling) locationIcon.nextElementSibling.textContent = venue || 'Venue details not set';
    const description = card.querySelector('p');
    if (description) description.textContent = event.description || event.summary || 'Additional event details have not been added yet.';
    const owner = [...card.querySelectorAll('span')].find((item) => /^usr_|[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(item.textContent.trim()));
    if (owner) owner.textContent = event.organizer_name || event.organizer || organizerId || 'Organizer not set';
    const eventIdLabel = [...card.querySelectorAll('span')].find((item) => /^id:\s*evt_/i.test(item.textContent.trim()));
    if (eventIdLabel) eventIdLabel.textContent = `id: ${event.id.slice(0, 12)}…`;

    const capacityValues = [...card.querySelectorAll('span')]
      .filter((item) => /^\d+\s*\/\s*\d+/.test(item.textContent.trim()));
    capacityValues.forEach((value) => { value.textContent = `${count} / ${event.capacity} (${percentage}%)`; });
    const remaining = [...card.querySelectorAll('span, div')].find((item) => item.children.length === 0 && /\d+ seats remaining|\d+ spots left|\d+ remaining/i.test(item.textContent));
    if (remaining) remaining.textContent = `${Math.max(0, event.capacity - count)} seats remaining`;
    const progress = card.querySelector('[style*="width:"]');
    if (progress) progress.style.width = `${percentage}%`;

    const buttons = card.querySelectorAll('.register-action-btn, .rsvp-btn');
    buttons.forEach((oldButton) => {
      const button = oldButton.cloneNode(true);
      oldButton.replaceWith(button);
      button.dataset.eventId = event.id;
      button.setAttribute('aria-label', `${status === 'sold-out' ? 'Join waitlist' : 'Register'} for ${event.title}`);
      button.addEventListener('click', () => registerForEvent(event, count));
    });
  }

  function applyCardFilters() {
    if (!eventsContainer) return;
    const cards = [...eventsContainer.querySelectorAll('.event-card')];
    const user = currentUser();
    const mine = new Set(myRegistrations.map((item) => item.event_id));
    cards.forEach((card) => {
      const statusMatch = activeStatus === 'all' || card.dataset.status === activeStatus;
      const categoryMatch = !card.dataset.filterCategory || card.dataset.category?.includes(card.dataset.filterCategory);
      const queryMatch = !searchText || card.innerText.toLowerCase().includes(searchText);
      const ownerMatch = !myEventsOnly || card.dataset.owner === user?.id;
      const registrationMatch = !showMyRegistrations || mine.has(card.dataset.eventId);
      card.style.display = statusMatch && categoryMatch && queryMatch && ownerMatch && registrationMatch ? 'flex' : 'none';
    });
  }

  async function registerForEvent(event, count) {
    const user = currentUser();
    if (!user?.id) return showMessage('Choose an active user first.', true);
    if (count >= event.capacity) return showMessage('This event is full. Waitlists are not available in the current database schema.', true);
    try {
      await api('/api/registrations', {
        method: 'POST',
        body: JSON.stringify({ event_id: event.id, user_id: user.id })
      });
      showMessage(`RSVP saved for ${event.title}.`);
      await loadEvents();
      await loadRegistrations();
    } catch (error) {
      showMessage(error.message, true);
    }
  }

  async function loadEvents() {
    events = await api('/api/events');
    const user = currentUser();
    const [mine, eventRegistrations] = await Promise.all([
      user?.id
        ? api(`/api/me/registrations?user_id=${encodeURIComponent(user.id)}`)
        : Promise.resolve([]),
      Promise.all(events.map((event) =>
        api(`/api/events/${encodeURIComponent(event.id)}/registrations`)
      ))
    ]);
    myRegistrations = mine;
    registrations = eventRegistrations.flat();
    if (eventsContainer) {
      let cards = [...eventsContainer.querySelectorAll('.event-card')];
      if (cards.length && events.length > cards.length) {
        for (let index = cards.length; index < events.length; index += 1) {
          const clone = cards[0].cloneNode(true);
          eventsContainer.append(clone);
          cards.push(clone);
        }
      }
      cards.forEach((card, index) => {
        const event = events[index];
        if (!event) return card.remove();
        const count = eventRegistrations[index].length;
        decorateCard(card, event, count);
      });
      applyCardFilters();
      bindCatalogFilters();
      bindHubControls();
    }
    updateRegistrationBadge();
    renderManageTable();
    renderRegistrationTable();
    populateRegistrationSelects();
  }

  function bindCatalogFilters() {
    document.querySelectorAll('.status-filter').forEach((button) => {
      if (button.dataset.apiBound) return;
      button.dataset.apiBound = 'true';
      button.addEventListener('click', () => {
        const status = button.dataset.status || 'all';
        activeStatus = status === 'almost' ? 'almost-full' : status === 'full' ? 'sold-out' : status;
        applyCardFilters();
      });
    });
    document.querySelector('#eventSearchInput')?.addEventListener('input', (event) => {
      searchText = event.target.value.trim().toLowerCase();
      applyCardFilters();
    });
    document.querySelector('#sortCapacityBtn')?.addEventListener('click', () => {
      const asc = document.querySelector('#sortDirectionIcon')?.textContent.trim() === 'expand_less';
      const cards = [...eventsContainer.querySelectorAll('.event-card')];
      cards.sort((a, b) => (Number(a.dataset.capacity) - Number(b.dataset.capacity)) * (asc ? -1 : 1));
      cards.forEach((card) => eventsContainer.append(card));
    });
  }

  function bindHubControls() {
    document.querySelectorAll('.category-pill').forEach((button) => {
      if (button.dataset.apiBound) return;
      button.dataset.apiBound = 'true';
      button.addEventListener('click', () => {
        const label = button.textContent.replace(/^[^\p{L}\p{N}]+/u, '').trim().toLowerCase();
        document.querySelectorAll('.event-card').forEach((card) => {
          card.dataset.filterCategory = label === 'all happenings' ? '' : label;
        });
        applyCardFilters();
      });
    });
    document.querySelector('#eventSearchInput')?.addEventListener('input', (event) => {
      searchText = event.target.value.trim().toLowerCase();
      applyCardFilters();
    });
    document.querySelector('#viewMyRsvpsBtn')?.addEventListener('click', (event) => {
      showMyRegistrations = !showMyRegistrations;
      event.currentTarget.setAttribute('aria-pressed', String(showMyRegistrations));
      applyCardFilters();
    });
    document.querySelector('#filterMyEvents')?.addEventListener('click', () => {
      myEventsOnly = !myEventsOnly;
      applyCardFilters();
    });
  }

  function updateRegistrationBadge() {
    const badge = document.querySelector('#rsvpCountBadge');
    const user = currentUser();
    if (badge) badge.textContent = String(myRegistrations.length);
    document.querySelectorAll('.register-action-btn, .rsvp-btn').forEach((button) => {
      const label = button.querySelector('span:last-child');
      if (label && /Register Active User|1-Click RSVP for/.test(label.textContent)) {
        label.textContent = `${button.classList.contains('register-action-btn') ? 'Register' : '1-Click RSVP for'} ${user?.name || 'active user'}`;
      }
    });
    const userLabel = document.querySelector('#navUserLabel');
    const bannerName = document.querySelector('#bannerActiveUserName');
    const bannerId = document.querySelector('#bannerActiveUserUUID');
    if (userLabel && user) userLabel.textContent = user.name;
    if (bannerName && user) bannerName.textContent = `${user.name} (${user.role || 'user'})`;
    if (bannerId && user) bannerId.textContent = user.id;
  }

  function showCell(row, value) {
    const cell = document.createElement('td');
    cell.className = 'py-3 px-4 text-sm text-on-surface';
    cell.textContent = value ?? '';
    row.append(cell);
    return cell;
  }

  function renderManageTable() {
    const body = document.querySelector('#events-table-body');
    if (!body) return;
    body.replaceChildren();
    events.forEach((event) => {
      const row = document.createElement('tr');
      row.className = 'hover:bg-surface-container-high/60 transition-colors group';
      row.dataset.eventId = event.id;
      showCell(row, event.id);
      showCell(row, event.title);
      const owner = users.find((item) => item.id === event.organiser_id);
      showCell(row, owner?.email || event.organiser_id);
      showCell(row, String(event.capacity));
      showCell(row, event.created_at ? new Date(event.created_at).toLocaleString() : 'Date not recorded');
      const actions = document.createElement('td');
      actions.className = 'py-3 px-4 text-right';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'delete-event-btn px-2 py-1 rounded text-error hover:bg-error-container/30';
      remove.textContent = 'Delete';
      remove.addEventListener('click', async () => {
        if (!window.confirm(`Delete “${event.title}”?`)) return;
        try {
          await api(`/api/events/${encodeURIComponent(event.id)}`, { method: 'DELETE' });
          showMessage('Event deleted.');
          await loadEvents();
        } catch (error) { showMessage(error.message, true); }
      });
      actions.append(remove);
      row.append(actions);
      body.append(row);
    });
    const count = document.querySelector('#event-counter-pill');
    if (count) count.textContent = String(events.length);
  }

  function renderRegistrationTable() {
    const body = document.querySelector('#roster-tbody');
    if (!body) return;
    body.replaceChildren();
    registrations.forEach((registration) => {
      const user = users.find((item) => item.id === registration.user_id || item.email === registration.user_id);
      const event = events.find((item) => item.id === registration.event_id);
      const row = document.createElement('tr');
      row.className = 'hover:bg-surface-container-high/60 transition-colors group';
      row.dataset.eventId = registration.event_id;
      showCell(row, registration.id);
      showCell(row, `${user?.name || 'Unknown user'} · ${user?.email || registration.user_id}`);
      showCell(row, `${event?.title || 'Unknown event'} · ${registration.event_id}`);
      showCell(row, user?.role || 'user');
      const registeredAt = registration.time ? new Date(registration.time) : null;
      showCell(row, registeredAt && !Number.isNaN(registeredAt.getTime()) ? registeredAt.toLocaleString() : registration.time || 'Time not recorded');
      const actions = document.createElement('td');
      actions.className = 'py-3 px-4 text-right';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'delete-registration-btn px-2 py-1 rounded text-error hover:bg-error-container/30';
      remove.textContent = 'Remove';
      remove.addEventListener('click', async () => {
        try {
          await api(`/api/registrations/${encodeURIComponent(registration.id)}`, { method: 'DELETE' });
          showMessage('Registration removed.');
          await loadEvents();
        } catch (error) { showMessage(error.message, true); }
      });
      actions.append(remove);
      row.append(actions);
      body.append(row);
    });
    bindRegistrationFilters();
  }

  function bindRegistrationFilters() {
    const search = document.querySelector('#search-filter-input');
    const filter = document.querySelector('#event-selector-filter');
    const apply = () => {
      const query = search?.value.trim().toLowerCase() || '';
      const eventId = filter?.value || 'all';
      document.querySelectorAll('#roster-tbody tr').forEach((row) => {
        row.hidden = (eventId !== 'all' && row.dataset.eventId !== eventId) || !row.innerText.toLowerCase().includes(query);
      });
    };
    search?.addEventListener('input', apply);
    filter?.addEventListener('change', apply);
  }

  function populateRegistrationSelects() {
    ['#event-selector-filter', '#modal-event-select'].forEach((selector) => {
      const select = document.querySelector(selector);
      if (!select) return;
      const allOption = selector === '#event-selector-filter' ? new Option('All Events', 'all') : null;
      select.replaceChildren(...(allOption ? [allOption] : []), ...events.map((event) => new Option(`${event.title} (${event.capacity} seats)`, event.id)));
    });
  }

  function bindEventCreation() {
    const button = document.querySelector('#publish-event-btn');
    const titleInput = document.querySelector('#event-title-input');
    const capacityInput = document.querySelector('#event-capacity-input');
    if (!button || button.dataset.apiBound) return;
    button.dataset.apiBound = 'true';
    const replacement = button.cloneNode(true);
    button.replaceWith(replacement);
    replacement.addEventListener('click', async (event) => {
      event.preventDefault();
      const user = currentUser();
      if (!user?.id) return showMessage('Select an active organizer first.', true);
      if (!/organis|admin|faculty/i.test(user.role || '')) return showMessage('Choose an organizer or admin profile to create events.', true);
      try {
        await api('/api/events', {
          method: 'POST',
          body: JSON.stringify({ title: titleInput?.value.trim(), capacity: Number(capacityInput?.value), organiser_id: user.id })
        });
        showMessage('Event created in Supabase.');
        await loadEvents();
      } catch (error) { showMessage(error.message, true); }
    });
  }

  function bindQuickRegistration() {
    const button = document.querySelector('#commit-quick-reg');
    if (!button || button.dataset.apiBound) return;
    button.dataset.apiBound = 'true';
    const replacement = button.cloneNode(true);
    button.replaceWith(replacement);
    replacement.addEventListener('click', async () => {
      const user = currentUser();
      const eventId = document.querySelector('#modal-event-select')?.value;
      if (!user?.id || !eventId) return showMessage('Select a user and event.', true);
      try {
        await api('/api/registrations', { method: 'POST', body: JSON.stringify({ user_id: user.id, event_id: eventId }) });
        document.querySelector('#quick-reg-modal')?.classList.add('hidden');
        showMessage('Registration saved.');
        await loadEvents();
      } catch (error) { showMessage(error.message, true); }
    });
  }

  function bindRefresh() {
    document.querySelector('#refresh-table-btn, #refresh-roster-btn')?.addEventListener('click', async () => {
      try { await loadEvents(); showMessage('Synced with the Flask API.'); }
      catch (error) { showMessage(error.message, true); }
    });
  }

  async function initialize() {
    try {
      users = await api('/api/users');
      await loadEvents();
      bindEventCreation();
      bindQuickRegistration();
      bindRefresh();
    } catch (error) {
      showMessage(`Backend unavailable: ${error.message}`, true);
    }
  }

  window.addEventListener('storage', (event) => {
    if (event.key === userKey) {
      loadEvents().catch((error) => showMessage(error.message, true));
    }
  });
  initialize();
})();
