<template>
  <!-- App bar -->
  <v-app-bar density="comfortable" color="primary" dark>
    <v-app-bar-nav-icon @click="drawer = !drawer" />
    <v-toolbar-title>Travel Agency</v-toolbar-title>
    <v-spacer />

    <!-- Navigation buttons for logged-in users -->
    <div v-if="isLoggedIn" class="d-flex align-center ga-2 mr-4">
      <!-- User bookings button -->
      <v-btn 
        v-if="store.role === 'user'" 
        to="/traveler/bookings"
        variant="elevated" 
        color="secondary"
        prepend-icon="mdi-bookmark"
      >
        My Bookings
      </v-btn>
      
      <!-- Manager/Operator arrangements button -->
      <v-btn 
        v-if="store.role === 'manager' || store.role === 'MANAGER' || store.role === 'operator' || store.role === 'OPERATOR'" 
        to="/arrangements"
        variant="elevated" 
        color="secondary"
        prepend-icon="mdi-map"
      >
        Arrangements
      </v-btn>
      
      <!-- Manager calendar button -->
      <v-btn 
        v-if="store.role === 'manager' || store.role === 'MANAGER'" 
        to="/calendar"
        variant="elevated" 
        color="secondary"
        prepend-icon="mdi-calendar-month"
        class="ml-2"
      >
        Calendar
      </v-btn>
    </div>

    <div v-if="isLoggedIn" class="mr-4">
      <v-chip label>{{ store.username }}</v-chip>
      <v-chip label class="ml-2" color="secondary">{{ store.role }}</v-chip>
    </div>

    <v-btn v-if="!isLoggedIn" to="/login" variant="elevated" color="secondary" prepend-icon="mdi-login">Login</v-btn>
    <v-btn v-else @click="logout" variant="outlined" prepend-icon="mdi-logout">Logout</v-btn>
  </v-app-bar>

  <!-- Navigation drawer -->
  <v-navigation-drawer v-model="drawer">
    <v-list nav density="compact">
      <v-list-subheader>Navigation</v-list-subheader>
      <v-list-item to="/" prepend-icon="mdi-home" title="Home" />

      <!-- Meniji po rolama -->
      <template v-if="store.role==='OPERATOR'">
        <v-list-item to="/op/arrangements" prepend-icon="mdi-clipboard-list" title="Moji aranžmani" />
        <v-list-item to="/op/inquiries"    prepend-icon="mdi-send"            title="Pošalji upit" />
        <v-list-item to="/op/inquiries/list" prepend-icon="mdi-format-list-bulleted" title="Moji upiti" />
        <v-list-item to="/op/destinations" prepend-icon="mdi-map-marker"      title="Destinacije" />
        <v-list-item to="/calendar" prepend-icon="mdi-calendar-month" title="Activity Calendar" />
</template>

      <template v-else-if="store.role==='SUPPLIER'">
        <v-list-item to="/sup/inbox" prepend-icon="mdi-inbox" title="Zahtevi/Upiti" />
      </template>

      <template v-else-if="store.role==='manager' || store.role==='MANAGER'">
        <!-- <v-list-item to="/mgr/approvals" prepend-icon="mdi-check-decagram" title="Odobrenja" />
        <v-list-item to="/analytics" prepend-icon="mdi-chart-line" title="Analitika" /> -->
        <v-list-item to="/arrangements" prepend-icon="mdi-map" title="Arrangements" />
        <v-list-item to="/calendar" prepend-icon="mdi-calendar-month" title="Activity Calendar" />
      </template>

      <template v-else-if="store.role==='ADMIN'">
        <v-list-item to="/op/destinations" prepend-icon="mdi-map-marker" title="Destinacije" />
        <v-list-item to="/mgr/approvals" prepend-icon="mdi-check-decagram" title="Odobrenja" />
        <v-list-item to="/analytics" prepend-icon="mdi-chart-line" title="Analitika" />
      </template>

      <template v-else>
        <v-divider class="my-2" />
        <v-list-subheader>Explore</v-list-subheader>
        <v-list-item to="/arrangements" prepend-icon="mdi-calendar-text" title="Arrangements" />
      </template>
    </v-list>
  </v-navigation-drawer>

  <!-- Glavni sadržaj (role kartice) -->
  <v-container class="mt-6">
    <v-row>
      <v-col cols="12">
        <h2>Dobrodošli, {{ store.username || 'gost' }}</h2>
      </v-col>
    </v-row>

<v-row v-if="store.role==='OPERATOR'">
  <v-col cols="12" md="3">
    <v-card class="pa-4" link to="/op/arrangements"
            title="Moji aranžmani" subtitle="Kreiranje i uređivanje" />
  </v-col>

  <v-col cols="12" md="3">
    <v-card class="pa-4" link to="/op/destinations"
            title="Destinacije" subtitle="CRUD destinacija" />
  </v-col>

  <v-col cols="12" md="3">
    <v-card class="pa-4" link to="/op/inquiries"
            title="Pošalji upit dobavljaču" subtitle="Destinacija + datumi" />
  </v-col>

  <v-col cols="12" md="3">
    <v-card class="pa-4" link to="/op/inquiries/list"
            title="Moji upiti" subtitle="Pregled & ponude" />
  </v-col>

  <v-col cols="12" md="3">
    <v-card class="pa-4" link to="/calendar"
            title="Activity Calendar" subtitle="Schedule Management" />
  </v-col>
</v-row>


    <v-row v-else-if="store.role==='SUPPLIER'">
      <v-col cols="12" md="6"><v-card class="pa-4" to="/sup/inbox" title="Zahtevi/Upiti" subtitle="Odgovori i pošalji ponudu" /></v-col>
    </v-row>

    <v-row v-else-if="store.role==='MANAGER' || store.role==='manager'">
      <v-col cols="12" md="3"><v-card class="pa-4" to="/mgr/approvals" title="Odobrenja" subtitle="Pregled i odluka" /></v-col>
      <v-col cols="12" md="3"><v-card class="pa-4" to="/analytics" title="Analitika" subtitle="KPIs" /></v-col>
      <v-col cols="12" md="3"><v-card class="pa-4" to="/arrangements" title="Arrangements" subtitle="Travel Management" /></v-col>
      <v-col cols="12" md="3"><v-card class="pa-4" to="/calendar" title="Activity Calendar" subtitle="Schedule Management" /></v-col>
    </v-row>

    <v-row v-else-if="store.role==='ADMIN'">
      <v-col cols="12" md="3"><v-card class="pa-4" to="/op/destinations" title="Destinacije" /></v-col>
      <v-col cols="12" md="3"><v-card class="pa-4" to="/mgr/approvals" title="Odobrenja" /></v-col>
      <v-col cols="12" md="3"><v-card class="pa-4" to="/analytics" title="Analitika" /></v-col>
      <v-col cols="12" md="3"><v-card class="pa-4" to="/calendar" title="Activity Calendar" /></v-col>
    </v-row>

    <v-row v-else>
      <v-col cols="12"><v-alert type="info">Prijavite se za pristup funkcionalnostima.</v-alert></v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '@/utils/axiosInstance'
import { store } from '@/utils/store'

const drawer = ref(false)
const isLoggedIn = computed(() => store.role !== 'guest')

async function logout() {
  try { await api.post('/user/logout') } catch {}
  store.clearUser()
}
</script>
