import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import HomeView from '../views/HomeView.vue';
import SignUpView from '../views/SignUpView.vue';
import AdminHomePage from '../views/AdminHomePage.vue';

import { store } from '@/utils/store';
import ActivitiesView from '../views/ActivitiesView.vue';
import ActivitySchedulesView from '../views/ActivitySchedulesView.vue';
import TravelerActivitiesView from '../views/TravelerActivitiesView.vue';
import AnalyticsDetailsView from '../views/AnalyticsDetails.vue';
import ActivityReviewsView from '../views/ActivityReviewsView.vue';
import ActivityCustomersView from '../views/ActivityCustomerView.vue';
import TravelerBookingsView from '../views/TravelerBookingsView.vue';
import { ro } from 'vuetify/locale';


// Operator
const OperatorHome = () => import('@/views/OperatorHome.vue')
const ArrangementList = () => import('@/views/ArrangementList.vue')
const ArrangementCreate = () => import('@/views/ArrangementCreate.vue')
const ArrangementDetail = () => import('@/views/ArrangementDetail.vue')
const SendInquiry = () => import('@/views/SendInquiry.vue')
const Destinations = () => import('@/views/Destinations.vue')
const Departures = () => import('@/views/Departures.vue')
const ItineraryEditor = () => import('@/views/ItineraryEditor.vue')
const OpInquiriesList = () => import('@/views/OpInquiriesList.vue')
const OpInquiryOffers = () => import('@/views/OpInquiryOffers.vue')



// Supplier
const SupplierHome = () => import('@/views/SupplierHome.vue')
const SupplierInbox = () => import('@/views/SupplierInbox.vue')
const OfferSubmit = () => import('@/views/OfferSubmit.vue')


// Manager
const ManagerHome = () => import('@/views/ManagerHome.vue')
const Approvals = () => import('@/views/Approvals.vue')


// Analytics
const Analytics = () => import('@/views/Analytics.vue')

// Calendar
const ActivityCalendarView = () => import('@/views/ActivityCalendarView.vue')



// Define your routes
const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/signup', name: 'SignUp', component: SignUpView },
  { path: '/anjaHomeView', name: 'AdminHomePage', component: AdminHomePage },

  // Operator
{ path: '/op', name: 'op-home', component: OperatorHome, meta: { roles: ['OPERATOR','ADMIN'] } },
{ path: '/op/arrangements', name: 'op-arrangements', component: ArrangementList, meta: { roles: ['OPERATOR','ADMIN'] } },
{ path: '/op/arrangements/new', name: 'op-arrangements-new', component: ArrangementCreate, meta: { roles: ['OPERATOR','ADMIN'] } },
{ path: '/op/arrangements/:id', name: 'op-arrangements-detail', component: ArrangementDetail, meta: { roles: ['OPERATOR','ADMIN'] } },
{ path: '/op/inquiries', name: 'op-inquiries', component: SendInquiry, meta: { roles: ['OPERATOR','ADMIN'] } },
{ path: '/op/destinations', name: 'op-destinations', component: Destinations, meta: { roles: ['OPERATOR','ADMIN'] } },
{ path: '/op/departures/:arrangementId', name: 'op-departures', component: Departures, meta: { roles: ['OPERATOR','ADMIN'] } },
{ path: '/op/itinerary/:departureId', name: 'op-itinerary', component: ItineraryEditor, meta: { roles: ['OPERATOR','ADMIN'] } },
  { path: '/op/inquiries/list', name: 'op-inquiries-list', component: OpInquiriesList, meta: { roles: ['OPERATOR','ADMIN'] } },
  { path: '/op/inquiries/:inquiryId/offers', name: 'op-inquiry-offers', component: OpInquiryOffers, meta: { roles: ['OPERATOR','ADMIN'] } },
 

// Supplier
{ path: '/sup', name: 'sup-home', component: SupplierHome, meta: { roles: ['SUPPLIER','ADMIN'] } },
{ path: '/sup/inbox', name: 'sup-inbox', component: SupplierInbox, meta: { roles: ['SUPPLIER','ADMIN'] } },
{ path: '/sup/offer/:supplierOfferId', name: 'sup-offer-submit', component: OfferSubmit, meta: { roles: ['SUPPLIER','ADMIN'] } },


// Manager
{ path: '/mgr', name: 'mgr-home', component: ManagerHome, meta: { roles: ['MANAGER','ADMIN','manager','admin'] } },
{ path: '/mgr/approvals', name: 'mgr-approvals', component: Approvals, meta: { roles: ['MANAGER','ADMIN','OPERATOR','manager','admin','operator'] } },


// Analytics (everyone logged-in can see; or restrict to MANAGER/ADMIN)
{ path: '/analytics', name: 'analytics', component: Analytics, meta: { roles: ['OPERATOR','SUPPLIER','MANAGER','ADMIN'] } },

// Calendar - Activity Schedule Management
{ path: '/calendar', name: 'activity-calendar', component: ActivityCalendarView, meta: { roles: ['MANAGER','ADMIN','OPERATOR','manager','admin','operator'] } },
  { path: '/arrangements/:arrangementId/activities', name: 'Activities', component: ActivitiesView },
  { path: '/activities/:activityId/schedules', name: 'ActivitySchedules', component: ActivitySchedulesView },
  { path: '/traveler/booking/:bookingId/activities', name: 'TravelerActivities', component: TravelerActivitiesView },
  { path: '/activities/:activityId/analytics/:analyticsId', name: 'AnalyticsDetails', component: AnalyticsDetailsView },
  { path: '/activities/:activityId/reviews', name: 'ActivityReviews', component: ActivityReviewsView },
  { path: '/activities/:activityId/customers', name: 'ActivityCustomers', component: ActivityCustomersView },
  { path: '/traveler/booking', name: 'TravelerBookings', component: TravelerBookingsView },
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
  if (to.meta.roles && !to.meta.roles.includes(userRole)) {
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
