import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import HomeView from '../views/HomeView.vue';
import SignUpView from '../views/SignUpView.vue';
import { store } from '@/utils/store';
import { ro } from 'vuetify/locale';

// Define your routes
const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/signup', name: 'SignUp', component: SignUpView },
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
