<template>
  <v-app-bar app density="comfortable" color="primary" dark>
    <v-app-bar-nav-icon @click="drawer = !drawer" />
    <v-toolbar-title>Travel Agency</v-toolbar-title>
    <v-spacer />

    <div v-if="isLoggedIn" class="mr-4">
      <v-chip label>{{ store.username }}</v-chip>
      <v-chip label class="ml-2" color="secondary">{{ store.role }}</v-chip>
    </div>

    <v-btn v-if="!isLoggedIn" to="/login" variant="elevated" color="secondary" prepend-icon="mdi-login">Login</v-btn>
    <v-btn v-else @click="logout" variant="outlined" prepend-icon="mdi-logout">Logout</v-btn>
  </v-app-bar>

  <v-navigation-drawer v-model="drawer" app>
    <v-list nav density="compact">
      <v-list-subheader>Navigation</v-list-subheader>

      <v-list-item to="/" prepend-icon="mdi-home" title="Home" />

      <!-- Operator meni -->
      <template v-if="role === 'OPERATOR'">
        <v-divider class="my-2" />
        <v-list-subheader>Operator</v-list-subheader>
        <v-list-item to="/arrangements" prepend-icon="mdi-calendar-text" title="Arrangements" />
        <v-list-item to="/arrangements/new" prepend-icon="mdi-plus-circle" title="Create arrangement" />
        <v-list-item to="/offers" prepend-icon="mdi-handshake" title="Supplier offers" />
        <v-list-item to="/approvals" prepend-icon="mdi-send" title="Send for approval" />
      </template>

      <!-- Manager meni -->
      <template v-else-if="role === 'MANAGER'">
        <v-divider class="my-2" />
        <v-list-subheader>Manager</v-list-subheader>
        <v-list-item to="/arrangements" prepend-icon="mdi-calendar-text" title="Arrangements" />
        <v-list-item to="/manager/approvals" prepend-icon="mdi-gavel" title="Review approvals" />
        <v-list-item to="/metrics" prepend-icon="mdi-chart-line" title="Performance" />
      </template>


      <!-- Supplier meni -->
      <template v-else-if="role === 'SUPPLIER'">
        <v-divider class="my-2" />
        <v-list-subheader>Supplier</v-list-subheader>
        <v-list-item to="/supplier/offers" prepend-icon="mdi-briefcase" title="My Offers" />
      </template>
	  
      <!-- Tourist meni (osnovno) -->
      <template v-else>
        <v-divider class="my-2" />
        <v-list-subheader>Explore</v-list-subheader>
        <v-list-item to="/arrangements" prepend-icon="mdi-calendar-text" title="Arrangements" />
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed } from 'vue';
import api from '@/utils/axiosInstance';
import { store } from '@/utils/store';

const drawer = ref(false);
const role = computed(() => store.role);
const isLoggedIn = computed(() => store.role !== 'guest');

async function logout() {
  try { await api.post('/user/logout'); } catch (_) {}
  store.clearUser();
}
</script>