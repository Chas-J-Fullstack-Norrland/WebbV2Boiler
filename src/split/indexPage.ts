import { getPosts, getComments, removePost } from '../api';
import type { Post, Comment } from './types';

interface PostWithComments extends Post {
  comments: Comment[];
}

// --- LOGIK FÖR INDEX SIDAN ---
export async function initIndexPage() {
  const blogListElement = document.getElementById('blog-list');
  if (!blogListElement) return;

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

async function getAllPostsSorted(): Promise<Post[]> {
  const staticPosts: Post[] = await getPosts();
  return staticPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}