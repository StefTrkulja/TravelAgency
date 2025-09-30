<template>
  <v-container class="bookings-container" fluid>
    <!-- Header Section with Warm Gradient -->
    <div class="bookings-header">
      <div class="bookings-header-content">
        <div class="header-main">
          <div class="header-icon">
            <v-icon size="48" color="white">mdi-bookmark</v-icon>
          </div>
          <div>
            <h1 class="bookings-title font-heading">My Bookings</h1>
            <p class="bookings-subtitle">Your travel arrangement bookings</p>
          </div>
        </div>
        
        <div class="header-stats">
          <v-chip 
            color="white" 
            variant="flat" 
            prepend-icon="mdi-counter"
            class="stats-chip"
          >
            {{ bookings.length }} {{ bookings.length === 1 ? 'Booking' : 'Bookings' }}
          </v-chip>
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

      <v-alert v-if="!loading && bookings.length === 0" type="info" variant="tonal" class="modern-alert" prominent>
        <template v-slot:prepend>
          <v-icon>mdi-information</v-icon>
        </template>
        <strong>No bookings yet!</strong> You haven't made any bookings yet. Browse available arrangements to start your next adventure!
      </v-alert>

      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-content">
          <v-progress-circular size="64" indeterminate color="primary" />
          <p class="loading-text">Loading your bookings...</p>
        </div>
      </div>

      <!-- Bookings List -->
      <div v-else-if="bookings.length > 0" class="bookings-grid">
        <v-card 
          v-for="booking in bookings" 
          :key="booking.id"
          class="modern-card booking-card" 
          elevation="0"
          @click="goToActivities(booking)"
          hover
        >
          <v-card-text class="pa-8">
            <div class="booking-content">
              <div class="booking-main">
                <div class="booking-header">
                  <div class="booking-title-row">
                    <v-icon color="primary" size="28">mdi-map-marker</v-icon>
                    <h3 class="booking-title">
                      {{ booking.departure?.arrangement?.title || 'Travel Arrangement' }}
                    </h3>
                  </div>
                  
                  <div class="booking-status">
                    <v-chip 
                      :color="getStatusColor(booking.status)" 
                      variant="flat"
                      size="small"
                      class="status-chip"
                    >
                      {{ booking.status }}
                    </v-chip>
                  </div>
                </div>
                
                <div class="booking-details">
                  <div class="detail-item">
                    <v-icon size="18" color="grey-darken-1">mdi-map</v-icon>
                    <span>{{ booking.departure?.arrangement?.destination?.name || 'Destination' }}</span>
                  </div>
                  
                  <div class="detail-item">
                    <v-icon size="18" color="grey-darken-1">mdi-calendar</v-icon>
                    <span>Booked on {{ formatDate(booking.bookingDate) }}</span>
                  </div>
                  
                  <div class="detail-item">
                    <v-icon size="18" color="grey-darken-1">mdi-account-group</v-icon>
                    <span>{{ booking.travelersCount }} {{ booking.travelersCount === 1 ? 'traveler' : 'travelers' }}</span>
                  </div>
                </div>
              </div>
              
              <div class="booking-sidebar">
                <div class="price-section">
                  <div class="price-amount">${{ parseFloat(booking.grandTotal).toFixed(2) }}</div>
                  <div class="price-label">Total Cost</div>
                </div>
                
                <v-btn 
                  color="primary" 
                  variant="elevated"
                  prepend-icon="mdi-map-marker-star"
                  size="large"
                  class="view-btn"
                  @click.stop="goToActivities(booking)"
                >
                  View Activities
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
const bookings = ref([])
const loading = ref(true)
const error = ref('')
const snackbar = reactive({
  open: false,
  message: '',
  color: 'success'
})

// Methods
function formatDate(dateString) {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return 'Invalid Date'
  }
}

function getStatusColor(status) {
  const colors = {
    'CONFIRMED': 'success',
    'INITIATED': 'warning',
    'CANCELLED': 'error',
    'REFUNDED': 'info'
  }
  return colors[status] || 'grey'
}

function goToActivities(booking) {
  router.push(`/traveler/booking/${booking.id}/activities`)
}

async function fetchBookings() {
  try {
    loading.value = true
    error.value = ''
    
    const { data } = await axios.get(`/bookings/user/${store.username}`)
    bookings.value = data || []
    
  } catch (err) {
    console.error('Error fetching bookings:', err)
    error.value = 'Failed to load your bookings. Please try again later.'
    snackbar.message = 'Failed to load bookings'
    snackbar.color = 'error'
    snackbar.open = true
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchBookings()
})
</script>

<style scoped>
.bookings-container {
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
.bookings-header {
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

.bookings-header-content {
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

.bookings-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.bookings-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 8px 0 0 0;
  font-weight: 400;
}

.header-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-chip {
  background: rgba(255, 255, 255, 0.15) !important;
  color: white !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  font-weight: 600 !important;
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

/* Bookings Grid */
.bookings-grid {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.booking-card {
  margin-bottom: 0 !important;
}

.booking-content {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.booking-main {
  flex: 1;
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.booking-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.booking-title {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--warm-orange);
  margin: 0;
  letter-spacing: 0.3px;
}

.booking-status {
  margin-left: 16px;
}

.status-chip {
  font-weight: 600 !important;
  letter-spacing: 0.3px !important;
}

.booking-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  color: rgba(28, 25, 23, 0.8);
}

.booking-sidebar {
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

.view-btn {
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
  
  &.text-grey {
    background: rgba(107, 114, 128, 0.15) !important;
    color: #6B7280 !important;
  }
}

/* Responsive Design */
@media (max-width: 960px) {
  .bookings-header {
    padding: 32px 16px;
  }
  
  .bookings-header-content {
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
  
  .bookings-title {
    font-size: 2rem;
  }
  
  .bookings-subtitle {
    font-size: 1.1rem;
  }
  
  .main-content {
    padding: 0 16px;
  }
  
  .booking-content {
    flex-direction: column;
    gap: 24px;
  }
  
  .booking-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .booking-sidebar {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  
  .price-section {
    min-width: 120px;
  }
  
  .view-btn {
    max-width: 200px;
  }
}

@media (max-width: 600px) {
  .bookings-title {
    font-size: 1.8rem;
  }
  
  .booking-title {
    font-size: 1.4rem;
  }
  
  .booking-sidebar {
    flex-direction: column;
    gap: 16px;
  }
  
  .view-btn {
    max-width: none;
  }
  
  .header-stats {
    justify-content: center;
  }
}
</style>
