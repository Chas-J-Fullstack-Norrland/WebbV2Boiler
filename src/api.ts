// src/api.ts
const BASE_URL = '/api';
import type {Post,Comment} from "./main"

type QueuedItem = {
  url: string;
  payload: Post | Comment;
};


export async function getPosts() {
  try {
    const response = await fetch(`${BASE_URL}/posts`);
    const data:Post[] = await response.json();
    
    localStorage.setItem("posts",JSON.stringify(data));
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
;
    return data;

  } catch (error) {
    const cached: Post[] = JSON.parse(
      localStorage.getItem("posts") ?? "[]"
    );
    console.error("Failed to fetch posts:", error);

    return cached;
  }
}

export async function getComments() {
  try {
    const response = await fetch(`${BASE_URL}/comments`);
    const data:Comment[] = await response.json();
    
    localStorage.setItem("comments",JSON.stringify(data));
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
;
    return data;

  } catch (error) {
    const cached: Comment[] = JSON.parse(
      localStorage.getItem("comments") ?? "[]"
    );
    console.error("Failed to fetch posts:", error);

    return cached;
  }
}

export async function getPost(id:String) {
  try {
    const response = await fetch(`${BASE_URL}/posts/${id}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const todo:Post = await response.json();
    return todo;

  } catch (error) {
    console.error("Failed to fetch post:", error);

    throw error;
  }
}

export async function getComment(id:String) {
  try {
    const response = await fetch(`${BASE_URL}/comments/${id}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const todo:Comment = await response.json();
    return todo;

  } catch (error) {
    console.error("Failed to fetch comment:", error);

    throw error;
  }
}

const POST_QUEUE_KEY = "post-queue";


function getPostQueue(): QueuedItem[] {
  const stored = localStorage.getItem(POST_QUEUE_KEY);
  return stored ? (JSON.parse(stored) as QueuedItem[]) : [];
}

function savePostQueue(queue: any[]): void {
  localStorage.setItem(POST_QUEUE_KEY, JSON.stringify(queue));
}

export async function addPost(post:Post) {
  
  try{
    const response = await fetch(`${BASE_URL}/posts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(post)
  });
  
  if (!response.ok) {
    throw new Error('Failed to add post');
  }

  return response.json();
  }
  catch(error){
    const queue = getPostQueue();
    queue.push({
      url: `${BASE_URL}/posts/`,
      payload: post
    });
    savePostQueue(queue);
  }
}

export async function addComment(comment:Comment) {
  
  try{
    const response = await fetch(`${BASE_URL}/posts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(comment)
  });
  
  if (!response.ok) {
    throw new Error('Failed to add post');
  }

  return response.json();
  }
  catch(error){
    const queue = getPostQueue();
    queue.push({
      url: `${BASE_URL}/comments/`,
      payload: comment
    });
    savePostQueue(queue);
  }
}

export async function flushPostQueue() {
  const queue = getPostQueue();
  if (!queue.length) return;

  const remaining:any[] = [];

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
    } catch {
      remaining.push(item); // keep it for next retry
    }
  }

  savePostQueue(remaining);
}

export async function updatePost(post:Post) {
  const response = await fetch(`${BASE_URL}/posts/${post.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(post)
  });

  if (!response.ok) {
    throw new Error('Failed to update post');
  }

  return response.json();
}

export async function updateComment(comment:Comment) {
  const response = await fetch(`${BASE_URL}/comments/${comment.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(comment)
  });

  if (!response.ok) {
    throw new Error('Failed to update post');
  }

  return response.json();
}

export async function removePost(id:String) {
  await fetch(`${BASE_URL}/posts/${id}`, {
    method: 'DELETE'
  });
}

export async function removeComment(id:String) {
  await fetch(`${BASE_URL}/comments/${id}`, {
    method: 'DELETE'
  });
}
