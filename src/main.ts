import './style.css';
import { 
  getPost,getComment,getComments,getPosts,addComment,addPost,updateComment,updatePost,removeComment,removePost
} from './api';
import { login } from './auth';

// --- TYPER ---
export interface Post {
  id: string;
  title: string;
  author: string;
  content: string;
  date: string;
  published?: boolean
}

export interface Comment {
  id: string;
  postid: string;
  text: string;
  approved?: boolean;  // for admin “mark”
  author: string;
}


interface PostWithComments extends Post {
  comments: Comment[];
}

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


// --- ROUTING ---
const path = window.location.pathname;

if (path === '/' || path === '/index.html') {
  initIndexPage();
} else if (path === '/create.html') {
  initCreatePage();
} else if (path === '/post.html') {
  initPostPage();
}  else if (path === '/admin.html') {
  initAdminPage();
}          

// --- INDEX PAGE (Startsida) ---
async function initIndexPage() {
  const blogListElement = document.getElementById('blog-list');
  if (!blogListElement) return;

  // Await the async functions
  const allPosts = await getAllPostsSorted();
  const allComments = await getComments();

  const postsWithComments: PostWithComments[] = allPosts.map((post: Post) => ({
    ...post,
    comments: allComments.filter(c => c.postid === post.id)
  }));

  blogListElement.innerHTML = '';

  postsWithComments.forEach(post => {
    const article = document.createElement('article');
    article.className = 'bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full relative group';

    const dateObj = new Date(post.date);
    const dateStr = dateObj.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });

    const bgClass = 'bg-slate-600';

    article.innerHTML = `
      <div class="h-48 ${bgClass} w-full relative">
          <button class="delete-post-btn absolute top-2 right-2 bg-white/10 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer" title="Ta bort inlägg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        : ''}
      </div>
      
      <div class="p-6 flex flex-col flex-1">
        <div class="flex items-center text-xs text-slate-500 mb-3 space-x-2">
           <span class="font-medium text-slate-700">${post.author}</span>
           <span>&bull;</span>
           <time datetime="${post.date}">${dateStr}</time>
        </div>
        
        <h2 class="text-xl font-bold text-slate-900 mb-2 line-clamp-2">
          <a href="/post.html?id=${post.id}" class="hover:text-blue-600 transition-colors focus:outline-none focus:underline">
            ${post.title}
          </a>
        </h2>
        
        <p class="text-slate-600 text-sm mb-4 line-clamp-3 flex-grow">
          ${post.content}
        </p>

        <div class="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-sm">
          <a href="/post.html?id=${post.id}" class="text-blue-600 font-medium hover:text-blue-800 transition-colors">
            Läs mer &rarr;
          </a>
          <div class="flex items-center text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            <span>${post.comments.length}</span>
          </div>
        </div>
      </div>
    `;

      const deleteBtn = article.querySelector('.delete-post-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removePost(post.id).then(() => { initIndexPage(); });
        });
      }

    blogListElement.appendChild(article);
  });
}

// --- CREATE PAGE ---
function initCreatePage() {
  const form = document.getElementById('create-post-form') as HTMLFormElement;
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleInput = document.getElementById('title') as HTMLInputElement;
    const authorInput = document.getElementById('author') as HTMLInputElement;
    const contentInput = document.getElementById('content') as HTMLTextAreaElement;

    const newPost: Post = {
      id: `local-${Date.now()}`,
      title: titleInput.value,
      author: authorInput.value || 'Anonym',
      content: contentInput.value,
      published: true,
      date: new Date().toISOString()
    };

    addPost(newPost);
    window.location.href = '/index.html';
  });
}

// --- POST PAGE ---
async function initPostPage() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');

  if (!postId) {
    window.location.href = '/index.html';
    return;
  }


  const allPosts = await getAllPostsSorted();
  const post = allPosts.find((p: Post) => p.id === postId);

  if (!post) {
    document.querySelector('main')!.innerHTML = '<div class="text-center text-red-600 mt-10">Inlägget hittades inte.</div>';
    return;
  }

  document.getElementById('post-title')!.innerText = post.title;
  document.getElementById('post-content')!.innerText = post.content;
  document.getElementById('post-author')!.innerText = post.author;
  
  const dateObj = new Date(post.date);
  document.getElementById('post-date')!.innerText = dateObj.toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' });

  renderComments(postId);

  const commentForm = document.getElementById('comment-form') as HTMLFormElement;
  if (commentForm) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const authorInput = document.getElementById('comment-author') as HTMLInputElement;
      const textInput = document.getElementById('comment-text') as HTMLTextAreaElement;

      if (!textInput.value) return;

      const newComment: Comment = {
        id: `local-comment-${Date.now()}`,
        postid: postId,
        text: textInput.value,
        author: authorInput.value || 'Anonym'
      };

      addComment(newComment);
      authorInput.value = '';
      textInput.value = '';
      renderComments(postId);
    });
  }
}
//----ADMING PAGE----
async function initAdminPage() {
  const container = document.getElementById('admin-checklists');
  if (!container) return;

  try {
    const [posts, comments] = await Promise.all([
      getAllPostsSorted(),
      getComments()
    ]);

    if (posts.length === 0) {
      container.innerHTML = '<p class="text-slate-500">Inga inlägg ännu.</p>';
      return;
    }

    container.innerHTML = '';

    posts.forEach(post => {
      const postComments = comments.filter(c => c.postid === post.id);
      const isPublished = post.published ?? true;

      const section = document.createElement('article');
      section.className = 'mb-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6';

      const dateStr = new Date(post.date).toLocaleDateString('sv-SE', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });

      section.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <div>
            <h2 class="text-lg font-bold text-slate-900">${post.title}</h2>
            <p class="text-xs text-slate-500">
              Av ${post.author} • ${dateStr}
            </p>
          </div>
          <div class="text-right">
            <p class="text-xs mb-1">
              Status:
              <span data-published-status
                    class="${isPublished ? 'text-green-600' : 'text-red-600'} font-semibold">
                ${isPublished ? 'Publicerad' : 'Avpublicerad'}
              </span>
            </p>
            <button class="toggle-publish-btn text-xs px-3 py-1 rounded border
                           ${isPublished ? 'border-red-500 text-red-600' : 'border-green-500 text-green-600'}">
              ${isPublished ? 'Avpublicera' : 'Publicera'}
            </button>
          </div>
        </div>
        <div class="mt-4 border-t border-slate-100 pt-4">
          <h3 class="text-sm font-semibold text-slate-800 mb-2">
            Kommentarer (${postComments.length})
          </h3>
          <div class="space-y-2" data-comments-container></div>
        </div>
      `;

      const commentsContainer = section.querySelector('[data-comments-container]') as HTMLElement | null;

      if (commentsContainer) {
        postComments.forEach(comment => {
          const isApproved = comment.approved ?? false;

          const commentDiv = document.createElement('div');
          commentDiv.className =
            'flex items-start justify-between bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm';

          commentDiv.innerHTML = `
            <div class="mr-3">
              <p class="font-medium text-slate-900">${comment.author}</p>
              <p class="text-slate-700 break-words">${comment.text}</p>
            </div>
            <div class="flex flex-col items-end space-y-1">
              <span data-approved-status
                    class="text-xs ${isApproved ? 'text-green-600' : 'text-slate-500'}">
                ${isApproved ? 'OK' : 'Ej godkänd'}
              </span>
              <button class="toggle-approve-btn text-xs px-2 py-1 rounded border
                             ${isApproved ? 'border-red-500 text-red-600' : 'border-green-500 text-green-600'}">
                ${isApproved ? 'Ta bort OK' : 'Markera OK'}
              </button>
              <button class="delete-comment-btn text-xs text-red-600 hover:text-red-700">
                Radera
              </button>
            </div>
          `;

          const approveBtn = commentDiv.querySelector('.toggle-approve-btn') as HTMLButtonElement | null;
          const approvedStatus = commentDiv.querySelector('[data-approved-status]') as HTMLElement | null;
          const deleteBtn = commentDiv.querySelector('.delete-comment-btn') as HTMLButtonElement | null;

          approveBtn?.addEventListener('click', async () => {
            const newApproved = !(comment.approved ?? false);
            const updated: Comment = { ...comment, approved: newApproved };

            await updateComment(updated);
            comment.approved = newApproved;

            if (approvedStatus) {
              approvedStatus.textContent = newApproved ? 'OK' : 'Ej godkänd';
              approvedStatus.className =
                'text-xs ' + (newApproved ? 'text-green-600' : 'text-slate-500');
            }

            if (approveBtn) {
              approveBtn.textContent = newApproved ? 'Ta bort OK' : 'Markera OK';
              approveBtn.className =
                'toggle-approve-btn text-xs px-2 py-1 rounded border ' +
                (newApproved ? 'border-red-500 text-red-600' : 'border-green-500 text-green-600');
            }
          });

          deleteBtn?.addEventListener('click', async () => {
            await removeComment(comment.id);
            commentDiv.remove();
          });

          commentsContainer.appendChild(commentDiv);
        });
      }

      const publishBtn = section.querySelector('.toggle-publish-btn') as HTMLButtonElement | null;
      const publishedStatus = section.querySelector('[data-published-status]') as HTMLElement | null;

      publishBtn?.addEventListener('click', async () => {
        const newPublished = !(post.published ?? true);
        const updated: Post = { ...post, published: newPublished };

        await updatePost(updated);
        post.published = newPublished;

        if (publishedStatus) {
          publishedStatus.textContent = newPublished ? 'Publicerad' : 'Avpublicerad';
          publishedStatus.className =
            'text-xs ' + (newPublished ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold');
        }

        if (publishBtn) {
          publishBtn.textContent = newPublished ? 'Avpublicera' : 'Publicera';
          publishBtn.className =
            'toggle-publish-btn text-xs px-3 py-1 rounded border ' +
            (newPublished ? 'border-red-500 text-red-600' : 'border-green-500 text-green-600');
        }
      });

      container.appendChild(section);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="text-red-600">Kunde inte ladda admin-data.</p>';
  }
}


async function renderComments(postId: string) {
  const listElement = document.getElementById('comments-list');
  if (!listElement) return;

  const allComments = await getComments();
  const postComments = allComments.filter(c => c.postid === postId);

  if (postComments.length === 0) {
    listElement.innerHTML = '<p class="text-slate-500 italic">Inga kommentarer än. Bli den första att skriva!</p>';
    return;
  }

  listElement.innerHTML = '';
  postComments.forEach(comment => {
    const div = document.createElement('div');
    div.className = 'bg-slate-50 p-4 rounded-lg border border-slate-100 group hover:border-slate-300 transition-colors';
    
    div.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center space-x-2">
          <span class="font-semibold text-slate-900 text-sm">${comment.author}</span>
          '<span class="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Du</span>' : ''}
        </div>
          <button class="delete-btn text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer" title="Ta bort kommentar">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
         : ''}
      </div>
      <p class="text-slate-700 text-sm break-words">${comment.text}</p>
    `;
      div.querySelector('.delete-btn')?.addEventListener('click', () => {
        removeComment(comment.id).then(() => {renderComments(postId);
      });
    });

    listElement.appendChild(div);
  });
}

// --- DATA HANTERING ---
async function getAllPostsSorted(): Promise<Post[]> {
  const staticPosts: Post[] =  await getPosts();
  return staticPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}


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

