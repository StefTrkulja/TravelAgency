<template>
  <v-app-bar :elevation="1" color="primary" density="comfortable">
    <!-- Logo / Home -->
    <v-btn class="navbar-title" variant="text" @click="$router.push('/')">
      <v-img src="@/assets/logo.png" alt="Tourist Agency Logo" width="28" height="28" class="navbar-logo" />
      Tourist Agency
    </v-btn>

    <v-spacer />

    <!-- Top menu items by role -->
    <v-toolbar-items class="hidden-sm-and-down">
      <v-btn
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        variant="text"
        class="nav-link"
        :class="{ 'nav-link--active': isActive(item.to) }"
        :prepend-icon="item.icon"
      >
        {{ item.label }}
      </v-btn>
    </v-toolbar-items>

    <v-spacer />

    <!-- Auth actions -->
    <v-btn
      v-if="store.role === 'guest'"
      size="large"
      prepend-icon="mdi-login"
      to="/login"
      variant="flat"
      color="white"
      class="text-primary"
    >
      Login
    </v-btn>

    <v-menu v-else>
      <template #activator="{ props }">
        <v-btn v-bind="props" icon="mdi-account-circle" />
      </template>
      <v-list>
        <v-list-item prepend-icon="mdi-account" @click="showUserProfile">Profile</v-list-item>
        <v-list-item prepend-icon="mdi-logout" @click="logout">Logout</v-list-item>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script>
import { store } from '@/utils/store';
import axiosInstance from '@/utils/axiosInstance';

export default {
  name: 'AppNavbar',
  computed: {
    store() {
			console.log(store);	
      return store;
    },
    navItems() {
      // Definiši rute po ulozi
      if (this.store.role === 'user') {
        return [
          { label: 'My Destination', to: '/my/destinations', icon: 'mdi-map-marker' },
          { label: 'My Tickets', to: '/my/tickets', icon: 'mdi-ticket-confirmation' },
          { label: 'Promotions', to: '/promotions', icon: 'mdi-tag' },
        ];
      }
      if (this.store.role === 'operator') {
        return [
          { label: 'Destination', to: '/destinations', icon: 'mdi-map' },
          { label: 'Tickets', to: '/tickets', icon: 'mdi-ticket' },
          { label: 'Suppliers & Offers', to: '/suppliers-offers', icon: 'mdi-handshake' },
          { label: 'Travel Arrangement', to: '/arrangements', icon: 'mdi-briefcase' },
          { label: 'Promotions', to: '/promotions', icon: 'mdi-tag' },
        ];
      }
      if (this.store.role === 'manager') {
        return [
          { label: 'Arrangement Approval', to: '/arrangement-approval', icon: 'mdi-check-decagram' },
          { label: 'Operator Tickets', to: '/operator-tickets', icon: 'mdi-ticket-account' }, // menadžerski view
          { label: 'Report & Analytics', to: '/reports', icon: 'mdi-chart-line' },
          { label: 'Report & Analytics', to: '/reports', icon: 'mdi-chart-line' },
        ];
      }
      return [];
    },
  },
  methods: {
    logout() {
      axiosInstance.post('/user/logout').finally(() => {
        try { this.store.clearUser?.(); } catch {}
        this.$router.push('/');
      });
    },
    showUserProfile() {
      this.$router.push(`/profile/${this.store.username}`);
    },
    isActive(path) {
      // Aktivan stil za sekcije i podstranice
      return this.$route.path === path || this.$route.path.startsWith(path + '/');
    },
  },
};
</script>

<style scoped>
.navbar-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #ffffff;
  text-transform: none;
  letter-spacing: 0.5px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.navbar-logo {
  margin-right: 4px;
  border-radius: 6px;
}
.nav-link {
  color: #fff;
  text-transform: none;
  font-weight: 600;
  letter-spacing: 0.2px;
}
.nav-link--active {
  background-color: rgba(255, 255, 255, 0.14) !important;
  border-radius: 8px;
}
@media (max-width: 960px) {
  .navbar-title {
    font-size: 1rem;
  }
}
</style>
