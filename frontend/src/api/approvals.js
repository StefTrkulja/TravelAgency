import api from '@/utils/axiosInstance';

export const sendForApproval = (payload) => api.post('/approvals/send', payload);          // OPERATOR
export const decideApproval   = (payload) => api.post('/approvals/decide', payload);       // MANAGER
export const listApprovals    = () => api.get('/approvals');                               // MANAGER
