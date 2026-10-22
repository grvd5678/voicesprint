const BASE_URL = '/api';

export const api = {
  // Tasks
  async getTasks(params = {}) {
    const query = new URLSearchParams(params).toString();
    const res = await fetch(`${BASE_URL}/tasks${query ? `?${query}` : ''}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  async getTaskById(id) {
    const res = await fetch(`${BASE_URL}/tasks/${id}`);
    if (!res.ok) throw new Error('Failed to fetch task');
    return res.json();
  },

  async createTask(data) {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  async updateTask(id, data) {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update task');
    return res.json();
  },

  async deleteTask(id) {
    const res = await fetch(`${BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete task');
    return res.json();
  },

  async batchUpdatePositions(updates) {
    const res = await fetch(`${BASE_URL}/tasks/batch-positions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    });
    if (!res.ok) throw new Error('Failed to update task positions');
    return res.json();
  },

  // Sprints
  async getActiveSprint() {
    const res = await fetch(`${BASE_URL}/sprints/active`);
    if (!res.ok) throw new Error('Failed to fetch active sprint');
    return res.json();
  },

  async getSprints() {
    const res = await fetch(`${BASE_URL}/sprints`);
    if (!res.ok) throw new Error('Failed to fetch sprints');
    return res.json();
  },

  // Users
  async getUsers() {
    const res = await fetch(`${BASE_URL}/users`);
    if (!res.ok) throw new Error('Failed to fetch team members');
    return res.json();
  },

  // Voice Ingestion via Wispr Flow
  async previewVoiceIntake(transcript, sprintId) {
    const res = await fetch(`${BASE_URL}/voice/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, sprintId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Voice preview failed');
    }
    return res.json();
  },

  async sendVoiceIntake(transcript, sprintId) {
    const res = await fetch(`${BASE_URL}/voice/intake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, sprintId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Voice intake failed');
    }
    return res.json();
  },
};

