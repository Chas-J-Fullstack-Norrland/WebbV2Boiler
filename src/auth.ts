const ADMIN_COOKIE = 'username';

export function isLoggedIn(): boolean {
  return document.cookie.split('; ').some(c => c.startsWith(`${ADMIN_COOKIE}=`));
}

export function login(username: string, password: string): boolean {
  // Simple hard‑coded login for demo
  if (username === 'admin' && password === 'admin123') {
    const expires = new Date();
    expires.setDate(expires.getDate() + 1); // 1 day
    document.cookie = `${ADMIN_COOKIE}=${username}; path=/; expires=60`;
    return true;
  }
  return false;
}

export function logout() {
  document.cookie = `${ADMIN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function setupAuthUI() {
  const loginLink = document.getElementById('login-link');
  const adminLink = document.getElementById('admin-link');
  const logoutBtn = document.getElementById('logout-btn');

  const loggedIn = isLoggedIn();

  if (loginLink) loginLink.classList.toggle('hidden', loggedIn);
  if (adminLink) adminLink.classList.toggle('hidden', !loggedIn);

  if (logoutBtn) {
    logoutBtn.classList.toggle('hidden', !loggedIn);
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
      window.location.href = '/index.html';
    });
  }
}