import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const config = window.CAMPUSPULSE_CONFIG || {};
const supabase = config.supabaseUrl && config.supabaseKey
  ? createClient(config.supabaseUrl, config.supabaseKey)
  : null;
const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE_URL = isLocal ? window.location.origin : 'https://zero5-nov-workshop-4.onrender.com';
const apiUrl = (path) => `${API_BASE_URL}${path}`;

const fallbackEvents = [
  {
    id: 'preview-hackathon', title: 'Hackathon 2026: AI & System Design', category: 'Tech & AI',
    location: 'Engineering Quad, Innovation Hall 302', starts_at: '2026-11-07T09:00:00',
    description: 'Join student engineers for a full day of autonomous agent development, cloud architecture, and hands-on building.',
    organizer: 'ACM Student Chapter', capacity: 150, registered_count: 128,
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85'
  },
  {
    id: 'preview-career', title: 'Career Fair: Tech & Engineering', category: 'Career & Networking',
    location: 'Student Union, Grand Ballroom', starts_at: '2026-11-12T11:00:00',
    description: 'Meet technology and engineering teams hiring for summer 2027 internships and full-time roles.',
    organizer: 'Career Services', capacity: 300, registered_count: 300,
    image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=85'
  },
  {
    id: 'preview-workshop', title: 'Workshop: PostgreSQL & Realtime', category: 'Workshops',
    location: 'Turing Computer Science Center, Lab 104', starts_at: '2026-11-09T14:00:00',
    description: 'Hands-on database internals lab covering foreign key cascades, write-ahead logs, and live change streams.',
    organizer: 'CS Faculty', capacity: 40, registered_count: 35,
    image_url: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=85'
  },
  {
    id: 'preview-game', title: 'Game Dev Showcase & Playtest Night', category: 'Creative & Gaming',
    location: 'Media Arts Center, Screening Studio B', starts_at: '2026-11-13T18:30:00',
    description: 'Play the original student indie games you have been hearing about and meet the creators behind them.',
    organizer: 'Game Dev Guild', capacity: 80, registered_count: 65,
    image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=85'
  },
  {
    id: 'preview-pitch', title: 'Startup Pitch Night & VC Mixer', category: 'Startups & Pitch',
    location: 'Founders Hub, Alumni Auditorium', starts_at: '2026-11-10T17:00:00',
    description: 'Eight university-incubated teams share their ventures with angel syndicates and campus partners.',
    organizer: 'Venture Society', capacity: 90, registered_count: 45,
    image_url: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=85'
  },
  {
    id: 'preview-open-source', title: 'Open Source Contribution Sprint', category: 'Tech & AI',
    location: 'Digital Commons, Collaboration Pod 4', starts_at: '2026-11-08T16:00:00',
    description: 'First-time contributor mentorship for high-impact developer tooling repositories. Bring your laptop.',
    organizer: 'Open Source Club', capacity: 25, registered_count: 18,
    image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1000&q=85'
  }
];

const grid = document.querySelector('#event-grid');
const searchInputs = [document.querySelector('#event-search-input'), document.querySelector('#top-search-input')];
const categories = document.querySelector('#category-list');
const dateFilters = document.querySelector('.date-filters');
const toast = document.querySelector('#toast');
let events = [];
let activeCategory = 'All Happenings';
let activeDate = 'all';
let searchTerm = '';
let session = null;
let userRegistrations = [];
let authMode = 'signin';
let toastTimer;

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

function parseDate(event) {
  const raw = event.starts_at || event.start_at || event.start_time || event.event_date || event.date;
  const parsed = raw ? new Date(raw) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function normalizeEvent(event, index) {
  const title = event.title ?? event.name ?? 'Untitled campus event';
  const rawCategory = event.category ?? event.interest ?? event.type;
  const inferredCategory = /career|recruit|network|fair/i.test(title) ? 'Career & Networking'
    : /startup|pitch|venture/i.test(title) ? 'Startups & Pitch'
      : /game|creative|showcase/i.test(title) ? 'Creative & Gaming'
        : /workshop|bootcamp|class/i.test(title) ? 'Workshops'
          : 'Tech & AI';
  const category = rawCategory && rawCategory !== 'Campus life' ? rawCategory : inferredCategory;
  const date = parseDate(event);
  const capacity = Number(event.capacity ?? event.max_capacity ?? event.seat_limit ?? 0);
  const registered = Number(event.registered_count ?? event.registration_count ?? event.rsvp_count ?? event.attendee_count ?? 0);
  const categoryImages = {
    'Tech & AI': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1000&q=85',
    'Career & Networking': 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=85',
    'Creative & Gaming': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1000&q=85',
    'Startups & Pitch': 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1000&q=85',
    Workshops: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1000&q=85'
  };
  const categoryDescriptions = {
    'Tech & AI': 'A campus meetup for builders, curious minds, and emerging technology.',
    'Career & Networking': 'Meet campus peers and connect with opportunities across the university.',
    'Creative & Gaming': 'Share ideas, make something new, and meet the campus creative community.',
    'Startups & Pitch': 'Bring an idea, meet early-stage teams, and connect with campus founders.',
    Workshops: 'A practical, hands-on session led by your campus learning community.'
  };
  return {
    ...event,
    id: String(event.id ?? event.event_id ?? `event-${index}`),
    title,
    category,
    location: event.location ?? event.venue ?? event.venue_name ?? 'Campus venue · details to be announced',
    description: event.description ?? event.summary ?? categoryDescriptions[category] ?? 'Meet people, share ideas, and take part in campus life.',
    organizer: event.organizer_name ?? event.organizer ?? event.host ?? 'Campus organizer',
    image: event.image_url ?? event.cover_url ?? event.banner_url ?? categoryImages[category] ?? categoryImages['Tech & AI'],
    date,
    capacity,
    registered,
    timestamp: date?.getTime() ?? 0
  };
}

function formatTime(date) {
  if (!date) return 'TIME TBA';
  return new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
}

function dateLabel(date) {
  if (!date) return 'DATE TBA';
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' }).format(date);
}

function toneFor(category) {
  if (/career|startup|pitch/i.test(category)) return 'amber';
  if (/creative|gaming|workshop/i.test(category)) return 'blue';
  return 'green';
}

function isThisWeekend(date) {
  if (!date) return false;
  const today = new Date();
  const day = today.getDay();
  const saturday = new Date(today);
  saturday.setDate(today.getDate() + (day === 0 ? -1 : 6 - day));
  saturday.setHours(0, 0, 0, 0);
  const monday = new Date(saturday);
  monday.setDate(saturday.getDate() + 2);
  return date >= saturday && date < monday;
}

function filteredEvents() {
  const now = new Date();
  return events.filter((event) => {
    const categoryMatches = activeCategory === 'All Happenings'
      || event.category.toLowerCase().includes(activeCategory.toLowerCase().replace(' & networking', '').replace(' & gaming', ''))
      || (activeCategory === 'Tech & AI' && /engineering|technology|tech/i.test(event.category));
    const text = `${event.title} ${event.category} ${event.location} ${event.organizer} ${event.description}`.toLowerCase();
    const searchMatches = !searchTerm || text.includes(searchTerm);
    const dateMatches = activeDate === 'all'
      || (activeDate === 'today' && event.date?.toDateString() === now.toDateString())
      || (activeDate === 'weekend' && isThisWeekend(event.date))
      || (activeDate === 'popular' && (event.registered > 0 || event.popularity || event.is_popular));
    return categoryMatches && searchMatches && dateMatches;
  }).sort((a, b) => a.timestamp - b.timestamp);
}

function cardTemplate(event, index) {
  const isPreview = event.id.startsWith('preview-');
  const percent = event.capacity ? Math.min(100, Math.round(event.registered / event.capacity * 100)) : 0;
  const remaining = event.capacity ? Math.max(0, event.capacity - event.registered) : null;
  const full = remaining === 0;
  const registered = userRegistrations.some((registration) => String(registration.event_id) === event.id);
  const tone = toneFor(event.category);
  const image = event.image || `https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1000&q=85`;
  const summary = escapeHtml(event.description);
  return `<article class="event-card" data-tone="${tone}" style="animation-delay:${Math.min(index, 8) * 45}ms">
    <div class="event-visual">
      <img class="event-image" src="${escapeHtml(image)}" alt="Campus event: ${escapeHtml(event.title)}" loading="lazy">
      <span class="event-category">${escapeHtml(event.category)}</span>
      <span class="event-time">${escapeHtml(event.date ? formatTime(event.date) : 'SCHEDULE TBA')}</span>
    </div>
    <div class="event-body">
      <div class="event-location"><i data-lucide="map-pin"></i>${escapeHtml(event.location)}</div>
      <h3 class="event-title">${escapeHtml(event.title)}</h3>
      <p class="event-description">${summary}</p>
      <div class="event-meta"><span class="event-host"><span class="host-icon">↗</span>Host: ${escapeHtml(event.organizer)}</span><span class="event-id">${escapeHtml(event.id)}</span></div>
      <div class="capacity">
        <div class="capacity-copy"><span>${event.capacity ? 'Capacity fill' : 'RSVPs'}</span><strong>${event.capacity ? `${event.registered} / ${event.capacity}${full ? ' · Waitlist open' : ` · ${remaining} left`}` : event.registered}</strong></div>
        <div class="capacity-track"><div class="capacity-fill" style="width:${event.capacity ? percent : 12}%"></div></div>
      </div>
      <div class="event-actions"><button class="button-primary rsvp-button" type="button" data-event-id="${escapeHtml(event.id)}" ${registered || isPreview ? 'disabled' : ''}><i data-lucide="${registered ? 'badge-check' : full ? 'hourglass' : 'user-round-plus'}"></i>${registered ? 'You are registered' : isPreview ? 'Preview event' : full ? 'Join waitlist' : '1-Click RSVP'}</button></div>
    </div>
  </article>`;
}

function renderEvents() {
  const matches = filteredEvents();
  grid.innerHTML = matches.map(cardTemplate).join('');
  document.querySelector('#result-count').textContent = `${matches.length} ${matches.length === 1 ? 'event' : 'events'} · ${activeCategory}`;
  document.querySelector('#empty-state').hidden = matches.length > 0;
  grid.hidden = matches.length === 0;
  document.querySelector('#feed-title').textContent = searchTerm ? `Results for “${searchTerm}”` : activeDate === 'today' ? 'Happening today' : 'Coming up around you';
  window.lucide?.createIcons();
}

function updateStats() {
  const weekFromNow = new Date();
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  const thisWeek = events.filter((event) => event.date && event.date >= new Date() && event.date < weekFromNow).length;
  const rsvps = events.reduce((total, event) => total + event.registered, 0);
  const venues = new Set(events.map((event) => event.location).filter(Boolean)).size;
  document.querySelector('#stat-week').textContent = String(thisWeek || events.length).padStart(2, '0');
  document.querySelector('#stat-rsvps').textContent = rsvps >= 1000 ? `${(rsvps / 1000).toFixed(1)}k` : rsvps.toLocaleString();
  document.querySelector('#stat-venues').textContent = String(venues).padStart(2, '0');
}

function showToast(message, isError = false) {
  toast.textContent = message;
  toast.classList.toggle('is-error', isError);
  toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
}

function setSession(nextSession) {
  session = nextSession;
  const email = session?.user?.email;
  document.querySelector('#account-name').textContent = email ? email.split('@')[0] : 'Guest student';
  document.querySelector('#account-role').textContent = email ? 'STUDENT ACCOUNT' : 'SIGN IN TO RSVP';
  document.querySelector('#avatar').textContent = email ? email.charAt(0).toUpperCase() : '?';
  document.querySelector('#session-title').textContent = email ? `Signed in as ${email}` : 'Browsing as a guest';
  document.querySelector('#session-detail').textContent = email ? 'Campus events · Your RSVP activity is synced' : 'Campus events · RSVP requires sign in';
  document.querySelector('#account-button').setAttribute('aria-label', email ? `Account ${email}, sign out` : 'Sign in');
  if (email) loadRegistrations();
}

async function loadEvents() {
  const status = document.querySelector('#api-status');
  try {
    const response = await fetch(apiUrl('/api/events'));
    if (!response.ok) throw new Error('Campus event data is temporarily unavailable.');
    const data = await response.json();
    const rows = Array.isArray(data) ? data : data.events || [];
    if (rows.length) {
      events = rows.map(normalizeEvent);
      document.querySelector('#data-notice').hidden = true;
      status.textContent = 'LIVE CAMPUS DATA';
    } else {
      events = fallbackEvents.map(normalizeEvent);
      const notice = document.querySelector('#data-notice');
      notice.textContent = 'Sample events are showing. Publish an event in Supabase to add it to the live feed.';
      notice.hidden = false;
      status.textContent = 'SAMPLE FEED';
    }
  } catch (error) {
    events = fallbackEvents.map(normalizeEvent);
    const notice = document.querySelector('#data-notice');
    notice.textContent = 'Campus data is offline. Showing sample events.';
    notice.hidden = false;
    status.textContent = 'API OFFLINE · PREVIEW';
  }
  updateStats();
  renderEvents();
}

async function loadRegistrations() {
  if (!session?.access_token) return;
  try {
    const response = await fetch(apiUrl('/api/me/registrations'), { headers: { Authorization: `Bearer ${session.access_token}` } });
    if (!response.ok) throw new Error('Could not load your registrations.');
    const registrations = await response.json();
    userRegistrations = Array.isArray(registrations) ? registrations : [];
    document.querySelector('#registration-count').textContent = String(userRegistrations.length);
    renderEvents();
  } catch (error) {
    showToast(error.message || 'Could not load your registrations.', true);
  }
}

function openAuth(message = '') {
  document.querySelector('#auth-feedback').textContent = message;
  document.querySelector('#auth-feedback').classList.remove('is-error');
  document.querySelector('#auth-dialog').showModal();
  document.querySelector('#auth-email').focus();
}

function setAuthMode(mode) {
  authMode = mode;
  const isSignUp = mode === 'signup';
  document.querySelector('#auth-title').textContent = isSignUp ? 'Join your campus' : 'Welcome back';
  document.querySelector('#auth-description').textContent = isSignUp ? 'Create an account to find your people and save your seat.' : 'Sign in to save your seat at the next campus event.';
  document.querySelector('#auth-submit').innerHTML = `${isSignUp ? 'Create account' : 'Sign in'} <i data-lucide="arrow-right"></i>`;
  document.querySelector('#auth-password').autocomplete = isSignUp ? 'new-password' : 'current-password';
  document.querySelector('#auth-mode-switch').innerHTML = isSignUp
    ? 'Already have an account? <strong>Sign in</strong>'
    : 'New to CampusPulse? <strong>Create an account</strong>';
  window.lucide?.createIcons();
}

function openRegistrations() {
  if (!session) {
    openAuth('Sign in to view your saved events.');
    return;
  }
  const list = document.querySelector('#registration-list');
  const mapped = userRegistrations.map((registration) => {
    const event = events.find((item) => item.id === String(registration.event_id));
    return event ? { event, date: event.date } : { event: { title: `Event ${registration.event_id}` }, date: null };
  });
  list.innerHTML = mapped.length ? mapped.map(({ event, date }) => `<div class="registration-row"><span><strong>${escapeHtml(event.title)}</strong><small>${escapeHtml(dateLabel(date))}</small></span><i data-lucide="calendar-check"></i></div>`).join('') : '<p class="registration-empty">No registrations yet. Find an event and save your seat.</p>';
  document.querySelector('#registrations-dialog').showModal();
  window.lucide?.createIcons();
}

async function handleAuthSubmit(formEvent) {
  formEvent.preventDefault();
  const feedback = document.querySelector('#auth-feedback');
  const submit = document.querySelector('#auth-submit');
  if (!supabase) {
    feedback.textContent = 'Campus sign-in is not configured yet.';
    feedback.classList.add('is-error');
    return;
  }
  const form = new FormData(formEvent.currentTarget);
  const credentials = { email: form.get('email'), password: form.get('password') };
  submit.disabled = true;
  feedback.textContent = authMode === 'signup' ? 'Creating your account...' : 'Signing you in...';
  try {
    const result = authMode === 'signup'
      ? await supabase.auth.signUp(credentials)
      : await supabase.auth.signInWithPassword(credentials);
    if (result.error) throw result.error;
    if (authMode === 'signup' && !result.data.session) {
      feedback.textContent = 'Check your email to confirm your new account.';
      return;
    }
    setSession(result.data.session);
    document.querySelector('#auth-dialog').close();
    showToast(authMode === 'signup' ? 'Account created.' : 'Welcome back.');
  } catch (error) {
    feedback.textContent = error.message || 'Sign in failed. Try again.';
    feedback.classList.add('is-error');
  } finally {
    submit.disabled = false;
  }
}

async function handleRsvp(eventId) {
  if (!session?.access_token) {
    openAuth('Sign in to RSVP for this event.');
    return;
  }
  const event = events.find((item) => item.id === eventId);
  if (!event || eventId.startsWith('preview-')) return;
  const button = grid.querySelector(`[data-event-id="${CSS.escape(eventId)}"]`);
  if (button) button.disabled = true;
  try {
    const response = await fetch(apiUrl('/api/registrations'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ event_id: eventId })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not register for this event.');
    userRegistrations.push(result.event_id ? result : { event_id: eventId });
    event.registered += 1;
    updateStats();
    renderEvents();
    document.querySelector('#registration-count').textContent = String(userRegistrations.length);
    showToast('You are on the list. See you there.');
  } catch (error) {
    showToast(error.message || 'Could not register for this event.', true);
    if (button) button.disabled = false;
  }
}

function setSearch(value) {
  searchTerm = value.trim().toLowerCase();
  searchInputs.forEach((input) => { if (input.value !== value) input.value = value; });
  renderEvents();
}

searchInputs.forEach((input) => input.addEventListener('input', () => setSearch(input.value)));
categories.addEventListener('click', (event) => {
  const button = event.target.closest('[data-category]');
  if (!button) return;
  activeCategory = button.dataset.category;
  categories.querySelectorAll('.category-chip').forEach((chip) => chip.classList.toggle('is-selected', chip === button));
  renderEvents();
});
dateFilters.addEventListener('click', (event) => {
  const button = event.target.closest('[data-date]');
  if (!button) return;
  activeDate = button.dataset.date;
  dateFilters.querySelectorAll('.date-chip').forEach((chip) => chip.classList.toggle('is-active', chip === button));
  renderEvents();
});
document.querySelectorAll('[data-nav-filter]').forEach((link) => link.addEventListener('click', () => {
  activeCategory = link.dataset.navFilter;
  categories.querySelectorAll('.category-chip').forEach((chip) => chip.classList.toggle('is-selected', chip.dataset.category === activeCategory));
  renderEvents();
}));
grid.addEventListener('click', (event) => {
  const button = event.target.closest('[data-event-id]');
  if (button) handleRsvp(button.dataset.eventId);
});
document.querySelector('#auth-form').addEventListener('submit', handleAuthSubmit);
document.querySelector('#auth-mode-switch').addEventListener('click', () => setAuthMode(authMode === 'signin' ? 'signup' : 'signin'));
document.querySelector('#my-registrations').addEventListener('click', openRegistrations);
document.querySelector('#account-button').addEventListener('click', async () => {
  if (session && supabase) {
    const result = await supabase.auth.signOut();
    if (result.error) showToast(result.error.message, true);
    else {
      userRegistrations = [];
      document.querySelector('#registration-count').textContent = '0';
      setSession(null);
      showToast('You have signed out.');
    }
    return;
  }
  setAuthMode('signin');
  openAuth();
});
document.querySelector('#clear-filters').addEventListener('click', () => {
  activeCategory = 'All Happenings';
  activeDate = 'all';
  setSearch('');
  categories.querySelectorAll('.category-chip').forEach((chip) => chip.classList.toggle('is-selected', chip.dataset.category === activeCategory));
  dateFilters.querySelectorAll('.date-chip').forEach((chip) => chip.classList.toggle('is-active', chip.dataset.date === activeDate));
  renderEvents();
});
document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => document.querySelector(`#${button.dataset.close}`).close()));
document.querySelectorAll('.modal').forEach((dialog) => dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
}));
document.addEventListener('keydown', (event) => {
  if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    event.preventDefault();
    document.querySelector('#top-search-input').focus();
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    document.querySelector('#event-search-input').focus();
  }
});

window.lucide?.createIcons();
if (supabase) {
  supabase.auth.getSession().then(({ data }) => setSession(data.session));
  supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
}
loadEvents();