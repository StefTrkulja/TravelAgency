import api from '@/utils/axiosInstance';

export const listArrangements = (params) => api.get('/arrangements', { params });
export const listArrangementsGrouped = () => api.get('/arrangements/grouped');
export const getArrangement = (id) => api.get(`/arrangements/${id}`);
export const createArrangement = (payload) => api.post('/arrangements', payload);
export const updateArrangement = (id, payload) => api.put(`/arrangements/${id}`, payload);
export const deleteArrangement = (id) => api.delete(`/arrangements/${id}`);
