// postPage.ts
import { getPost, getComments, addComment, removeComment } from '../api';
import type { Comment } from './types';

export async function initPostPage() {
  const params = new URLSearchParams(window.location.search);
  const postId = params.get('id');

  if (!postId) {
    window.location.href = '/index.html';
    return;
  }

  const post = await getPost(postId);

  if (!post) {
    const mainElement = document.querySelector('main');
    if (mainElement) {
      mainElement.innerHTML = '<div class="text-center text-red-600 mt-10">Inlägget hittades inte.</div>';
    }
    return;
  }

  // Fyll i data i DOM:en
  document.getElementById('post-title')!.innerText = post.title;
  document.getElementById('post-content')!.innerText = post.content;
  document.getElementById('post-author')!.innerText = post.author;
  
  const dateObj = new Date(post.date);
  document.getElementById('post-date')!.innerText = dateObj.toLocaleDateString('sv-SE', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });

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
        </div>
          <button class="delete-btn text-slate-400 hover:text-red-600 transition-colors p-1 cursor-pointer" title="Ta bort kommentar">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
      </div>
      <p class="text-slate-700 text-sm break-words">${comment.text}</p>
    `;

    div.querySelector('.delete-btn')?.addEventListener('click', () => {
      removeComment(comment.id).then(() => {
        renderComments(postId);
      });
    });

    listElement.appendChild(div);
  });
}