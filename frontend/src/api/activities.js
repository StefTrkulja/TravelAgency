import api from '@/utils/axiosInstance';

export const createActivity = (itineraryId, payload) => api.post(`/activities/${itineraryId}`, payload);
export const listActivities = (itineraryId) => api.get(`/activities/by-itinerary/${itineraryId}`);
export const getActivity = (id) => api.get(`/activities/${id}`);
export const updateActivity = (id, payload) => api.put(`/activities/${id}`, payload);
export const deleteActivity = (id) => api.delete(`/activities/${id}`);
