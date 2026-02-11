import type { Post, Comment } from '../types';

export const BASE_URL = '/api';
export const POST_QUEUE_KEY = "post-queue";

export type QueuedItem = {
  url: string;
  payload: Post | Comment;
};

/**
 * Hämtar den aktuella kön av väntande anrop från localStorage.
 */
export function getPostQueue(): QueuedItem[] {
  const stored = localStorage.getItem(POST_QUEUE_KEY);
  return stored ? (JSON.parse(stored) as QueuedItem[]) : [];
}

/**
 * Sparar kön till localStorage.
 */
export function savePostQueue(queue: QueuedItem[]): void {
  localStorage.setItem(POST_QUEUE_KEY, JSON.stringify(queue));
}

/**
 * Försöker skicka alla väntande objekt i kön till servern.
 * Om ett anrop misslyckas igen sparas det kvar i kön för nästa försök.
 */
export async function flushPostQueue(): Promise<void> {
  const queue = getPostQueue();
  if (!queue.length) return;

  console.log(`Attempting to flush ${queue.length} items from queue...`);
  const remaining: QueuedItem[] = [];

  for (const item of queue) {
    try {
      const response = await fetch(item.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item.payload),
      });

      if (!response.ok) {
        throw new Error("Retry failed");
      }
      console.log(`Successfully synced item to ${item.url}`);
    } catch (error) {
      console.error("Sync failed for item, keeping in queue:", item.url);
      remaining.push(item); // Behåll objektet i kön om det fortfarande inte går
    }
  }

  savePostQueue(remaining);
}