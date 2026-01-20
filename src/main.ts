import './style.css';
import db from './data/db.json';

// --- TYPER ---
interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
}

interface Comment {
  id: string;
  postId: string;
  text: string;
  author: string;
}

interface PostWithComments extends Post {
  comments: Comment[];
}

const LOCAL_STORAGE_POSTS_KEY = 'my_blog_custom_posts';
const LOCAL_STORAGE_COMMENTS_KEY = 'my_blog_custom_comments';

// --- ROUTING ---
const path = window.location.pathname;

if (path === '/' || path === '/index.html') {
  initIndexPage();
} else if (path === '/create.html') {
  initCreatePage();
} else if (path === '/post.html') {
  initPostPage();
}

// --- INDEX PAGE (Startsida) ---
function initIndexPage() {
  const blogListElement = document.getElementById('blog-list');
  if (!blogListElement) return;

  const allPosts = getAllPostsSorted();
  const allComments = getAllComments();

  const postsWithComments: PostWithComments[] = allPosts.map(post => ({
    ...post,
    comments: allComments.filter(c => c.postId === post.id)
  }));

  blogListElement.innerHTML = '';
  
  postsWithComments.forEach(post => {
    const isLocal = post.id.startsWith('local-');
    
    // Skapa element
    const article = document.createElement('article');
    article.className = 'bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full relative group';

    const dateObj = new Date(post.date);
    const dateStr = dateObj.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short', year: 'numeric' });
    
    const bgClass = isLocal ? 'bg-slate-600' : 'bg-slate-600';

    article.innerHTML = `
      <div class="h-48 ${bgClass} w-full relative">
        ${isLocal ? `
          <button class="delete-post-btn absolute top-2 right-2 bg-white/10 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer" title="Ta bort inlägg">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        ` : ''}
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

    // Event listener för radering av inlägg
    if (isLocal) {
      const deleteBtn = article.querySelector('.delete-post-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          deleteLocalPost(post.id);
        });
      }
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
      date: new Date().toISOString()
    };

    saveLocalPost(newPost);
    window.location.href = '/index.html';
  });
}

// --- POST PAGE ---
function initPostPage() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');

  if (!postId) {
    window.location.href = '/index.html';
    return;
  }

  const allPosts = getAllPostsSorted();
  const post = allPosts.find(p => p.id === postId);

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
        postId: postId,
        text: textInput.value,
        author: authorInput.value || 'Anonym'
      };

      saveLocalComment(newComment);
      authorInput.value = '';
      textInput.value = '';
      renderComments(postId);
    });
  }
}

function renderComments(postId: string) {
  const listElement = document.getElementById('comments-list');
  if (!listElement) return;

  const allComments = getAllComments();
  const postComments = allComments.filter(c => c.postId === postId);

  if (postComments.length === 0) {
    listElement.innerHTML = '<p class="text-slate-500 italic">Inga kommentarer än. Bli den första att skriva!</p>';
    return;
  }

  listElement.innerHTML = '';
  postComments.forEach(comment => {
    const isLocal = comment.id.startsWith('local-');
    const div = document.createElement('div');
    div.className = 'bg-slate-50 p-4 rounded-lg border border-slate-100 group hover:border-slate-300 transition-colors';
    
    div.innerHTML = `
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center space-x-2">
          <span class="font-semibold text-slate-900 text-sm">${comment.author}</span>
          ${isLocal ? '<span class="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-bold">Du</span>' : ''}
        </div>
        ${isLocal ? `
          <button class="delete-btn text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer" title="Ta bort kommentar">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        ` : ''}
      </div>
      <p class="text-slate-700 text-sm break-words">${comment.text}</p>
    `;

    if (isLocal) {
      div.querySelector('.delete-btn')?.addEventListener('click', () => {
        deleteLocalComment(comment.id, postId);
      });
    }

    listElement.appendChild(div);
  });
}

// --- DATA HANTERING ---
function getAllPostsSorted(): Post[] {
  const staticPosts: Post[] = db.posts;
  const localPosts: Post[] = getLocalData(LOCAL_STORAGE_POSTS_KEY);
  return [...localPosts, ...staticPosts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function getAllComments(): Comment[] {
  const staticComments: Comment[] = db.comments;
  const localComments: Comment[] = getLocalData(LOCAL_STORAGE_COMMENTS_KEY);
  return [...staticComments, ...localComments];
}

function getLocalData(key: string): any[] {
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch (e) { return []; }
}

function saveLocalPost(post: Post) {
  const current = getLocalData(LOCAL_STORAGE_POSTS_KEY);
  current.push(post);
  localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(current));
}

function deleteLocalPost(id: string) {
  const current = getLocalData(LOCAL_STORAGE_POSTS_KEY);
  const updated = current.filter((p: Post) => p.id !== id);
  localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updated));
  
  initIndexPage();
}

function saveLocalComment(comment: Comment) {
  const current = getLocalData(LOCAL_STORAGE_COMMENTS_KEY);
  current.push(comment);
  localStorage.setItem(LOCAL_STORAGE_COMMENTS_KEY, JSON.stringify(current));
}

function deleteLocalComment(commentId: string, postId: string) {
  const current = getLocalData(LOCAL_STORAGE_COMMENTS_KEY);
  const updated = current.filter((c: Comment) => c.id !== commentId);
  localStorage.setItem(LOCAL_STORAGE_COMMENTS_KEY, JSON.stringify(updated));
  renderComments(postId);
}

if ('serviceWorker' in navigator) {
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