import api from '@/utils/axiosInstance';

export const createItinerary = (departureId, payload) => api.post(`/itineraries/${departureId}`, payload);
export const listItineraries = (departureId) => api.get(`/itineraries/by-departure/${departureId}`);
export const getItinerary = (id) => api.get(`/itineraries/${id}`);
export const updateItinerary = (id, payload) => api.put(`/itineraries/${id}`, payload);
export const deleteItinerary = (id) => api.delete(`/itineraries/${id}`);
