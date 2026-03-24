import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api'
});

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const createSession = (data) => API.post('/sessions', data);
export const getSessions = (params) => API.get('/sessions', { params });
export const getSession = (id) => API.get(`/sessions/${id}`);
export const updateSession = (id, data) => API.put(`/sessions/${id}`, data);
export const deleteSession = (id) => API.delete(`/sessions/${id}`);

export const pauseSession = (id) => API.patch(`/sessions/${id}/pause`);
export const resumeSession = (id) => API.patch(`/sessions/${id}/resume`);
export const completeSession = (id, data) => API.patch(`/sessions/${id}/complete`, data);

// ─── Stats ────────────────────────────────────────────────────────────────────
export const getOverallStats = () => API.get('/stats/overall');
export const getDailyStats = (days) => API.get('/stats/daily', { params: { days } });
