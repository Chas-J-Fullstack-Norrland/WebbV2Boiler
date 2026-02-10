import type { Comment } from '../types';
import { BASE_URL, getPostQueue, savePostQueue } from './client';

/**
 * Hämtar alla kommentarer. Sparar ner dem i localStorage för offline-åtkomst.
 */
export async function getComments(): Promise<Comment[]> {
  try {
    const response = await fetch(`${BASE_URL}/comments`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    
    const data: Comment[] = await response.json();
    localStorage.setItem("comments", JSON.stringify(data));
    return data;

  } catch (error) {
    console.error("Failed to fetch comments, loading cache:", error);
    const cached = localStorage.getItem("comments");
    return cached ? JSON.parse(cached) : [];
  }
}

let sample = DataTransfer;

/**
 * Hämtar en enskild kommentar via ID.
 */
export async function getComment(id: string): Promise<Comment> {
  try {
    const response = await fetch(`${BASE_URL}/comments/${id}`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);

    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch comment ${id}:`, error);
    throw error;
  }
}

/**
 * Lägger till en kommentar. 
 */
export async function addComment(comment: Comment) {
  const url = `${BASE_URL}/comments/`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment)
    });

    if (!response.ok) throw new Error('Failed to add comment');
    return await response.json();

  } catch (error) {
    console.warn("Offline? Comment added to sync queue:", comment);
    const queue = getPostQueue();
    queue.push({
      url: url,
      payload: comment
    });
    savePostQueue(queue);
  }
}

/**
 * Uppdaterar en befintlig kommentar.
 */
export async function updateComment(comment: Comment) {
  const response = await fetch(`${BASE_URL}/comments/${comment.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(comment)
  });

  if (!response.ok) throw new Error('Failed to update comment');
  return response.json();
}

/**
 * Tar bort en kommentar via ID.
 */
export async function removeComment(id: string) {
  const response = await fetch(`${BASE_URL}/comments/${id}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Failed to delete comment');
}