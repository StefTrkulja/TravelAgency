<template>
  <v-app-bar elevation="0" class="warm-navbar" density="comfortable">
    <!-- Logo / Home -->
    <v-btn class="navbar-brand" variant="text" @click="$router.push('/')">
      <div class="brand-content">
        <v-img src="@/assets/logo.png" alt="Tourist Agency Logo" width="32" height="32" class="brand-logo" />
        <span class="brand-text">Tourist Agency</span>
      </div>
    </v-btn>

    <v-spacer />

    <!-- Navigation Items -->
    <v-toolbar-items class="hidden-sm-and-down nav-items">
      <v-btn
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        variant="text"
        class="nav-item"
        :class="{ 'nav-item--active': isActive(item.to) }"
      >
        <v-icon class="nav-icon">{{ item.icon }}</v-icon>
        <span class="nav-text">{{ item.label }}</span>
      </v-btn>
    </v-toolbar-items>

    <v-spacer />

    <!-- Auth Section -->
    <div class="auth-section">
      <v-btn
        v-if="store.role === 'guest'"
        prepend-icon="mdi-login"
        to="/login"
        class="login-btn"
        size="large"
      >
        Login
      </v-btn>

      <v-menu v-else offset-y class="profile-menu">
        <template #activator="{ props }">
          <v-btn v-bind="props" class="profile-btn" icon>
            <v-avatar size="32" class="profile-avatar">
              <v-icon>mdi-account</v-icon>
            </v-avatar>
          </v-btn>
        </template>
        <v-card class="user-menu-card" elevation="8">
          <v-list class="user-menu">
            <v-list-item @click="showUserProfile" class="menu-item">
              <template #prepend>
                <v-icon class="menu-icon">mdi-account</v-icon>
              </template>
              <v-list-item-title>Profile</v-list-item-title>
            </v-list-item>
            <v-list-item @click="logout" class="menu-item">
              <template #prepend>
                <v-icon class="menu-icon">mdi-logout</v-icon>
              </template>
              <v-list-item-title>Logout</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-menu>
    </div>

    <!-- Mobile Menu -->
    <v-btn class="hidden-md-and-up mobile-menu-btn" icon @click="mobileMenuOpen = !mobileMenuOpen">
      <v-icon>mdi-menu</v-icon>
    </v-btn>
  </v-app-bar>

  <!-- Mobile Navigation Drawer -->
  <v-navigation-drawer
    v-model="mobileMenuOpen"
    temporary
    location="right"
    class="mobile-nav"
  >
    <v-list class="mobile-nav-list">
      <v-list-item
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        @click="mobileMenuOpen = false"
        class="mobile-nav-item"
      >
        <template #prepend>
          <v-icon class="mobile-nav-icon">{{ item.icon }}</v-icon>
        </template>
        <v-list-item-title>{{ item.label }}</v-list-item-title>
      </v-list-item>
    </v-list>
  </v-navigation-drawer>
</template>

<script>
import { store } from '@/utils/store';
import axiosInstance from '@/utils/axiosInstance';

export default {
  name: 'AppNavbar',
  data() {
    return {
      mobileMenuOpen: false,
    }
  },
  computed: {
    store() {
			console.log(store);	
      return store;
    },
    navItems() {
      // Definiši rute po ulozi
      if (this.store.role === 'user') {
        return [
          { label: 'My Destinations', to: '/my/destinations', icon: 'mdi-map-marker' },
          { label: 'My Tickets', to: '/my/tickets', icon: 'mdi-ticket-confirmation' },
          { label: 'Promotions', to: '/promotions', icon: 'mdi-tag' },
        ];
      }
      if (this.store.role === 'operator') {
        return [
          { label: 'Destinations', to: '/destinations', icon: 'mdi-map' },
          { label: 'Tickets', to: '/tickets', icon: 'mdi-ticket' },
          { label: 'Suppliers & Offers', to: '/suppliers-offers', icon: 'mdi-handshake' },
          { label: 'Travel Arrangements', to: '/arrangements', icon: 'mdi-briefcase' },
          { label: 'Promotions', to: '/promotions', icon: 'mdi-tag' },
        ];
      }
      if (this.store.role === 'manager') {
        return [
          { label: 'Arrangement Approval', to: '/arrangement-approval', icon: 'mdi-check-decagram' },
          { label: 'Operator Tickets', to: '/operator-tickets', icon: 'mdi-ticket-account' },
          { label: 'Reports & Analytics', to: '/reports', icon: 'mdi-chart-line' },
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

<style scoped lang="scss">
:root {
  --warm-primary: #D4730A;
  --warm-secondary: #F59E0B;
  --warm-accent: #F97316;
  --warm-light: #FEF3E2;
  --warm-lighter: #FFFBF5;
  --warm-gradient: linear-gradient(135deg, #D4730A 0%, #F59E0B 100%);
  --warm-gradient-light: linear-gradient(135deg, #FEF3E2 0%, #FFFBF5 100%);
}

.warm-navbar {
  background: var(--warm-gradient) !important;
  border-bottom: 1px solid rgba(245, 158, 11, 0.3) !important;
  backdrop-filter: blur(20px) !important;

  // Brand Section
  .navbar-brand {
    color: white !important;
    padding: 8px 16px !important;
    border-radius: 12px !important;
    transition: all 0.3s ease !important;

    .brand-content {
      display: flex;
      align-items: center;
      gap: 12px;

      .brand-logo {
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .brand-text {
        font-size: 1.2rem;
        font-weight: 700;
        letter-spacing: 0.5px;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      }
    }

    &:hover {
      background: rgba(255, 255, 255, 0.1) !important;
    }
  }

  // Navigation Items
  .nav-items {
    .nav-item {
      color: rgba(255, 255, 255, 0.9) !important;
      font-weight: 600 !important;
      letter-spacing: 0.3px !important;
      margin: 0 4px !important;
      border-radius: 12px !important;
      position: relative !important;
      transition: all 0.3s ease !important;
      padding: 8px 16px !important;

      .nav-icon {
        margin-right: 8px !important;
        font-size: 1.1rem !important;
      }

      .nav-text {
        font-size: 0.95rem !important;
      }

      &::before {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 2px;
        background: rgba(255, 255, 255, 0.8);
        transition: all 0.3s ease;
        transform: translateX(-50%);
      }

      &:hover {
        color: #ffffff !important;
        background: rgba(255, 255, 255, 0.15) !important;

        &::before {
          width: 80%;
        }
      }
    }

    .nav-item--active {
      background: rgba(255, 255, 255, 0.2) !important;
      color: #ffffff !important;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1) !important;

      &::before {
        width: 80%;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.25) !important;
      }
    }
  }

  // Auth Section
  .auth-section {
    .login-btn {
      background: white !important;
      color: var(--warm-primary) !important;
      border-radius: 12px !important;
      padding: 8px 20px !important;
      font-weight: 700 !important;
      letter-spacing: 0.5px !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15) !important;
      transition: all 0.3s ease !important;

      &:hover {
        background: var(--warm-light) !important;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2) !important;
      }
    }

    .profile-btn {
      color: rgba(255, 255, 255, 0.9) !important;
      transition: all 0.3s ease !important;

      .profile-avatar {
        background: rgba(255, 255, 255, 0.2) !important;
        color: white !important;
        border: 2px solid rgba(255, 255, 255, 0.3) !important;
      }

      &:hover {
        color: #ffffff !important;
        background: rgba(255, 255, 255, 0.15) !important;
      }
    }
  }

  // Mobile Menu Button
  .mobile-menu-btn {
    color: white !important;
    transition: all 0.3s ease !important;

    &:hover {
      background: rgba(255, 255, 255, 0.15) !important;
    }
  }
}

// User Menu Dropdown
.user-menu-card {
  margin-top: 8px !important;
  border-radius: 16px !important;
  overflow: hidden !important;
  backdrop-filter: blur(20px) !important;
  box-shadow: 0 8px 32px rgba(212, 115, 10, 0.25) !important;
  border: 1px solid rgba(245, 158, 11, 0.2) !important;
  background: white !important;

  .user-menu {
    .menu-item {
      transition: all 0.2s ease !important;
      margin: 4px 8px !important;
      border-radius: 12px !important;
      color: var(--warm-primary) !important;

      .menu-icon {
        color: var(--warm-secondary) !important;
      }

      &:hover {
        background: var(--warm-light) !important;
        color: var(--warm-primary) !important;

        .menu-icon {
          color: var(--warm-primary) !important;
        }
      }
    }
  }
}

// Mobile Navigation
.mobile-nav {
  background: var(--warm-gradient-light) !important;
  border-left: 1px solid rgba(212, 115, 10, 0.2) !important;

  .mobile-nav-list {
    padding: 16px 8px !important;

    .mobile-nav-item {
      margin-bottom: 8px !important;
      border-radius: 12px !important;
      color: var(--warm-primary) !important;
      transition: all 0.3s ease !important;

      .mobile-nav-icon {
        color: var(--warm-secondary) !important;
      }

      &:hover {
        background: white !important;
        color: var(--warm-primary) !important;

        .mobile-nav-icon {
          color: var(--warm-primary) !important;
        }
      }
    }
  }
}

// Responsive Design
@media (max-width: 768px) {
  .warm-navbar {
    .navbar-brand {
      padding: 4px 12px !important;

      .brand-content {
        gap: 8px;

        .brand-text {
          font-size: 1.1rem;
        }
      }
    }

    .auth-section {
      .login-btn {
        padding: 6px 16px !important;
        font-size: 0.9rem !important;
      }
    }
  }
}
</style>
