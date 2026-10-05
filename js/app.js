/* Shared ClassPulse application helpers and demo data. */
(function () {
  const STORAGE_KEYS = {
    studentPulse: 'classpulse_student_pulse',
    settings: 'classpulse_lecturer_settings',
    intervention: 'classpulse_intervention_state',
    sessionEnded: 'classpulse_session_ended'
  };

  const DEFAULT_SETTINGS = {
    earlyWarningAlerts: true,
    aggregatePrivacyMode: true,
    soundNotifications: false
  };

  const SESSION_DATA = {
    module: 'PROG6112',
    lesson: 'Java Arrays Practical',
    lecturer: 'Current Lecturer',
    connected: 20,
    responded: 20,
    started: '14:05',
    elapsed: 19,
    before: { understand: 55, unsure: 20, stuck: 25 },
    after: { understand: 85, unsure: 10, stuck: 5 },
    hotspots: [
      { topic: 'Array Indexing', value: 45 },
      { topic: 'Looping Arrays', value: 18 },
      { topic: 'Array Creation', value: 8 }
    ]
  };

  const HISTORY = {
    arrays: { module: 'PROG6112', session: 'Java Arrays Practical', initial: 55, final: 92, intervention: '7-Minute Peer Check', date: '30 Sep 2026', improvement: 37,
      timeline: [['14:05','Session Started'],['14:22','Early Warning – Array Indexing'],['14:24','7-Minute Peer Check Started'],['14:31','Understanding Increased']],
      outcome: 'Effective', note: 'The intervention reduced stuck responses before the class progressed to the next concept.' },
    inheritance: { module: 'PROG6112', session: 'Inheritance Recap', initial: 70, final: 90, intervention: 'Mini Recap', date: '25 Sep 2026', improvement: 20,
      timeline: [['09:00','Session Started'],['09:18','Early Warning – Method Overriding'],['09:20','Mini Recap Started'],['09:27','Understanding Increased']],
      outcome: 'Effective', note: 'A short recap reduced uncertainty before the practical continued.' },
    loops: { module: 'PROG6112', session: 'Loops Practical', initial: 75, final: 92, intervention: 'Worked Example', date: '18 Sep 2026', improvement: 17,
      timeline: [['12:00','Session Started'],['12:16','Early Warning – Nested Loops'],['12:18','Worked Example Started'],['12:25','Understanding Increased']],
      outcome: 'Effective', note: 'A worked example clarified the most common loop error before students moved on.' },
    exceptions: { module: 'PROG6112', session: 'Exception Handling', initial: 80, final: 95, intervention: 'Q&A Pause', date: '11 Sep 2026', improvement: 15,
      timeline: [['10:00','Session Started'],['10:14','Uncertainty – Catch Blocks'],['10:16','Q&A Pause Started'],['10:23','Understanding Increased']],
      outcome: 'Effective', note: 'The targeted Q&A resolved repeated questions before the next activity.' }
  };

  function getStoredJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function setStoredJSON(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2600);
  }

  function navigate(url) { window.location.href = url; }

  function setupMobileMenu() {
    const toggle = document.querySelector('[data-menu-toggle]');
    const sidebar = document.querySelector('.sidebar');
    if (!toggle || !sidebar) return;
    toggle.addEventListener('click', function () {
      const isOpen = sidebar.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    document.addEventListener('click', function (event) {
      if (window.innerWidth > 900 || !sidebar.classList.contains('open')) return;
      if (!sidebar.contains(event.target) && !toggle.contains(event.target)) {
        sidebar.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  function setGreeting() {
    const el = document.querySelector('[data-greeting]');
    if (!el) return;
    const hour = new Date().getHours();
    const word = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    el.textContent = word + ', Lecturer';
  }

  function setActiveNavigation() {
    const current = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('[data-nav-page]').forEach(link => {
      const target = (link.getAttribute('data-nav-page') || '').toLowerCase();
      link.classList.toggle('active', target === current);
      if (target === current) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    setupMobileMenu();
    setGreeting();
    setActiveNavigation();
  });

  window.ClassPulse = {
    STORAGE_KEYS,
    DEFAULT_SETTINGS,
    SESSION_DATA,
    HISTORY,
    getStoredJSON,
    setStoredJSON,
    showToast,
    navigate
  };
})();
