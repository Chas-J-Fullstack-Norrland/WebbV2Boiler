// src/api.ts
const BASE_URL = '/api';

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