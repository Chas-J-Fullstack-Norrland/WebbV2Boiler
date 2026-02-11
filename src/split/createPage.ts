import { addPost } from '../api';
import type { Post } from './types';

export function initCreatePage() {
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