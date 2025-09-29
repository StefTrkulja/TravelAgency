<template>
  <v-container class="analytics-container py-6">
    <!-- Header -->
    <div class="d-flex justify-space-between align-center mb-6">
      <h1 class="text-h4">Analytics</h1>
      <v-select
        v-model="selectedTimeRange"
        :items="timeRangeOptions"
        label="Time Range"
        variant="outlined"
        density="compact"
        class="time-range-selector"
        style="max-width: 200px;"
        @update:model-value="fetchAnalytics"
      />
    </div>

    <!-- Loading -->
    <v-skeleton-loader 
      v-if="loading" 
      type="card, card, card" 
      class="mb-6"
    />

    <template v-else>
      <!-- Top Row - Main Metrics -->
      <v-row class="mb-6">
        <!-- SLA Targets Achievement -->
        <v-col cols="12" md="4">
          <v-card class="metric-card">
            <v-card-title class="text-subtitle-1 pb-2">
              % of SLA targets achieved
            </v-card-title>
            <v-card-text class="pa-4">
              <div class="metric-value">{{ slaTargets.percentage }}%</div>
              <div class="metric-subtitle">
                {{ slaTargets.achieved }} / {{ slaTargets.total }} tickets
              </div>
              <!-- Simple progress bar -->
              <v-progress-linear
                :model-value="slaTargets.percentage"
                color="success"
                height="8"
                rounded
                class="mt-3"
              />
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Active Tickets Pie Chart -->
        <v-col cols="12" md="4">
          <v-card class="metric-card">
            <v-card-title class="text-subtitle-1 pb-2">
              Active Tickets
            </v-card-title>
            <v-card-text class="pa-4 d-flex align-center justify-center">
              <div class="pie-chart-container">
                <div 
                  class="pie-chart"
                  :style="{ 
                    '--unbreached-percentage': unbreachedPercentage * 3.6 + 'deg'
                  }"
                >
                  <div class="pie-center">
                    <div class="total-tickets">{{ activeTickets.unbreached + activeTickets.breached }}</div>
                    <div class="total-label">Total</div>
                    <div class="debug-info" style="font-size: 8px;">{{ unbreachedPercentage }}%</div>
                  </div>
                </div>
              </div>
              <div class="pie-legend ml-4">
                <div class="legend-item">
                  <div class="legend-color unbreached-color"></div>
                  <span>{{ activeTickets.unbreached }} Unbreached</span>
                </div>
                <div class="legend-item mt-2">
                  <div class="legend-color breached-color"></div>
                  <span>{{ activeTickets.breached }} Breached</span>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- SLA Targets Today (simplified) -->
        <v-col cols="12" md="4">
          <v-card class="metric-card">
            <v-card-title class="text-subtitle-1 pb-2">
              SLA targets achieved today
            </v-card-title>
            <v-card-text class="pa-4">
              <div class="d-flex align-center">
                <div class="metric-section flex-grow-1">
                  <div class="metric-number">{{ slaTargetsToday.breached }}</div>
                  <div class="metric-label">Breached</div>
                </div>
                <div class="metric-section flex-grow-1">
                  <div class="metric-number">{{ slaTargetsToday.unbreached }}</div>
                  <div class="metric-label">Unbreached</div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Bottom Row -->
      <v-row>
        <!-- Tickets Nearing SLA Breach -->
        <v-col cols="12" md="6">
          <v-card class="tickets-card">
            <v-card-title class="text-subtitle-1 pb-2">
              Tickets nearing SLA breach
            </v-card-title>
            <v-card-text class="pa-0">
              <div class="tickets-header">
                <div class="header-cell">Ticket ID</div>
                <div class="header-cell">Priority</div>
                <div class="header-cell">Assignee</div>
                <div class="header-cell">Risk Type</div>
              </div>
              <div class="tickets-body">
                <div 
                  v-for="ticket in ticketsNearingBreach.slice(0, 8)" 
                  :key="ticket.ticketId"
                  class="ticket-row"
                >
                  <div class="cell">{{ ticket.ticketId }}</div>
                  <div class="cell">
                    <v-chip 
                      :color="getPriorityColor(ticket.priority)"
                      size="small"
                      variant="flat"
                    >
                      {{ ticket.priority }}
                    </v-chip>
                  </div>
                  <div class="cell">{{ ticket.assignee }}</div>
                  <div class="cell">{{ ticket.riskType }}</div>
                </div>
                <div v-if="ticketsNearingBreach.length === 0" class="no-data">
                  No tickets nearing breach
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Customer Satisfaction -->
        <v-col cols="12" md="6">
          <v-card class="tickets-card">
            <v-card-title class="text-subtitle-1 pb-2">
              Customer Satisfaction
            </v-card-title>
            <v-card-text class="pa-0">
              <div class="tickets-header">
                <div class="header-cell">Ticket ID</div>
                <div class="header-cell">Rating</div>
                <div class="header-cell">Customer</div>
                <div class="header-cell">Date</div>
                <div class="header-cell">Feedback</div>
              </div>
              <div class="tickets-body">
                <div 
                  v-for="item in customerSatisfaction.slice(0, 8)" 
                  :key="item.ticketId"
                  class="ticket-row"
                >
                  <div class="cell">{{ item.ticketId }}</div>
                  <div class="cell">
                    <div class="rating-stars">
                      <v-icon
                        v-for="n in 5"
                        :key="n"
                        :color="n <= item.rating ? '#FFD700' : '#E0E0E0'"
                        size="small"
                      >
                        mdi-star
                      </v-icon>
                    </div>
                  </div>
                  <div class="cell">{{ item.customerName }}</div>
                  <div class="cell">{{ formatDate(item.createdAt) }}</div>
                  <div class="cell feedback-cell" :title="item.feedback">
                    {{ truncateFeedback(item.feedback) }}
                  </div>
                </div>
                <div v-if="customerSatisfaction.length === 0" class="no-data">
                  No satisfaction data available
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Go Back Button -->
    <div class="d-flex justify-end mt-6">
      <v-btn variant="tonal" @click="goBack">Go Back</v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axiosInstance from '@/utils/axiosInstance'

// Reactive data
const loading = ref(true)
const selectedTimeRange = ref('30d')

const slaTargets = ref({ percentage: 0, total: 0, achieved: 0 })
const activeTickets = ref({ unbreached: 0, breached: 0 })
const ticketsNearingBreach = ref([])
const customerSatisfaction = ref([])
const slaTargetsToday = ref({ breached: 0, unbreached: 0, total: 0 })

// Time range options
const timeRangeOptions = [
  { title: 'Last 7 days', value: '7d' },
  { title: 'Last 30 days', value: '30d' },
  { title: 'Last 90 days', value: '90d' }
]

// Computed values for pie chart
const totalActiveTickets = computed(() => 
  activeTickets.value.unbreached + activeTickets.value.breached
)

const unbreachedPercentage = computed(() => {
  if (totalActiveTickets.value === 0) return 0
  const percentage = Math.round((activeTickets.value.unbreached / totalActiveTickets.value) * 100)
  console.log('Pie Chart Debug:', {
    unbreached: activeTickets.value.unbreached,
    breached: activeTickets.value.breached,
    total: totalActiveTickets.value,
    percentage: percentage,
    degrees: percentage * 3.6
  })
  return percentage
})

const breachedPercentage = computed(() => {
  if (totalActiveTickets.value === 0) return 0
  return Math.round((activeTickets.value.breached / totalActiveTickets.value) * 100)
})

// Methods
async function fetchAnalytics() {
  loading.value = true
  try {
    const response = await axiosInstance.get('/analytics/dashboard', {
      params: { timeRange: selectedTimeRange.value }
    })

    const data = response.data
    slaTargets.value = data.slaTargets
    activeTickets.value = data.activeTickets
    ticketsNearingBreach.value = data.ticketsNearingBreach
    customerSatisfaction.value = data.customerSatisfaction
    slaTargetsToday.value = data.slaTargetsToday

  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    // Reset to empty state on error
    slaTargets.value = { percentage: 0, total: 0, achieved: 0 }
    activeTickets.value = { unbreached: 0, breached: 0 }
    ticketsNearingBreach.value = []
    customerSatisfaction.value = []
    slaTargetsToday.value = { breached: 0, unbreached: 0, total: 0 }
  } finally {
    loading.value = false
  }
}

function getPriorityColor(priority) {
  const colors = {
    LOW: 'green',
    MEDIUM: 'orange',
    HIGH: 'red',
    CRITICAL: 'red-darken-2'
  }
  return colors[priority] || 'grey'
}

function truncateFeedback(feedback) {
  if (!feedback) return ''
  return feedback.length > 30 ? feedback.substring(0, 27) + '...' : feedback
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function goBack() {
  window.history.back()
}

// Lifecycle
onMounted(() => {
  fetchAnalytics()
})
</script>

<style scoped>
.analytics-container {
  max-width: 1200px;
  margin: 0 auto;
}

.time-range-selector :deep(.v-field) {
  height: 40px;
}

.metric-card {
  height: 200px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.metric-value {
  font-size: 3rem;
  font-weight: 300;
  line-height: 1;
  color: rgb(var(--v-theme-primary));
}

.metric-subtitle {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.metric-section {
  text-align: center;
}

.metric-number {
  font-size: 2rem;
  font-weight: 500;
  line-height: 1;
}

.metric-label {
  font-size: 0.875rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
  margin-top: 4px;
}

/* Pie Chart Styles */
.pie-chart-container {
  display: flex;
  align-items: center;
  position: relative;
}

.pie-chart {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: conic-gradient(
    #4caf50 0deg var(--unbreached-percentage, 0deg),
    #f44336 var(--unbreached-percentage, 0deg) 360deg
  );
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pie-center {
  background: white;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: absolute;
}

.total-tickets {
  font-size: 1.5rem;
  font-weight: 600;
  line-height: 1;
}

.total-label {
  font-size: 0.75rem;
  color: rgba(var(--v-theme-on-surface), 0.6);
}

.pie-legend {
  margin-left: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
}

.unbreached-color {
  background-color: #4caf50;
}

.breached-color {
  background-color: #f44336;
}

/* Table Styles */
.tickets-card {
  height: 400px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.tickets-header {
  display: flex;
  background-color: rgba(var(--v-theme-surface-variant), 0.4);
  font-weight: 600;
  font-size: 0.875rem;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.tickets-body {
  max-height: 320px;
  overflow-y: auto;
}

.header-cell {
  flex: 1;
  padding: 12px;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.header-cell:nth-child(1) { flex: 0.8; } /* Ticket ID - smaller */
.header-cell:nth-child(2) { flex: 0.8; } /* Rating - smaller */
.header-cell:nth-child(3) { flex: 1.2; } /* Customer - bigger */
.header-cell:nth-child(4) { flex: 1; }   /* Date - normal */
.header-cell:nth-child(5) { flex: 1.5; } /* Feedback - biggest */

.header-cell:last-child {
  border-right: none;
}

.ticket-row {
  display: flex;
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  transition: background-color 0.2s;
}

.ticket-row:hover {
  background-color: rgba(var(--v-theme-surface-variant), 0.2);
}

.cell {
  flex: 1;
  padding: 10px 12px;
  border-right: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  font-size: 0.875rem;
  display: flex;
  align-items: center;
}

.cell:nth-child(1) { flex: 0.8; } /* Ticket ID - smaller */
.cell:nth-child(2) { flex: 0.8; } /* Rating - smaller */
.cell:nth-child(3) { flex: 1.2; } /* Customer - bigger */
.cell:nth-child(4) { flex: 1; }   /* Date - normal */
.cell:nth-child(5) { flex: 1.5; } /* Feedback - biggest */

.cell:last-child {
  border-right: none;
}

.feedback-cell {
  font-size: 0.8rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.rating-stars {
  display: flex;
  gap: 2px;
}

.no-data {
  text-align: center;
  color: rgba(var(--v-theme-on-surface), 0.6);
  padding: 20px;
  font-style: italic;
}
</style>