const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

async function uploadFounderPhoto(file, password) {
  const form = new FormData();
  form.append('photo', file);
  const res = await fetch(`${API_URL}/api/founder/photo`, {
    method: 'POST',
    headers: { 'x-admin-password': password },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  return data;
}

async function downloadPdf(id, token) {
  const res = await fetch(`${API_URL}/api/sessions/${id}/pdf`, {
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed: ${res.status}`);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}

export const api = {
  createSession: (token) => request('/api/sessions', { method: 'POST', headers: authHeaders(token) }),
  getSession: (id, token) => request(`/api/sessions/${id}`, { headers: authHeaders(token) }),
  submitAnswer: (id, value, token) =>
    request(`/api/sessions/${id}/answer`, {
      method: 'POST',
      headers: authHeaders(token),
      body: JSON.stringify({ value }),
    }),
  advanceStage: (id, token) =>
    request(`/api/sessions/${id}/advance`, { method: 'POST', headers: authHeaders(token) }),
  listMySessions: (token) => request('/api/sessions/mine', { headers: authHeaders(token) }),
  deleteSession: (id, token) =>
    request(`/api/sessions/${id}`, { method: 'DELETE', headers: authHeaders(token) }),
  downloadPdf,

  getFounder: () => request('/api/founder'),
  verifyAdminPassword: (password) =>
    request('/api/founder/verify', { method: 'POST', headers: { 'x-admin-password': password } }),
  updateFounder: (patch, password) =>
    request('/api/founder', {
      method: 'PUT',
      headers: { 'x-admin-password': password },
      body: JSON.stringify(patch),
    }),
  uploadFounderPhoto,

  listReviews: () => request('/api/reviews'),
  createReview: (review, password) =>
    request('/api/reviews', {
      method: 'POST',
      headers: { 'x-admin-password': password },
      body: JSON.stringify(review),
    }),
  updateReview: (id, review, password) =>
    request(`/api/reviews/${id}`, {
      method: 'PUT',
      headers: { 'x-admin-password': password },
      body: JSON.stringify(review),
    }),
  deleteReview: (id, password) =>
    request(`/api/reviews/${id}`, { method: 'DELETE', headers: { 'x-admin-password': password } }),
};
