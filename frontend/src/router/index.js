import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import HomeView from '../views/HomeView.vue';
import SignUpView from '../views/SignUpView.vue';
import { store } from '@/utils/store';
import { ro } from 'vuetify/locale';
import MyTicketsView from '@/views/user/MyTicketsView.vue';
import TicketsView from '../views/Operator/TicketsView.vue';  
import TicketDetailsView from '@/views/user/TicketDetailsView.vue';
import OperatorTicketDetails from '@/views/operator/OperatorTicketDetails.vue';
import ManagerTicketsView from '@/views/Manager/ManagerTicketsView.vue';
import ManagerTicketDetails from '../views/Manager/ManagerTicketDetails.vue';
import EscalationsView from '@/views/Manager/EscalationsView.vue';
import CompensationsView from '@/views/Manager/CompensationsView.vue';
import AnalyticsView from '@/views/Manager/AnalyticsView.vue';
// Define your routes
const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/signup', name: 'SignUp', component: SignUpView },
  { path: '/my/tickets', name: 'MyTickets', component: MyTicketsView, meta: { requiresAuth: true, role: ['user'] }},
  { path: '/tickets', name: 'Tickets', component: TicketsView, meta: { requiresAuth: true, role: ['operator'] }},
  { path: '/tickets/:id', name: 'OperatorTicketDetails', component: OperatorTicketDetails, meta: { requiresAuth: true, role: ['operator'] }},
  { path: '/my/tickets/:id', name: 'TicketDetails', component: TicketDetailsView, meta: { requiresAuth: true, role: ['user'] }},
  { path: '/operator-tickets', name: 'ManagerTicketsView', component: ManagerTicketsView, meta: { requiresAuth: true, role: ['manager'] }},
  { path: '/manager/tickets/:id', name: 'ManagerTicketDetails', component: ManagerTicketDetails, meta: { requiresAuth: true, role: ['manager'] }},
  { path: '/escalations', name: 'EscalationsView', component: EscalationsView, meta: { requiresAuth: true, role: ['manager'] }},
  { path: '/compensations', name: 'CompensationsView', component: CompensationsView, meta: { requiresAuth: true, role: ['manager'] }},
  { path: '/analytics', name: 'AnalyticsView', component: AnalyticsView, meta: { requiresAuth: true, role: ['manager'] }},
  { path: '/operator/triage/:id', name: 'ComplaintTriage', component: () => import('@/views/Operator/ComplaintTriage.vue') }
];

// Create the router instance
const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const userRole = store.role;
  const isLoggedIn = store.role !== 'guest';

  // Check if the route requires authentication
  if (to.meta.requiresAuth && !isLoggedIn) {
    return next('/login');
  }

  // Check if the route has specific role requirements
  if (to.meta.role && !to.meta.role.includes(userRole)) {
    return next('/');
  }

  // Prevent logged-in users from accessing login and signup pages
  if (isLoggedIn && (to.path === '/login' || to.path === '/signup')) {
    return next('/');
  }

  // Route to home if path doesn't exist in router paths
  if (!routes.some(route => route.name === to.name)) {
    return next('/');
  }

  next();
});

export default router;
