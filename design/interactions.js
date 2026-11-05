(() => {
  const frame = document.querySelector('#campus-page');

  frame.addEventListener('load', () => {
    const doc = frame.contentDocument;
    if (!doc) return;

    const cards = [...doc.querySelectorAll('.event-card')];
    const container = doc.querySelector('#eventsContainer');
    const search = doc.querySelector('#eventSearchInput');
    const categories = [...doc.querySelectorAll('.category-pill')];
    const dateFilters = [...doc.querySelectorAll('.time-filter')];
    const registrationButton = doc.querySelector('#viewMyRsvpsBtn');
    const registrationBadge = doc.querySelector('#rsvpCountBadge');
    const toast = doc.querySelector('#rsvpSuccessToast');
    const emptyState = doc.createElement('p');
    const active = { category: 'all', date: 'all', search: '', registrations: false };
    const userLabel = doc.querySelector('#navUserLabel');
    const storageKey = 'campuspulse-static-rsvps';
    let activeUser = doc.querySelector('.user-select-btn');
    let toastTimer;

    emptyState.textContent = 'No events match these filters. Try another search or category.';
    emptyState.className = 'hidden text-on-surface-variant text-center py-10';
    emptyState.id = 'interaction-empty-state';
    container?.after(emptyState);

    const titleOf = (card) => card.querySelector('h3')?.textContent.trim() || 'Campus event';
    const eventKey = (card) => titleOf(card).toLowerCase();
    const readState = () => {
      try { return JSON.parse(localStorage.getItem(storageKey) || '{}'); }
      catch { return {}; }
    };
    const writeState = (state) => localStorage.setItem(storageKey, JSON.stringify(state));
    const userId = () => activeUser?.dataset.uuid || 'guest';
    const registrationsForUser = () => readState()[userId()] || {};
    const categoryOf = (card) => {
      const badge = [...card.querySelectorAll('.font-badge-caps')]
        .map((item) => item.textContent.trim().toLowerCase())
        .find((text) => /tech & ai|career & networking|creative & gaming|startups & pitch|workshops/.test(text));
      if (badge) return badge;
      const content = `${card.querySelector('h3')?.textContent || ''} ${card.querySelector('p')?.textContent || ''}`.toLowerCase();
      if (/career|network|recruit|job fair/.test(content)) return 'career & networking';
      if (/startup|pitch|venture/.test(content)) return 'startups & pitch';
      if (/game|creative|showcase/.test(content)) return 'creative & gaming';
      if (/workshop|bootcamp|class/.test(content)) return 'workshops';
      return 'tech & ai';
    };
    const visibleLabel = (element) => {
      const copy = element.cloneNode(true);
      copy.querySelectorAll('.material-symbols-outlined').forEach((icon) => icon.remove());
      return copy.textContent.trim().replace(/\s+/g, ' ');
    };

    function showToast(title, detail) {
      if (!toast) return;
      doc.querySelector('#toastEventTitle').textContent = title;
      doc.querySelector('#toastSubDetails').textContent = detail;
      toast.classList.remove('hidden');
      toast.classList.add('flex');
      window.clearTimeout(toastTimer);
      toastTimer = window.setTimeout(hideToast, 4500);
    }

    function hideToast() {
      toast?.classList.add('hidden');
      toast?.classList.remove('flex');
    }

    function dateMatches(card) {
      if (active.date === 'all' || active.date === 'popular') return true;
      const dateText = card.querySelector('.font-label-code-sm')?.textContent || '';
      const match = dateText.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+([A-Z][a-z]{2})\s+(\d{1,2})/);
      if (!match) return false;
      const month = new Date(`${match[2]} 1, 2000`).getMonth();
      const day = Number(match[3]);
      const date = new Date(new Date().getFullYear(), month, day);
      const now = new Date();
      if (active.date === 'today') return date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
      const saturday = new Date(now);
      saturday.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7));
      saturday.setHours(0, 0, 0, 0);
      const monday = new Date(saturday);
      monday.setDate(saturday.getDate() + 2);
      date.setFullYear(now.getFullYear());
      return date >= saturday && date < monday;
    }

    function applyFilters() {
      const registrations = registrationsForUser();
      let visible = cards.filter((card) => {
        const categoryMatch = active.category === 'all' || categoryOf(card).includes(active.category);
        const searchMatch = !active.search || card.innerText.toLowerCase().includes(active.search);
        const registrationMatch = !active.registrations || Boolean(registrations[eventKey(card)]);
        return categoryMatch && searchMatch && registrationMatch && dateMatches(card);
      });

      if (active.date === 'popular') {
        const popularity = (card) => {
          const text = card.innerText.match(/(\d+)\s*\/\s*(\d+)/);
          return text ? Number(text[1]) / Math.max(1, Number(text[2])) : 0;
        };
        visible.sort((a, b) => popularity(b) - popularity(a));
      }

      cards.forEach((card) => {
        card.classList.toggle('hidden', !visible.includes(card));
        if (visible.includes(card)) container?.append(card);
      });
      emptyState.classList.toggle('hidden', visible.length > 0);
    }

    function updateRsvpButton(card) {
      const button = card.querySelector('.rsvp-btn');
      if (!button) return;
      const saved = registrationsForUser()[eventKey(card)];
      const label = button.querySelector('span:last-child');
      if (!label) return;
      button.disabled = Boolean(saved);
      label.textContent = saved === 'waitlist' ? 'On Waitlist' : saved ? 'Registered' : button.dataset.defaultLabel;
    }

    function updateRegistrationCount() {
      if (!registrationBadge) return;
      const saved = Object.keys(registrationsForUser()).length;
      registrationBadge.textContent = String(saved);
    }

    function selectUser(button) {
      activeUser = button;
      const name = button.dataset.name || 'Campus guest';
      const uuid = button.dataset.uuid || 'guest';
      if (userLabel) userLabel.textContent = name;
      const bannerName = doc.querySelector('#bannerActiveUserName');
      const bannerUuid = doc.querySelector('#bannerActiveUserUUID');
      if (bannerName) bannerName.textContent = `${name} (${button.dataset.role || 'Student'})`;
      if (bannerUuid) bannerUuid.textContent = uuid;
      doc.querySelectorAll('.user-select-btn').forEach((item) => {
        const icon = item.querySelector('.material-symbols-outlined:last-child');
        item.classList.toggle('bg-surface-container', item === button);
        if (icon) icon.textContent = item === button ? 'check_circle' : 'swap_horiz';
      });
      cards.forEach(updateRsvpButton);
      updateRegistrationCount();
      const menu = button.parentElement?.parentElement;
      menu?.classList.add('hidden');
      showToast('Profile switched', `Browsing as ${name}.`);
    }

    categories.forEach((button) => {
      button.addEventListener('click', () => {
        const label = visibleLabel(button).replace(/^[^\p{L}\p{N}]+/u, '').trim().toLowerCase();
        active.category = label === 'all happenings' ? 'all' : label;
        categories.forEach((item) => {
          item.classList.toggle('bg-primary', item === button);
          item.classList.toggle('text-on-primary', item === button);
          item.classList.toggle('bg-surface-container-highest', item !== button);
        });
        applyFilters();
      });
    });

    dateFilters.forEach((button) => {
      button.addEventListener('click', () => {
        active.date = visibleLabel(button).trim().toLowerCase().replaceAll(' ', '-');
        if (active.date === 'all-dates') active.date = 'all';
        dateFilters.forEach((item) => item.classList.toggle('active', item === button));
        applyFilters();
      });
    });

    search?.addEventListener('input', () => {
      active.search = search.value.trim().toLowerCase();
      applyFilters();
    });

    cards.forEach((card) => {
      const button = card.querySelector('.rsvp-btn');
      const label = button?.querySelector('span:last-child');
      if (button && label) {
        button.dataset.defaultLabel = label.textContent.trim();
        updateRsvpButton(card);
        button.addEventListener('click', () => {
          const state = readState();
          const userRegistrations = state[userId()] || (state[userId()] = {});
          const waitlist = button.textContent.toLowerCase().includes('waitlist');
          userRegistrations[eventKey(card)] = waitlist ? 'waitlist' : 'rsvp';
          writeState(state);
          updateRsvpButton(card);
          updateRegistrationCount();
          showToast(waitlist ? 'You joined the waitlist' : 'Your RSVP is confirmed', titleOf(card));
        });
      }
    });

    registrationButton?.addEventListener('click', () => {
      active.registrations = !active.registrations;
      registrationButton.setAttribute('aria-pressed', String(active.registrations));
      registrationButton.classList.toggle('ring-1', active.registrations);
      registrationButton.classList.toggle('ring-primary', active.registrations);
      applyFilters();
      if (active.registrations && !cards.some((card) => registrationsForUser()[eventKey(card)])) {
        showToast('No registrations yet', 'RSVP to an event to see it here.');
      }
    });

    doc.querySelector('#closeToastBtn')?.addEventListener('click', hideToast);
    doc.querySelectorAll('.user-select-btn').forEach((button) => button.addEventListener('click', () => selectUser(button)));

    const userTrigger = userLabel?.closest('button');
    const userMenu = doc.querySelector('.user-select-btn')?.parentElement?.parentElement;
    userTrigger?.addEventListener('click', () => userMenu?.classList.toggle('hidden'));
    doc.addEventListener('click', (event) => {
      if (!event.target.closest('.user-select-btn') && !event.target.closest('button')?.contains(userLabel)) userMenu?.classList.add('hidden');
    });

    doc.querySelectorAll('header a[href="#"]').forEach((link) => link.addEventListener('click', (event) => {
      event.preventDefault();
      const label = visibleLabel(link).trim().toLowerCase();
      const category = label.includes('career') ? 'career' : label.includes('clubs') ? 'creative' : 'all';
      active.category = category;
      applyFilters();
      doc.querySelector('#eventsContainer')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    doc.addEventListener('keydown', (event) => {
      if (event.key === '/' && event.target !== search) {
        event.preventDefault();
        search?.focus();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        search?.focus();
      }
    });

    updateRegistrationCount();
    applyFilters();
  });
})();