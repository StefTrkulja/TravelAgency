import { createRouter, createWebHistory } from 'vue-router';
import LoginView from '../views/LoginView.vue';
import HomeView from '../views/HomeView.vue';
import SignUpView from '../views/SignUpView.vue';
import AdminHomePage from '../views/AdminHomePage.vue';
import { store } from '@/utils/store';

// Operator
const OperatorHome = () => import('@/views/OperatorHome.vue');
const ArrangementList = () => import('@/views/ArrangementList.vue');
const ArrangementCreate = () => import('@/views/ArrangementCreate.vue');
const ArrangementDetail = () => import('@/views/ArrangementDetail.vue');
const SendInquiry = () => import('@/views/SendInquiry.vue');
const Destinations = () => import('@/views/Destinations.vue');
const Departures = () => import('@/views/Departures.vue');
const ItineraryEditor = () => import('@/views/ItineraryEditor.vue');
const OpInquiriesList = () => import('@/views/OpInquiriesList.vue');
const OpInquiryOffers = () => import('@/views/OpInquiryOffers.vue');
const CountriesAdmin = () => import('@/views/CountriesAdmin.vue');
const VouchersAdmin = () => import('@/views/VouchersAdmin.vue');

// Supplier
const SupplierHome = () => import('@/views/SupplierHome.vue');
const SupplierInbox = () => import('@/views/SupplierInbox.vue');
const OfferSubmit = () => import('@/views/OfferSubmit.vue');

// Manager
const ManagerHome = () => import('@/views/ManagerHome.vue');
const Approvals = () => import('@/views/Approvals.vue');

// Analytics
const Analytics = () => import('@/views/Analytics.vue');

// Tourist (public)
const TouristSearch = () => import('@/views/TouristSearch.vue');
const TouristArrangementDetail = () => import('@/views/TouristArrangementDetail.vue');
const TravelerProfile = () => import('@/views/TravelerProfile.vue'); 
// Define your routes
const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/login', name: 'Login', component: LoginView, meta: { public: true } },
  { path: '/signup', name: 'SignUp', component: SignUpView, meta: { public: true } },
  { path: '/anjaHomeView', name: 'AdminHomePage', component: AdminHomePage, meta: { roles: ['ADMIN'] } },

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
  { path: '/mgr', name: 'mgr-home', component: ManagerHome, meta: { roles: ['MANAGER','ADMIN'] } },
  { path: '/mgr/approvals', name: 'mgr-approvals', component: Approvals, meta: { roles: ['MANAGER','ADMIN','OPERATOR'] } },

  // ADMIN
  { path: '/admin/countries', name: 'admin-countries', component: CountriesAdmin, meta: { roles: ['ADMIN'] } },
  { path: '/admin/vouchers', name: 'admin-vouchers', component: VouchersAdmin, meta: { roles: ['ADMIN'] } },
  { path: '/analytics', name: 'analytics', component: Analytics, meta: { roles: ['OPERATOR','SUPPLIER','MANAGER','ADMIN'] } },
  { path: '/vouchers', redirect: { name: 'admin-vouchers' } },
  { path: '/vouchers/new', redirect: { name: 'admin-vouchers' } },

  // Tourist (public)
  { path: '/arrangements', name: 'arrangements-explore', component: TouristSearch, meta: { public: true } },
  { path: '/arrangements/:id', name: 'arrangement-public', component: TouristArrangementDetail, meta: { public: true } },
  { path: '/traveler/:username', name: 'traveler-profile', component: TravelerProfile, meta: { requiresAuth: true } },
  // Catch-all -> Home (ili posebna 404 stranica)
  { path: '/:pathMatch(.*)*', redirect: { name: 'Home' } },
];

// Create the router instance
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() { return { top: 0 }; },
});

// Unified guard
router.beforeEach((to, from, next) => {
  const userRole = store.role;                   // npr. 'guest' | 'OPERATOR' | 'SUPPLIER' | 'MANAGER' | 'ADMIN'
  const isLoggedIn = userRole && userRole !== 'guest';

  // 1) Public rute — svi mogu
  if (to.meta?.public) {
    // spreči pristup /login i /signup ako je već ulogovan
    if (isLoggedIn && (to.name === 'Login' || to.name === 'SignUp')) return next({ name: 'Home' });
    return next();
  }

  // 2) Ako ruta definiše roles → tretiraj kao requiresAuth
  const allowedRoles = to.meta?.roles;
  if (Array.isArray(allowedRoles) && allowedRoles.length) {
    if (!isLoggedIn) return next({ name: 'Login', query: { redirect: to.fullPath } });
    if (!allowedRoles.includes(userRole)) return next({ name: 'Home' });
    return next();
  }

  // 3) Default: rute bez meta.public i bez meta.roles su javne
  return next();
});

export default router;
