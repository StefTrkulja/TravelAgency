import api from '@/utils/axiosInstance';

export const createDeparture = (arrangementId, payload) => api.post(`/departures/${arrangementId}`, payload);
export const listDepartures = (arrangementId) => api.get(`/departures/by-arrangement/${arrangementId}`);
export const getDeparture = (id) => api.get(`/departures/${id}`);
export const updateDeparture = (id, payload) => api.put(`/departures/${id}`, payload);
export const deleteDeparture = (id) => api.delete(`/departures/${id}`);
