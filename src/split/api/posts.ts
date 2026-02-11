import type { Post } from '../types';
import { BASE_URL, getPostQueue, savePostQueue } from './client';

/**
 * Hämtar alla inlägg. Vid nätverksfel returneras cachade inlägg från localStorage.
 */
export async function getPosts(): Promise<Post[]> {
  try {
    const response = await fetch(`${BASE_URL}/posts`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const data: Post[] = await response.json();
    localStorage.setItem("posts", JSON.stringify(data));
    return data;

  } catch (error) {
    console.error("Failed to fetch posts, loading cache:", error);
    const cached = localStorage.getItem("posts");
    return cached ? JSON.parse(cached) : [];
  }
}

/**
 * Hämtar ett specifikt inlägg via ID.
 */
export async function getPost(id: string): Promise<Post> {
  try {
    const response = await fetch(`${BASE_URL}/posts/${id}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch post ${id}:`, error);
    throw error;
  }
}

/**
 * Lägger till ett nytt inlägg. Hamnar i kön om användaren är offline.
 */
export async function addPost(post: Post) {
  try {
    const response = await fetch(`${BASE_URL}/posts/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post)
    });

    if (!response.ok) throw new Error('Failed to add post');
    return await response.json();

  } catch (error) {
    console.warn("Offline? Post added to queue:", post);
    const queue = getPostQueue();
    queue.push({
      url: `${BASE_URL}/posts/`,
      payload: post
    });
    savePostQueue(queue);
  }
}

/**
 * Uppdaterar ett befintligt inlägg.
 */
export async function updatePost(post: Post) {
  const response = await fetch(`${BASE_URL}/posts/${post.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(post)
  });

  if (!response.ok) throw new Error('Failed to update post');
  return response.json();
}

/**
 * Tar bort ett inlägg via ID.
 */
export async function removePost(id: string) {
  const response = await fetch(`${BASE_URL}/posts/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete post');
}