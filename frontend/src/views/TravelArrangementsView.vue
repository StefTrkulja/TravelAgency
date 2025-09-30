<template>
  <v-container class="arrangements-container" fluid>
    <!-- Header Section with Warm Gradient -->
    <div class="arrangements-header">
      <div class="arrangements-header-content">
        <div class="header-main">
          <div class="header-icon">
            <v-icon size="48" color="white">mdi-map</v-icon>
          </div>
          <div>
            <h1 class="arrangements-title font-heading">Travel Arrangements</h1>
            <p class="arrangements-subtitle">Manage all travel arrangements and their activities</p>
          </div>
        </div>
        
        <div class="header-actions">
          <v-chip 
            color="white" 
            variant="flat" 
            prepend-icon="mdi-counter"
            class="stats-chip"
          >
            {{ arrangements.length }} {{ arrangements.length === 1 ? 'Arrangement' : 'Arrangements' }}
          </v-chip>
          
          <v-btn 
            v-if="store.role === 'OPERATOR' || store.role === 'operator'"
            color="white" 
            variant="elevated"
            prepend-icon="mdi-plus"
            to="/op/arrangements/new"
            size="large"
            class="create-btn"
          >
            Create Arrangement
          </v-btn>
        </div>
      </div>
    </div>

    <div class="main-content">
      <!-- Status Messages -->
      <v-alert v-if="error" type="error" variant="tonal" class="modern-alert" prominent>
        <template v-slot:prepend>
          <v-icon>mdi-alert-circle</v-icon>
        </template>
        <strong>Error:</strong> {{ error }}
      </v-alert>

      <v-alert v-if="!loading && arrangements.length === 0" type="info" variant="tonal" class="modern-alert" prominent>
        <template v-slot:prepend>
          <v-icon>mdi-information</v-icon>
        </template>
        <strong>No travel arrangements found.</strong> 
        <span v-if="store.role === 'OPERATOR' || store.role === 'operator'">
          Create your first arrangement to get started.
        </span>
      </v-alert>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-content">
          <v-progress-circular size="64" indeterminate color="primary" />
          <p class="loading-text">Loading arrangements...</p>
        </div>
      </div>

      <!-- Arrangements List -->
      <div v-else-if="arrangements.length > 0" class="arrangements-grid">
        <v-card 
          v-for="arrangement in arrangements" 
          :key="arrangement.id"
          class="modern-card arrangement-card" 
          elevation="0"
          @click="goToActivities(arrangement)"
          hover
        >
          <v-card-text class="pa-8">
            <div class="arrangement-content">
              <div class="arrangement-main">
                <div class="arrangement-header">
                  <div class="arrangement-title-row">
                    <v-icon color="primary" size="28">mdi-map-marker</v-icon>
                    <h3 class="arrangement-title">{{ arrangement.title }}</h3>
                  </div>
                  
                  <div class="arrangement-status">
                    <v-chip 
                      :color="getStatusColor(arrangement.status)" 
                      variant="flat"
                      size="small"
                      class="status-chip"
                    >
                      {{ arrangement.status }}
                    </v-chip>
                  </div>
                </div>
                
                <div class="arrangement-details">
                  <div class="detail-item">
                    <v-icon size="18" color="grey-darken-1">mdi-map</v-icon>
                    <span>{{ arrangement.destination?.name || 'Destination' }}</span>
                  </div>
                  
                  <div class="detail-item">
                    <v-icon size="18" color="grey-darken-1">mdi-account</v-icon>
                    <span>Created by {{ arrangement.creator?.name || arrangement.createdByUsername }}</span>
                  </div>
                  
                  <div class="detail-item">
                    <v-icon size="18" color="grey-darken-1">mdi-transportation</v-icon>
                    <span>{{ arrangement.transportType }} • {{ arrangement.accommodationType }}</span>
                  </div>
                  
                  <div class="detail-item">
                    <v-icon size="18" color="grey-darken-1">mdi-tag</v-icon>
                    <span>{{ arrangement.type?.replace('_', ' ') }}</span>
                  </div>
                </div>

                <!-- Summary if available -->
                <div v-if="arrangement.summary" class="arrangement-summary">
                  <p class="summary-text">{{ arrangement.summary }}</p>
                </div>
              </div>
              
              <div class="arrangement-sidebar">
                <div class="price-section">
                  <div class="price-amount">${{ parseFloat(arrangement.basePricePerPerson || 0).toFixed(2) }}</div>
                  <div class="price-label">per person</div>
                </div>
                
                <v-btn 
                  color="primary" 
                  variant="elevated"
                  prepend-icon="mdi-map-marker-star"
                  size="large"
                  class="manage-btn"
                  @click.stop="goToActivities(arrangement)"
                >
                  Manage Activities
                </v-btn>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </div>
    </div>

    <!-- Snackbar for messages -->
    <v-snackbar v-model="snackbar.open" :timeout="3000" :color="snackbar.color" class="modern-snackbar">
      <div class="d-flex align-center">
        <v-icon class="mr-2">
          {{ snackbar.color === 'error' ? 'mdi-alert-circle' : 'mdi-check-circle' }}
        </v-icon>
        {{ snackbar.message }}
      </div>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axiosInstance'
import { store } from '@/utils/store'

const router = useRouter()

// Reactive data
const arrangements = ref([])
const loading = ref(true)
const error = ref('')
const snackbar = reactive({
  open: false,
  message: '',
  color: 'success'
})

// Methods
function getStatusColor(status) {
  const colors = {
    'ACTIVE': 'success',
    'DRAFT': 'warning',
    'PENDING': 'info',
    'INACTIVE': 'error',
    'READY': 'primary',
    'QUOTING': 'orange',
    'CHANGES_REQUESTED': 'purple'
  }
  return colors[status] || 'grey'
}

function goToActivities(arrangement) {
  router.push(`/arrangements/${arrangement.id}/activities`)
}

async function fetchArrangements() {
  try {
    loading.value = true
    error.value = ''
    
    // Use the new travel arrangements endpoint
    const { data } = await axios.get('/travel-arrangements')
    arrangements.value = data || []
    
  } catch (err) {
    console.error('Error fetching arrangements:', err)
    error.value = 'Failed to load travel arrangements. Please try again later.'
    snackbar.message = 'Failed to load arrangements'
    snackbar.color = 'error'
    snackbar.open = true
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchArrangements()
})
</script>

<style scoped>
.arrangements-container {
  background: var(--warm-bg);
  min-height: 100vh;
  padding: 0 !important;
  
  /* Background pattern */
  background-image: 
    radial-gradient(circle at 30% 70%, rgba(245, 158, 11, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(212, 115, 10, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.02) 0%, transparent 50%);
}

/* Header Section */
.arrangements-header {
  background: var(--warm-gradient);
  padding: 48px 24px;
  margin: 0 0 32px 0;
  color: white;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="rgba(255,255,255,0.05)" fill-opacity="0.4"><circle cx="30" cy="30" r="2"/></g></svg>') repeat;
    opacity: 0.3;
  }
}

.arrangements-header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.arrangements-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.arrangements-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 8px 0 0 0;
  font-weight: 400;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.stats-chip {
  background: rgba(255, 255, 255, 0.15) !important;
  color: white !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  font-weight: 600 !important;
}

.create-btn {
  background: rgba(255, 255, 255, 0.95) !important;
  color: var(--warm-orange) !important;
  border-radius: 16px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  text-transform: none !important;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.2) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  
  &:hover {
    background: white !important;
    box-shadow: 0 8px 24px rgba(255, 255, 255, 0.3) !important;
    transform: translateY(-2px);
  }
  
  :deep(.v-icon) {
    color: var(--warm-orange) !important;
  }
}

/* Main Content */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Modern Cards */
.modern-card {
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(245, 158, 11, 0.1) !important;
  border-radius: 24px !important;
  box-shadow: 0 8px 32px rgba(212, 115, 10, 0.12) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 48px rgba(212, 115, 10, 0.18) !important;
    border-color: rgba(245, 158, 11, 0.2) !important;
  }
}

/* Modern Alerts */
.modern-alert {
  border-radius: 16px !important;
  box-shadow: 0 4px 16px rgba(33, 150, 243, 0.1) !important;
  margin-bottom: 32px;
  
  :deep(.v-alert__content) {
    font-weight: 500;
  }
}

/* Loading Container */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-content {
  text-align: center;
}

.loading-text {
  margin-top: 24px;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--warm-orange);
}

/* Arrangements Grid */
.arrangements-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.arrangement-card {
  margin-bottom: 0 !important;
}

.arrangement-content {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.arrangement-main {
  flex: 1;
}

.arrangement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.arrangement-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.arrangement-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--warm-orange);
  margin: 0;
  letter-spacing: 0.3px;
}

.arrangement-status {
  margin-left: 16px;
}

.status-chip {
  font-weight: 600 !important;
  letter-spacing: 0.3px !important;
}

.arrangement-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  color: rgba(28, 25, 23, 0.8);
}

.arrangement-summary {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(245, 158, 11, 0.1);
}

.summary-text {
  color: rgba(28, 25, 23, 0.7);
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
}

.arrangement-sidebar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  min-width: 200px;
}

.price-section {
  text-align: center;
  padding: 20px;
  background: rgba(245, 158, 11, 0.03);
  border-radius: 16px;
  border: 1px solid rgba(245, 158, 11, 0.1);
  width: 100%;
}

.price-amount {
  font-size: 2rem;
  font-weight: 800;
  color: var(--warm-orange);
  line-height: 1;
  margin-bottom: 4px;
}

.price-label {
  font-size: 0.9rem;
  color: rgba(28, 25, 23, 0.6);
  font-weight: 500;
}

.manage-btn {
  border-radius: 16px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  text-transform: none !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 4px 16px rgba(212, 115, 10, 0.15) !important;
  width: 100%;
  
  &:hover:not(:disabled) {
    box-shadow: 0 8px 24px rgba(212, 115, 10, 0.25) !important;
    transform: translateY(-2px);
  }
}

/* Modern Snackbar */
.modern-snackbar {
  :deep(.v-snackbar__wrapper) {
    border-radius: 16px !important;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
  }
  
  :deep(.v-snackbar__content) {
    font-weight: 600;
    letter-spacing: 0.3px;
  }
}

/* Status Colors */
:deep(.v-chip--variant-flat) {
  &.text-success {
    background: rgba(16, 185, 129, 0.15) !important;
    color: #10B981 !important;
  }
  
  &.text-warning {
    background: rgba(245, 158, 11, 0.15) !important;
    color: var(--warm-orange) !important;
  }
  
  &.text-info {
    background: rgba(59, 130, 246, 0.15) !important;
    color: #3B82F6 !important;
  }
  
  &.text-error {
    background: rgba(239, 68, 68, 0.15) !important;
    color: #EF4444 !important;
  }
  
  &.text-primary {
    background: rgba(212, 115, 10, 0.15) !important;
    color: var(--warm-orange) !important;
  }
  
  &.text-orange {
    background: rgba(255, 152, 0, 0.15) !important;
    color: #FF9800 !important;
  }
  
  &.text-purple {
    background: rgba(147, 51, 234, 0.15) !important;
    color: #9333EA !important;
  }
}

/* Responsive Design */
@media (max-width: 960px) {
  .arrangements-header {
    padding: 32px 16px;
  }
  
  .arrangements-header-content {
    flex-direction: column;
    gap: 24px;
    text-align: center;
  }
  
  .header-main {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-icon {
    width: 64px;
    height: 64px;
  }
  
  .arrangements-title {
    font-size: 2rem;
  }
  
  .arrangements-subtitle {
    font-size: 1.1rem;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .main-content {
    padding: 0 16px;
  }
  
  .arrangement-content {
    flex-direction: column;
    gap: 24px;
  }
  
  .arrangement-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .arrangement-sidebar {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .price-section {
    min-width: 120px;
  }
  
  .manage-btn {
    max-width: 200px;
  }
}

@media (max-width: 600px) {
  .arrangements-title {
    font-size: 1.8rem;
  }
  
  .arrangement-title {
    font-size: 1.4rem;
  }
  
  .arrangement-sidebar {
    flex-direction: column;
    gap: 16px;
  }
  
  .manage-btn {
    max-width: none;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .create-btn {
    width: 100%;
    max-width: 280px;
  }
}
</style>
