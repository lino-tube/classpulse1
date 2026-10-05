/* Demo authentication and role guards. This is intentionally browser-side only. */
(function () {
  const SESSION_KEY = 'classpulse_auth';
  const ACCOUNTS = {
    student: { email: 'st12344@rcconnect.edu.za', password: 'Student123', role: 'Student' },
    lecturer: { email: 'lecturer@rcconnect.edu.za', password: 'Lecturer123', role: 'Lecturer' }
  };

  function getAuth() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
      if (!saved || saved.loggedIn !== true) return null;
      const account = Object.values(ACCOUNTS).find(item => item.email === saved.email);
      if (!account || saved.role !== account.role) {
        sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return { email: account.email, role: account.role, loggedIn: true };
    }
    catch (e) { return null; }
  }

  function saveAuth(account) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: account.email, role: account.role, loggedIn: true }));
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  }

  function guardPage() {
    const requiredRole = document.body.dataset.role;
    if (!requiredRole || requiredRole === 'public') return true;
    const auth = getAuth();
    if (!auth) {
      document.body.hidden = true;
      window.location.replace('index.html');
      return false;
    }
    if (requiredRole !== auth.role.toLowerCase()) {
      document.body.hidden = true;
      sessionStorage.setItem('classpulse_access_notice', 'Access denied. Your ' + auth.role.toLowerCase() + ' account cannot open the ' + requiredRole + ' workspace.');
      window.location.replace(auth.role === 'Student' ? 'student-dashboard.html' : 'lecturer-dashboard.html');
      return false;
    }
    document.body.hidden = false;
    return true;
  }

  function initLogin() {
    const form = document.getElementById('loginForm');
    if (!form) return;
    const error = document.getElementById('loginError');
    const existing = getAuth();
    if (existing && existing.loggedIn) {
      window.location.replace(existing.role === 'Student' ? 'student-dashboard.html' : 'lecturer-dashboard.html');
      return;
    }

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      error.classList.remove('show');
      const email = document.getElementById('email').value.trim().toLowerCase();
      const password = document.getElementById('password').value;

      if (!email || !password) {
        error.textContent = 'Please enter your email and password.';
        error.classList.add('show');
        return;
      }

      const account = Object.values(ACCOUNTS).find(item => item.email === email);
      if (!account || account.password !== password) {
        error.textContent = 'Incorrect email or password.';
        error.classList.add('show');
        return;
      }
      saveAuth(account);
      window.location.href = account.role === 'Student' ? 'student-dashboard.html' : 'lecturer-dashboard.html';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!guardPage()) return;
    initLogin();
    const notice = sessionStorage.getItem('classpulse_access_notice');
    if (notice && document.body.dataset.role !== 'public') {
      sessionStorage.removeItem('classpulse_access_notice');
      const banner = document.createElement('div');
      banner.className = 'access-notice';
      banner.setAttribute('role', 'alert');
      banner.textContent = notice;
      (document.querySelector('.page') || document.querySelector('.student-shell') || document.body).prepend(banner);
    }
    document.querySelectorAll('[data-logout]').forEach(button => button.addEventListener('click', logout));
  });

  // Guard immediately so a forbidden workspace stays hidden during redirection.
  guardPage();

  window.ClassPulseAuth = { getAuth, logout, guardPage };
})();
