import './style.css';
import { login } from './auth';

let userinput = document.getElementById("user") as HTMLInputElement | null;
let passinput = document.getElementById("password") as HTMLInputElement | null;
let currentUserElement = document.getElementById("current-user")
let adminlink = document.getElementById("adminhref")
const userButton = document.getElementById("user-button");

userButton?.addEventListener('click', () => {    
    if (userinput && passinput && login(userinput.value, passinput.value)) {
      window.location.href = '/admin.html';
    } else
    {      alert("Fel användarnamn eller lösenord");
    }
});

function getCookieValue(name: string): string | null {
  const cookie = document.cookie
    .split("; ")
    .find(row => row.startsWith(name + "="));
  
  return cookie ? cookie.split("=")[1] : null;
}

function usercookieset(): void {
  if (!currentUserElement) return;
  
  const username = getCookieValue("username");
  console.log("Current user from cookie:", username);
  currentUserElement.textContent = username || "no-user";
  console.log("Admin link element:", adminlink);
  if (username =="admin") {
    adminlink?.classList.remove("hidden");
  } else {
    adminlink?.classList.add("hidden");
  }
}
usercookieset();

// --- ROUTING ---
const path = window.location.pathname;

async function initApp(){
  if (path === '/' || path === '/index.html') {
    import('./split/indexPage').then(module => {
      module.initIndexPage();
    })
  } else if (path === '/create.html') {
    import('./split/createPage').then(module => {
      module.initCreatePage();
    })
  } else if (path === '/post.html') {
    import('./split/postPage').then(module => {
      module.initPostPage();
    })
  } else if (path === '/admin.html') {
    import('./split/adminPage').then(module => {
      module.initAdminPage();
    })
  }
}

initApp();

window.addEventListener('online', async () => {
  console.log("Internet is back! Syncing...");
  
  const { flushPostQueue } = await import('./api');
  await flushPostQueue();
});

if ('serviceWorker' in navigator  && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((err) => {
        console.log('ServiceWorker registration failed: ', err);
      });
  });
}

