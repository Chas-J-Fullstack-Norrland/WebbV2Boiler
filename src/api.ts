// src/api.ts
const BASE_URL = '/api';
import type {Post,Comment} from "./main"


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

export async function getPost(id:Number) {
  try {
    const response = await fetch(`${BASE_URL}/posts/${id}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const todo = await response.json();
    return todo;

  } catch (error) {
    console.error("Failed to fetch post:", error);

    throw error;
  }
}

export async function getComment(id:Number) {
  try {
    const response = await fetch(`${BASE_URL}/comments/${id}`);

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const todo = await response.json();
    return todo;

  } catch (error) {
    console.error("Failed to fetch comment:", error);

    throw error;
  }
}

const POST_QUEUE_KEY = "post-queue";


function getPostQueue(): [] {
  const stored = localStorage.getItem(POST_QUEUE_KEY);
  return stored ? (JSON.parse(stored) as []) : [];
}

function savePostQueue(queue: []): void {
  localStorage.setItem(POST_QUEUE_KEY, JSON.stringify(queue));
}

export async function addPost(post:Post) {
  
  try{
    const response = await fetch(`${BASE_URL}/posts/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(todo)
  });
  
  if (!response.ok) {
    throw new Error('Failed to add post');
  }

  return response.json();
  }
  catch(error){
    const queue = getPostQueue();
    queue.push(todo);
    savePostQueue(queue);
  }
}





/** --- CHECKLISTOR (Huvudlistor) --- **/

export async function getChecklists() {
  const res = await fetch(`${BASE_URL}/checklists`);
  if (!res.ok) throw new Error('Kunde inte hämta checklistor');
  return res.json();
}

export async function getChecklist(id: string) {
  const res = await fetch(`${BASE_URL}/checklists/${id}`);
  if (!res.ok) throw new Error('Checklistan hittades inte');
  return res.json();
}

export async function createChecklist(checklist: { title: string; author: string; date: string }) {
  const res = await fetch(`${BASE_URL}/checklists`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(checklist)
  });
  if (!res.ok) throw new Error('Kunde inte skapa checklistan');
  return res.json();
}

export async function deleteChecklist(id: string) {
  const res = await fetch(`${BASE_URL}/checklists/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Kunde inte ta bort checklistan');
}

export async function getTasks(checklistId: string) {
  const res = await fetch(`${BASE_URL}/tasks?checklistId=${checklistId}`);
  if (!res.ok) throw new Error('Kunde inte hämta uppgifter');
  return res.json();
}

export async function createTask(task: { checklistId: string; text: string; completed: boolean }) {
  const res = await fetch(`${BASE_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task)
  });
  if (!res.ok) throw new Error('Kunde inte spara uppgiften');
  return res.json();
}

export async function updateTask(id: string, updates: { completed: boolean }) {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });
  if (!res.ok) throw new Error('Kunde inte uppdatera uppgiften');
  return res.json();
}

export async function deleteTask(id: string) {
  const res = await fetch(`${BASE_URL}/tasks/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Kunde inte ta bort uppgiften');
}

export async function checkServerStatus(): Promise<boolean> {
  try {
    const res = await fetch('/api/checklists', { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}