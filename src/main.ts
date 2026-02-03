import './style.css';
import { 
  getChecklists, getChecklist, createChecklist, deleteChecklist,
  getTasks, createTask, updateTask, deleteTask, checkServerStatus 
} from './api';

// --- TYPER ---
interface Checklist {
  id: string;
  title: string;
  author: string;
  date: string;
}

interface Task {
  id: string;
  checklistId: string;
  text: string;
  completed: boolean;
  approved?: boolean;  // for admin “mark”
}

// --- ROUTING ---
const path = window.location.pathname;

(async () => {
  if (path === '/' || path === '/index.html') {
    await initIndexPage();
  } else if (path === '/create.html') {
    initCreatePage();
  } else if (path === '/checklists.html') {
    await initPostPage();
  }
})();

/**
 * HJÄLPFUNKTION: Skapar eller hämtar en error-banner
 */
function getErrorBanner(parentElement: HTMLElement) {
  let banner = document.getElementById('server-error-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'server-error-banner';
    banner.className = 'hidden bg-red-600 text-white p-4 rounded-lg mb-6 font-bold text-center animate-pulse shadow-lg';
    banner.innerText = '⚠️ Ingen anslutning till servern. Appen är låst.';
    parentElement.prepend(banner);
  }
  return banner;
}

// --- INDEX PAGE (Översikt) ---
async function initIndexPage() {
  const container = document.getElementById('blog-list');
  if (!container) return;

  container.innerHTML = '<div class="text-center py-10 text-slate-500 font-medium">Laddar checklistor...</div>';

  try {
    const checklists: Checklist[] = await getChecklists();
    checklists.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    container.innerHTML = '';
    if (checklists.length === 0) {
      container.innerHTML = '<p class="text-center text-slate-500 py-10">Inga checklistor hittades. Skapa en ny!</p>';
      return;
    }

    checklists.forEach(list => {
      const card = document.createElement('div');
      card.className = 'bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-blue-200 transition-colors';
      const dateStr = new Date(list.date).toLocaleDateString('sv-SE');

      card.innerHTML = `
        <div class="flex-grow">
          <h2 class="text-xl font-bold text-slate-900">
            <a href="/checklists.html?id=${list.id}" class="hover:text-blue-600 transition-colors">${list.title}</a>
          </h2>
          <p class="text-sm text-slate-500 mt-1">Skapad av ${list.author} • ${dateStr}</p>
        </div>
        <button class="delete-list-btn p-2 text-slate-300 hover:text-red-600 transition-colors cursor-pointer" title="Ta bort lista">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      `;

      card.querySelector('.delete-list-btn')?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (confirm(`Vill du ta bort "${list.title}"?`)) {
          await deleteChecklist(list.id);
          initIndexPage();
        }
      });
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = '<div class="bg-red-50 text-red-700 p-4 rounded-lg text-center font-bold">Kunde inte ansluta till servern.</div>';
  }
}

// --- CREATE PAGE ---
function initCreatePage() {
  const form = document.getElementById('create-checklist-form') as HTMLFormElement;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
  const inputs = form?.querySelectorAll('input');
  
  if (!form || !submitBtn) return;

  const banner = getErrorBanner(form.parentElement!);

  async function updateUIStatus() {
    const isUp = await checkServerStatus();
    submitBtn.disabled = !isUp;
    inputs?.forEach(input => input.disabled = !isUp);
    isUp ? banner.classList.add('hidden') : banner.classList.remove('hidden');
  }

  updateUIStatus();
  setInterval(updateUIStatus, 5000);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('title') as HTMLInputElement;
    const authorInput = document.getElementById('author') as HTMLInputElement;

    submitBtn.disabled = true;
    submitBtn.innerText = 'Skapar lista...';

    try {
      await createChecklist({
        title: titleInput.value,
        author: authorInput.value || 'Anonym',
        date: new Date().toISOString()
      });
      window.location.href = '/index.html';
    } catch (err) {
      alert('Kunde inte spara checklistan.');
      submitBtn.disabled = false;
      submitBtn.innerText = 'Publicera CheckList';
    }
  });
}

// --- VIEW LIST PAGE ---
async function initPostPage() {
  const params = new URLSearchParams(window.location.search);
  const checklistId = params.get('id');

  if (!checklistId) {
    window.location.href = '/index.html';
    return;
  }

  const titleEl = document.getElementById('post-title');
  const authorEl = document.getElementById('post-author');
  const dateEl = document.getElementById('post-date');
  const taskForm = document.getElementById('task-form') as HTMLFormElement;
  const taskInput = document.getElementById('task-text') as HTMLInputElement;
  const taskBtn = document.getElementById('task-submit-btn') as HTMLButtonElement;
  const errorEl = document.getElementById('error-message');

  const banner = getErrorBanner(document.querySelector('main')!);

  // Auto-recovery och låsning av UI på detaljsidan
  async function updateUIStatus() {
    const isUp = await checkServerStatus();
    if (taskInput) taskInput.disabled = !isUp;
    if (taskBtn) taskBtn.disabled = !isUp;
    document.querySelectorAll('.task-checkbox, .delete-task-btn').forEach((el: any) => el.disabled = !isUp);
    isUp ? banner.classList.add('hidden') : banner.classList.remove('hidden');
  }

  setInterval(updateUIStatus, 5000);

  try {
    const list: Checklist = await getChecklist(checklistId);
    if (titleEl) titleEl.innerText = list.title;
    if (authorEl) authorEl.innerText = list.author;
    if (dateEl) dateEl.innerText = new Date(list.date).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });

    await renderTasks(checklistId);

    taskForm?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = taskInput.value.trim();
      if (!text) return;

      taskBtn.disabled = true;
      if (errorEl) errorEl.classList.add('hidden');

      try {
        await createTask({ checklistId, text, completed: false });
        taskInput.value = '';
        await renderTasks(checklistId);
      } catch (err) {
        if (errorEl) {
          errorEl.innerText = 'Kunde inte spara uppgiften.';
          errorEl.classList.remove('hidden');
        }
      } finally {
        taskBtn.disabled = false;
      }
    });

  } catch (err) {
    if (titleEl) titleEl.innerText = 'Kunde inte hitta checklistan';
  }
}

async function renderTasks(checklistId: string) {
  const listElement = document.getElementById('tasks-list');
  if (!listElement) return;

  listElement.innerHTML = '<p class="text-slate-400 italic">Hämtar uppgifter...</p>';

  try {
    const tasks: Task[] = await getTasks(checklistId);
    if (tasks.length === 0) {
      listElement.innerHTML = '<p class="text-slate-400 py-4">Inga uppgifter tillagda än.</p>';
      return;
    }

    listElement.innerHTML = '';
    tasks.forEach(task => {
      const item = document.createElement('div');
      item.className = 'flex items-center justify-between p-4 bg-white border border-slate-100 rounded-lg group hover:border-blue-100 transition-all';
      
      item.innerHTML = `
        <div class="flex items-center space-x-4">
          <input type="checkbox" ${task.completed ? 'checked' : ''} 
            class="task-checkbox w-6 h-6 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer">
          <span class="text-lg ${task.completed ? 'line-through text-slate-400 font-medium' : 'text-slate-700 font-medium'}">
            ${task.text}
          </span>
        </div>
        <button class="delete-task-btn text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer p-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      `;

      const checkbox = item.querySelector('.task-checkbox') as HTMLInputElement;
      checkbox?.addEventListener('change', async () => {
        try {
          checkbox.disabled = true;
          await updateTask(task.id, { completed: checkbox.checked });
          await renderTasks(checklistId); 
        } catch (err) {
          alert("Kunde inte uppdatera status.");
          checkbox.checked = !checkbox.checked;
          checkbox.disabled = false;
        }
      });

      item.querySelector('.delete-task-btn')?.addEventListener('click', async () => {
        if (confirm(`Vill du ta bort "${task.text}"?`)) {
          try {
            await deleteTask(task.id);
            await renderTasks(checklistId);
          } catch (err) {
            alert("Gick inte att radera uppgiften.");
          }
        }
      });

      listElement.appendChild(item);
    });
  } catch (err) {
    listElement.innerHTML = '<p class="text-red-500 font-bold">Kunde inte hämta uppgifter från servern.</p>';
  }
  function initLoginPage() {
  if (isLoggedIn()) {
    window.location.href = '/admin.html';
    return;
  }

  const form = document.getElementById('login-form') as HTMLFormElement | null;
  if (!form) return;

  const userInput = document.getElementById('username') as HTMLInputElement;
  const passInput = document.getElementById('password') as HTMLInputElement;
  const errorEl = document.getElementById('login-error');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = login(userInput.value.trim(), passInput.value.trim());
    if (!ok) {
      if (errorEl) {
        errorEl.textContent = 'Fel användarnamn eller lösenord';
        errorEl.classList.remove('hidden');
      }
      return;
    }
    window.location.href = '/admin.html';
  });
}
// admin function
async function initAdminPage() {
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
    return;
  }

  const container = document.getElementById('admin-checklists');
  if (!container) return;

  container.innerHTML = '<p class="text-center text-slate-500 py-6">Laddar checklistor...</p>';

  try {
    const checklists: Checklist[] = await getChecklists();
    if (checklists.length === 0) {
      container.innerHTML = '<p class="text-center text-slate-500 py-6">Inga checklistor.</p>';
      return;
    }

    container.innerHTML = '';
    for (const list of checklists) {
      const card = document.createElement('div');
      card.className = 'bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-4';

      const dateStr = new Date(list.date).toLocaleDateString('sv-SE');

      card.innerHTML = `
        <div class="flex justify-between items-center mb-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">${list.title}</h2>
            <p class="text-sm text-slate-500">Av ${list.author} • ${dateStr}</p>
          </div>
          <button class="unpublish-btn text-red-600 hover:text-red-700 text-sm font-semibold">
            Avpublicera
          </button>
        </div>
        <button class="toggle-comments text-sm text-blue-600 hover:underline mb-3">
          Visa kommentarer
        </button>
        <div class="tasks-container hidden border-t border-slate-200 pt-3 space-y-2"></div>
      `;

      const tasksContainer = card.querySelector('.tasks-container') as HTMLDivElement;
      const toggleBtn = card.querySelector('.toggle-comments') as HTMLButtonElement;
      const unpublishBtn = card.querySelector('.unpublish-btn') as HTMLButtonElement;

      toggleBtn.addEventListener('click', async () => {
        const isHidden = tasksContainer.classList.contains('hidden');
        if (isHidden) {
          await renderAdminTasks(list.id, tasksContainer);
          tasksContainer.classList.remove('hidden');
          toggleBtn.textContent = 'Dölj kommentarer';
        } else {
          tasksContainer.classList.add('hidden');
          toggleBtn.textContent = 'Visa kommentarer';
        }
      });

      unpublishBtn.addEventListener('click', async () => {
        if (confirm(`Vill du avpublicera "${list.title}"?`)) {
          await deleteChecklist(list.id);
          await initAdminPage();
        }
      });

      container.appendChild(card);
    }
  } catch {
    container.innerHTML = '<p class="text-center text-red-600 font-bold py-6">Kunde inte ladda admin-data.</p>';
  }
}

async function renderAdminTasks(checklistId: string, container: HTMLElement) {
  container.innerHTML = '<p class="text-slate-400 text-sm">Laddar kommentarer...</p>';

  try {
    const tasks: Task[] = await getTasks(checklistId);
    if (tasks.length === 0) {
      container.innerHTML = '<p class="text-slate-400 text-sm">Inga kommentarer.</p>';
      return;
    }

    container.innerHTML = '';
    tasks.forEach(task => {
      const row = document.createElement('div');
      row.className = 'flex items-center justify-between text-sm';

      const approved = !!task.approved;

      row.innerHTML = `
        <span class="${approved ? 'text-green-700 font-medium' : 'text-slate-700'}">
          ${task.text}
        </span>
        <div class="flex gap-2">
          <button class="mark-btn px-2 py-1 rounded border text-xs ${
            approved ? 'border-green-600 text-green-700' : 'border-blue-600 text-blue-700'
          }">
            ${approved ? 'Avmarkera' : 'Markera OK'}
          </button>
          <button class="delete-btn px-2 py-1 rounded border border-red-600 text-red-700 text-xs">
            Radera
          </button>
        </div>
      `;

      const markBtn = row.querySelector('.mark-btn') as HTMLButtonElement;
      const deleteBtn = row.querySelector('.delete-btn') as HTMLButtonElement;

      markBtn.addEventListener('click', async () => {
        await updateTask(task.id, { approved: !approved });
        await renderAdminTasks(checklistId, container);
      });

      deleteBtn.addEventListener('click', async () => {
        if (confirm(`Ta bort kommentaren "${task.text}"?`)) {
          await deleteTask(task.id);
          await renderAdminTasks(checklistId, container);
        }
      });

      container.appendChild(row);
    });
  } catch {
    container.innerHTML = '<p class="text-red-600 text-sm">Kunde inte ladda kommentarer.</p>';
   }
  } 
}