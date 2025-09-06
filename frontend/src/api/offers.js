// src/api/offers.js
import api from '@/utils/axiosInstance';

export const listInquiries = () => api.get('/offers/inquiries');
export const submitOffer = (payload) => api.post('/offers/submit', payload);

// ↓ DODAJ OVO:
export const listOffersByArrangement = (arrangementId) =>
  api.get(`/offers/arrangement/${arrangementId}`);

// (opciono, kad zatreba)
export const sendInquiries = (payload) => api.post('/offers/inquiries', payload);
export const selectOffer = (payload) => api.post('/offers/select', payload);
