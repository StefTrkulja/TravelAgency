<template>
  <v-container class="analytics-container py-6">
    <!-- Header -->
    <div class="analytics-header animate-fade-in">
      <div class="header-content">
        <v-icon size="32" color="var(--warm-orange)" class="mr-3">mdi-chart-line</v-icon>
        <div>
          <h1 class="page-title font-heading">Analytics Dashboard</h1>
          <p class="page-subtitle">Monitor performance and SLA compliance</p>
        </div>
      </div>
      <div class="header-actions">
        <v-btn
          variant="elevated"
          color="var(--warm-orange)"
          class="pdf-btn mr-3"
          @click="generatePDF"
          prepend-icon="mdi-file-pdf-box"
          :loading="generatingPDF"
        >
          Export Dashboard PDF
        </v-btn>
        <v-btn
          variant="elevated"
          color="primary"
          class="pdf-btn mr-3"
          @click="generateOperatorReportPDF"
          prepend-icon="mdi-account-group"
          :loading="generatingOperatorPDF"
        >
          Operator Performance Report
        </v-btn>
        <v-select
          v-model="selectedTimeRange"
          :items="timeRangeOptions"
          label="Time Range"
          variant="outlined"
          density="comfortable"
          class="time-range-selector"
          @update:model-value="fetchAnalytics"
          prepend-inner-icon="mdi-calendar-range"
        />
      </div>
    </div>

    <!-- Navigation Cards -->
    <div class="navigation-cards-section mb-6">
      <v-row>
        <!-- Escalations Card -->
        <v-col cols="12" md="4">
          <v-card 
            class="navigation-card escalations-card cursor-pointer" 
            @click="goEscalations()"
            elevation="2"
          >
            <v-card-text class="navigation-card-content">
              <div class="nav-icon-container">
                <v-icon size="32" color="var(--warm-orange)">mdi-alert-octagon</v-icon>
              </div>
              <div class="nav-text-content">
                <h3 class="nav-title">Escalations</h3>
                <p class="nav-subtitle">Handle escalated cases</p>
              </div>
              <v-icon color="var(--warm-orange-light)" class="nav-arrow">mdi-chevron-right</v-icon>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Compensations Card -->
        <v-col cols="12" md="4">
          <v-card 
            class="navigation-card compensations-card cursor-pointer" 
            @click="goCompensations()"
            elevation="2"
          >
            <v-card-text class="navigation-card-content">
              <div class="nav-icon-container">
                <v-icon size="32" color="var(--warm-orange)">mdi-cash-multiple</v-icon>
              </div>
              <div class="nav-text-content">
                <h3 class="nav-title">Compensations</h3>
                <p class="nav-subtitle">Manage customer compensations</p>
              </div>
              <v-icon color="var(--warm-orange-light)" class="nav-arrow">mdi-chevron-right</v-icon>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Manager Tickets Card -->
        <v-col cols="12" md="4">
          <v-card 
            class="navigation-card tickets-card cursor-pointer" 
            @click="goManagerTickets()"
            elevation="2"
          >
            <v-card-text class="navigation-card-content">
              <div class="nav-icon-container">
                <v-icon size="32" color="var(--warm-orange)">mdi-ticket-account</v-icon>
              </div>
              <div class="nav-text-content">
                <h3 class="nav-title">Manager Tickets</h3>
                <p class="nav-subtitle">View all tickets overview</p>
              </div>
              <v-icon color="var(--warm-orange-light)" class="nav-arrow">mdi-chevron-right</v-icon>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
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
          <v-card class="metric-card sla-card" elevation="0">
            <v-card-title class="card-title">
              <v-icon class="mr-2" color="var(--warm-orange)">mdi-target</v-icon>
              SLA Achievement Rate
            </v-card-title>
            <v-card-text class="metric-content">
              <div class="metric-value sla-percentage">{{ slaTargets.percentage }}%</div>
              <div class="metric-subtitle">
                {{ slaTargets.achieved }} of {{ slaTargets.total }} tickets met SLA
              </div>
              <v-progress-linear
                :model-value="slaTargets.percentage"
                color="success"
                bg-color="rgba(212, 115, 10, 0.1)"
                height="12"
                rounded
                class="mt-4 progress-bar"
              />
              <div class="progress-labels mt-2">
                <span class="achieved">{{ slaTargets.achieved }}</span>
                <span class="total">{{ slaTargets.total }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Active Tickets Pie Chart -->
        <v-col cols="12" md="4">
          <v-card class="metric-card tickets-card" elevation="0">
            <v-card-title class="card-title">
              <v-icon class="mr-2" color="var(--warm-orange)">mdi-ticket-percent</v-icon>
              Active Tickets Status
            </v-card-title>
            <v-card-text class="metric-content">
              <div class="pie-chart-wrapper">
                <div class="pie-chart-container">
                  <div 
                    class="pie-chart"
                    :style="{ 
                      '--unbreached-percentage': unbreachedPercentage * 3.6 + 'deg'
                    }"
                  >
                    <div class="pie-center">
                      <div class="total-tickets">{{ activeTickets.unbreached + activeTickets.breached }}</div>
                      <div class="total-label">Total Active</div>
                    </div>
                  </div>
                </div>
                <div class="pie-legend">
                  <div class="legend-item">
                    <div class="legend-color unbreached-color"></div>
                    <div class="legend-text">
                      <span class="legend-count">{{ activeTickets.unbreached }}</span>
                      <span class="legend-label">On Track</span>
                    </div>
                  </div>
                  <div class="legend-item">
                    <div class="legend-color breached-color"></div>
                    <div class="legend-text">
                      <span class="legend-count">{{ activeTickets.breached }}</span>
                      <span class="legend-label">SLA Breached</span>
                    </div>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- SLA Targets Today (simplified) -->
        <v-col cols="12" md="4">
          <v-card class="metric-card targets-card" elevation="0">
            <v-card-title class="card-title">
              <v-icon class="mr-2" color="var(--warm-orange)">mdi-clock-alert</v-icon>
              Today's SLA Status
            </v-card-title>
            <v-card-text class="metric-content">
              <div class="targets-grid">
                <div class="metric-section breached-section">
                  <div class="metric-number text-error">{{ slaTargetsToday.breached }}</div>
                  <div class="metric-label">Breached</div>
                  <v-icon size="20" color="error" class="metric-icon">mdi-alert-circle</v-icon>
                </div>
                <div class="metric-divider"></div>
                <div class="metric-section unbreached-section">
                  <div class="metric-number text-success">{{ slaTargetsToday.unbreached }}</div>
                  <div class="metric-label">On Track</div>
                  <v-icon size="20" color="success" class="metric-icon">mdi-check-circle</v-icon>
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
          <v-card class="data-table-card" elevation="0">
            <v-card-title class="card-title">
              <v-icon class="mr-2" color="var(--warm-orange)">mdi-alert-outline</v-icon>
              Tickets Nearing SLA Breach
            </v-card-title>
            <v-card-text class="pa-0">
              <div class="data-table">
                <div class="table-header">
                  <div class="header-cell">Ticket ID</div>
                  <div class="header-cell">Priority</div>
                  <div class="header-cell">Assignee</div>
                  <div class="header-cell">Risk Type</div>
                </div>
                <div class="table-body">
                  <div 
                    v-for="ticket in ticketsNearingBreach.slice(0, 8)" 
                    :key="ticket.ticketId"
                    class="table-row"
                  >
                    <div class="table-cell">
                      <v-chip size="x-small" variant="text" class="ticket-id-chip">
                        #{{ ticket.ticketId }}
                      </v-chip>
                    </div>
                    <div class="table-cell">
                      <v-chip 
                        :color="getPriorityColor(ticket.priority)"
                        size="small"
                        variant="flat"
                        class="priority-chip"
                      >
                        <v-icon size="14" class="mr-1">{{ getPriorityIcon(ticket.priority) }}</v-icon>
                        {{ ticket.priority }}
                      </v-chip>
                    </div>
                    <div class="table-cell assignee-cell">
                      <v-avatar size="24" class="mr-2">
                        <v-icon size="14">mdi-account</v-icon>
                      </v-avatar>
                      {{ ticket.assignee }}
                    </div>
                    <div class="table-cell">
                      <v-chip 
                        size="small" 
                        variant="outlined"
                        :color="getRiskTypeColor(ticket.riskType)"
                        class="risk-chip"
                      >
                        {{ ticket.riskType }}
                      </v-chip>
                    </div>
                  </div>
                  <div v-if="ticketsNearingBreach.length === 0" class="no-data">
                    <v-icon size="48" color="grey lighten-2">mdi-shield-check</v-icon>
                    <p class="mt-2">No tickets nearing breach</p>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Customer Satisfaction -->
        <v-col cols="12" md="6">
          <v-card class="data-table-card" elevation="0">
            <v-card-title class="card-title">
              <v-icon class="mr-2" color="var(--warm-orange)">mdi-star-outline</v-icon>
              Customer Satisfaction
            </v-card-title>
            <v-card-text class="pa-0">
              <div class="data-table">
                <div class="table-header">
                  <div class="header-cell">Ticket ID</div>
                  <div class="header-cell">Rating</div>
                  <div class="header-cell">Customer</div>
                  <div class="header-cell">Date</div>
                  <div class="header-cell">Feedback</div>
                </div>
                <div class="table-body">
                  <div 
                    v-for="item in customerSatisfaction.slice(0, 8)" 
                    :key="item.ticketId"
                    class="table-row"
                  >
                    <div class="table-cell">
                      <v-chip size="x-small" variant="text" class="ticket-id-chip">
                        #{{ item.ticketId }}
                      </v-chip>
                    </div>
                    <div class="table-cell">
                      <div class="rating-display">
                        <v-rating
                          :model-value="item.rating"
                          readonly
                          size="small"
                          color="amber"
                          half-increments
                          density="compact"
                        />
                        <span class="rating-number">({{ item.rating }})</span>
                      </div>
                    </div>
                    <div class="table-cell customer-cell">
                      <v-avatar size="24" class="mr-2">
                        <v-icon size="14">mdi-account</v-icon>
                      </v-avatar>
                      {{ item.customerName }}
                    </div>
                    <div class="table-cell date-cell">{{ formatDate(item.createdAt) }}</div>
                    <div class="table-cell feedback-cell">
                      <span class="feedback-text" :title="item.feedback">
                        {{ truncateFeedback(item.feedback) }}
                      </span>
                    </div>
                  </div>
                  <div v-if="customerSatisfaction.length === 0" class="no-data">
                    <v-icon size="48" color="grey lighten-2">mdi-comment-remove-outline</v-icon>
                    <p class="mt-2">No satisfaction data</p>
                  </div>
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- Go Back Button -->
    <div class="d-flex justify-end mt-6">
      <v-btn 
        variant="outlined" 
        class="go-back-btn"
        @click="goBack"
        prepend-icon="mdi-arrow-left"
      >
        Go Back
      </v-btn>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axiosInstance from '@/utils/axiosInstance'
import jsPDF from 'jspdf'
import { store } from '@/utils/store'

// Router
const router = useRouter()

// Reactive data
const loading = ref(true)
const generatingPDF = ref(false)
const generatingOperatorPDF = ref(false)
const selectedTimeRange = ref('30d')

const slaTargets = ref({ percentage: 0, total: 0, achieved: 0 })
const activeTickets = ref({ unbreached: 0, breached: 0 })
const ticketsNearingBreach = ref([])
const customerSatisfaction = ref([])
const slaTargetsToday = ref({ breached: 0, unbreached: 0, total: 0 })
const ticketsPerDay = ref([])

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

// Navigation methods
function goEscalations() {
  router.push({ name: 'EscalationsView' })
}
function goCompensations() {
  router.push({ name: 'CompensationsView' })
}
function goManagerTickets() {
  router.push({ name: 'ManagerTicketsView' })
}

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
    ticketsPerDay.value = data.ticketsPerDay || []

  } catch (error) {
    console.error('Failed to fetch analytics:', error)
    // Reset to empty state on error
    slaTargets.value = { percentage: 0, total: 0, achieved: 0 }
    activeTickets.value = { unbreached: 0, breached: 0 }
    ticketsNearingBreach.value = []
    customerSatisfaction.value = []
    slaTargetsToday.value = { breached: 0, unbreached: 0, total: 0 }
    ticketsPerDay.value = []
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

function getPriorityIcon(priority) {
  if (!priority) return 'mdi-flag-outline';
  const p = String(priority).toLowerCase();
  switch(p) {
    case 'critical': return 'mdi-fire';
    case 'high': return 'mdi-flag';
    case 'medium': return 'mdi-flag-outline';
    case 'low': return 'mdi-flag-variant-outline';
    default: return 'mdi-flag-outline';
  }
}

function getRiskTypeColor(riskType) {
  const colors = {
    'High Risk': 'error',
    'Medium Risk': 'warning',
    'Low Risk': 'success'
  }
  return colors[riskType] || 'default'
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

async function generatePDF() {
  generatingPDF.value = true
  try {
    const doc = new jsPDF()
    
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    let yPosition = 15
    
    // Helper functions
    function addWarmBackground() {
      doc.setFillColor(254, 243, 226) // warm cream
      doc.rect(0, 0, pageWidth, pageHeight, 'F')
    }
    
    function drawRoundedRect(x, y, width, height, radius, fillColor) {
      if (fillColor) {
        const [r, g, b] = fillColor
        doc.setFillColor(r, g, b)
        doc.roundedRect(x, y, width, height, radius, radius, 'F')
      } else {
        doc.roundedRect(x, y, width, height, radius, radius, 'S')
      }
    }
    
    function drawBarChart(x, y, width, height, value, maxValue, color) {
      doc.setFillColor(229, 231, 235)
      doc.rect(x, y, width, height, 'F')
      const barWidth = (value / maxValue) * width
      const [r, g, b] = color
      doc.setFillColor(r, g, b)
      doc.rect(x, y, barWidth, height, 'F')
    }
    
    function drawLineChart(x, y, width, height, data) {
      if (!data || data.length === 0) return
      
      // Background
      doc.setFillColor(249, 250, 251)
      doc.rect(x, y, width, height, 'F')
      
      // Border
      doc.setDrawColor(229, 231, 235)
      doc.setLineWidth(0.5)
      doc.rect(x, y, width, height, 'S')
      
      const maxCount = Math.max(...data.map(d => d.count), 1)
      const stepX = width / (data.length - 1)
      
      // Draw line
      doc.setDrawColor(212, 115, 10)
      doc.setLineWidth(1)
      
      for (let i = 0; i < data.length - 1; i++) {
        const x1 = x + (i * stepX)
        const y1 = y + height - ((data[i].count / maxCount) * height)
        const x2 = x + ((i + 1) * stepX)
        const y2 = y + height - ((data[i + 1].count / maxCount) * height)
        doc.line(x1, y1, x2, y2)
      }
      
      // Draw points
      doc.setFillColor(212, 115, 10)
      for (let i = 0; i < data.length; i++) {
        const px = x + (i * stepX)
        const py = y + height - ((data[i].count / maxCount) * height)
        doc.circle(px, py, 0.8, 'F')
      }
    }
    
    // Add background
    addWarmBackground()
    
    // Compact Header
    doc.setFillColor(212, 115, 10)
    doc.rect(0, 0, pageWidth, 25, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('TravelAgency Analytics Report', 15, 16)
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    })
    doc.setFontSize(9)
    doc.text(`${currentDate} | Period: ${selectedTimeRange.value}`, pageWidth - 55, 16)
    
    yPosition = 35
    doc.setTextColor(31, 41, 55)
    
    // Row 1: Key Metrics (3 columns)
    const col1X = 15, col2X = 70, col3X = 125
    const cardWidth = 50, cardHeight = 30
    
    // SLA Achievement
    drawRoundedRect(col1X, yPosition, cardWidth, cardHeight, 3, [255, 255, 255])
    doc.setDrawColor(212, 115, 10)
    doc.roundedRect(col1X, yPosition, cardWidth, cardHeight, 3, 3, 'S')
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(212, 115, 10)
    doc.text('SLA Achievement', col1X + 3, yPosition + 6)
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text(`${slaTargets.value.percentage}%`, col1X + 3, yPosition + 16)
    
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text(`${slaTargets.value.achieved}/${slaTargets.value.total}`, col1X + 3, yPosition + 22)
    
    drawBarChart(col1X + 3, yPosition + 24, cardWidth - 6, 3, slaTargets.value.percentage, 100, [22, 163, 74])
    
    // Active Tickets
    drawRoundedRect(col2X, yPosition, cardWidth, cardHeight, 3, [255, 255, 255])
    doc.setDrawColor(212, 115, 10)
    doc.roundedRect(col2X, yPosition, cardWidth, cardHeight, 3, 3, 'S')
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(212, 115, 10)
    doc.text('Active Tickets', col2X + 3, yPosition + 6)
    
    const totalActive = activeTickets.value.unbreached + activeTickets.value.breached
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text(`${totalActive}`, col2X + 3, yPosition + 16)
    
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(22, 163, 74)
    doc.text(`OK: ${activeTickets.value.unbreached}`, col2X + 3, yPosition + 22)
    doc.setTextColor(220, 38, 38)
    doc.text(`Breach: ${activeTickets.value.breached}`, col2X + 20, yPosition + 22)
    
    // Today's Status
    drawRoundedRect(col3X, yPosition, cardWidth, cardHeight, 3, [255, 255, 255])
    doc.setDrawColor(212, 115, 10)
    doc.roundedRect(col3X, yPosition, cardWidth, cardHeight, 3, 3, 'S')
    
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(212, 115, 10)
    doc.text('Today\'s SLA', col3X + 3, yPosition + 6)
    
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(31, 41, 55)
    doc.text(`${slaTargetsToday.value.total}`, col3X + 3, yPosition + 16)
    
    doc.setFontSize(6)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(22, 163, 74)
    doc.text(`OK: ${slaTargetsToday.value.unbreached}`, col3X + 3, yPosition + 22)
    doc.setTextColor(220, 38, 38)
    doc.text(`Breach: ${slaTargetsToday.value.breached}`, col3X + 20, yPosition + 22)
    
    yPosition += 40
    
    // Row 2: Charts (2 columns)
    const chartWidth = 80, chartHeight = 35
    
    // Tickets Per Day Chart
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(212, 115, 10)
    doc.text(`Tickets per Day (${selectedTimeRange.value})`, 15, yPosition)
    
    if (ticketsPerDay.value && ticketsPerDay.value.length > 0) {
      drawLineChart(15, yPosition + 5, chartWidth, chartHeight, ticketsPerDay.value)
      
      // Chart labels
      doc.setFontSize(6)
      doc.setTextColor(107, 114, 128)
      const maxCount = Math.max(...ticketsPerDay.value.map(d => d.count), 1)
      doc.text(`Max: ${maxCount}`, 15, yPosition + chartHeight + 15)
      doc.text(`Avg: ${Math.round(ticketsPerDay.value.reduce((a, b) => a + b.count, 0) / ticketsPerDay.value.length)}`, 40, yPosition + chartHeight + 15)
    }
    
    // Customer Satisfaction Chart
    doc.text('Customer Satisfaction', 105, yPosition)
    
    if (customerSatisfaction.value && customerSatisfaction.value.length > 0) {
      const ratings = customerSatisfaction.value.map(item => item.rating).filter(r => r > 0)
      const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0
      
      // Rating distribution
      const ratingCounts = [0, 0, 0, 0, 0]
      ratings.forEach(rating => {
        const index = Math.floor(rating) - 1
        if (index >= 0 && index < 5) ratingCounts[index]++
      })
      
      const maxRating = Math.max(...ratingCounts, 1)
      
      // Draw mini bars
      for (let i = 0; i < 5; i++) {
        const barX = 105 + (i * 12)
        const barHeight = (ratingCounts[i] / maxRating) * 20
        const barY = yPosition + 25 - barHeight
        
        doc.setFillColor(245, 158, 11)
        doc.rect(barX, barY, 8, barHeight, 'F')
        
        doc.setFontSize(6)
        doc.setTextColor(31, 41, 55)
        doc.text(`${i + 1}`, barX + 2, yPosition + 30)
        doc.text(`${ratingCounts[i]}`, barX + 2, yPosition + 35)
      }
      
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(212, 115, 10)
      doc.text(`Avg: ${avgRating}/5`, 105, yPosition + 45)
    }
    
    yPosition += 55
    
    // Row 3: Tables (2 columns, compact)
    const tableWidth = 85, tableHeight = 60
    
    // Tickets Nearing Breach (Left)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(212, 115, 10)
    doc.text('Tickets Nearing SLA Breach', 15, yPosition)
    
    if (ticketsNearingBreach.value && ticketsNearingBreach.value.length > 0) {
      // Compact table header
      doc.setFontSize(6)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(75, 85, 99)
      doc.text('ID', 15, yPosition + 8)
      doc.text('Priority', 30, yPosition + 8)
      doc.text('Assignee', 50, yPosition + 8)
      doc.text('Risk', 75, yPosition + 8)
      
      // Table rows (max 8)
      const maxRows = Math.min(ticketsNearingBreach.value.length, 8)
      for (let i = 0; i < maxRows; i++) {
        const ticket = ticketsNearingBreach.value[i]
        const rowY = yPosition + 12 + (i * 6)
        
        doc.setFontSize(5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(31, 41, 55)
        
        doc.text(`#${ticket.ticketId}`, 15, rowY)
        doc.text(ticket.priority || 'N/A', 30, rowY)
        doc.text((ticket.assignee || 'Unassigned').substring(0, 8), 50, rowY)
        
        const riskColor = ticket.riskType === 'High Risk' ? [220, 38, 38] :
                         ticket.riskType === 'Medium Risk' ? [245, 158, 11] : [22, 163, 74]
        doc.setTextColor(...riskColor)
        doc.text((ticket.riskType || 'Unknown').substring(0, 6), 75, rowY)
        doc.setTextColor(31, 41, 55)
      }
    } else {
      doc.setFontSize(7)
      doc.setTextColor(107, 114, 128)
      doc.text('No tickets nearing breach', 15, yPosition + 15)
    }
    
    // Customer Feedback (Right)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(212, 115, 10)
    doc.text('Recent Customer Feedback', 105, yPosition)
    
    if (customerSatisfaction.value && customerSatisfaction.value.length > 0) {
      const maxFeedback = Math.min(customerSatisfaction.value.length, 6)
      for (let i = 0; i < maxFeedback; i++) {
        const item = customerSatisfaction.value[i]
        const rowY = yPosition + 10 + (i * 8)
        
        doc.setFontSize(6)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(31, 41, 55)
        
        const feedback = item.feedback || 'No feedback'
        const shortFeedback = feedback.length > 30 ? feedback.substring(0, 27) + '...' : feedback
        
        doc.text(`#${item.ticketId} (${item.rating})`, 105, rowY)
        doc.setTextColor(107, 114, 128)
        doc.text(shortFeedback, 105, rowY + 4)
        doc.setTextColor(31, 41, 55)
      }
    } else {
      doc.setFontSize(7)
      doc.setTextColor(107, 114, 128)
      doc.text('No feedback available', 105, yPosition + 15)
    }
    
    // Signature Section (Bottom)
    const signatureY = pageHeight - 35
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(212, 115, 10)
    doc.text('Report Authorization', 15, signatureY)
    
    // Signature line
    doc.setDrawColor(107, 114, 128)
    doc.setLineWidth(0.3)
    doc.line(15, signatureY + 15, 80, signatureY + 15)
    
    // Manager signature
    doc.setFontSize(14)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(31, 41, 55)
    const managerName = store.name && store.surname ? `${store.name} ${store.surname}` : store.username || 'Manager'
    doc.text(managerName, 20, signatureY + 12)
    
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('Manager Signature', 20, signatureY + 20)
    doc.text(`Date: ${currentDate}`, 20, signatureY + 26)
    
    // Footer
    doc.setFontSize(6)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(107, 114, 128)
    doc.text('TravelAgency Analytics Report - Confidential', 15, pageHeight - 5)
    doc.text('Page 1 of 1', pageWidth - 20, pageHeight - 5)
    
    // Save PDF
    const filename = `TravelAgency_Analytics_${selectedTimeRange.value}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
    
  } catch (error) {
    console.error('Error generating PDF:', error)
  } finally {
    generatingPDF.value = false
  }
}

async function generateOperatorReportPDF() {
  generatingOperatorPDF.value = true
  try {
    // Calculate date range based on selectedTimeRange
    const endDate = new Date()
    let startDate = new Date()
    
    switch (selectedTimeRange.value) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      default:
        startDate.setDate(startDate.getDate() - 30)
    }

    // Fetch operator performance data from backend
    const response = await axiosInstance.get('/analytics/operator-performance-report', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      }
    })

    const operators = response.data

    // Generate PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    
    // Warm background
    doc.setFillColor(254, 243, 226)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')
    
    // Header
    doc.setFillColor(212, 115, 10)
    doc.rect(0, 0, pageWidth, 30, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text('Operator Performance Report', 15, 18)
    
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    })
    doc.setFontSize(9)
    doc.text(`Generated: ${currentDate}`, pageWidth - 55, 12)
    doc.text(`Period: ${selectedTimeRange.value}`, pageWidth - 55, 18)
    doc.text(`Operators: ${operators.length}`, pageWidth - 55, 24)
    
    let yPosition = 40
    doc.setTextColor(31, 41, 55)
    
    // Summary Section
    if (operators.length > 0) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(212, 115, 10)
      doc.text('Performance Summary', 15, yPosition)
      
      const totalTickets = operators.reduce((sum, op) => sum + parseInt(op.total_complaints || 0), 0)
      const totalClosed = operators.reduce((sum, op) => sum + parseInt(op.closed_complaints || 0), 0)
      const totalBreaches = operators.reduce((sum, op) => sum + parseInt(op.sla_breach_count || 0), 0)
      const avgSatisfaction = (operators.reduce((sum, op) => sum + parseFloat(op.avg_satisfaction || 0), 0) / operators.length).toFixed(2)
      
      yPosition += 10
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(31, 41, 55)
      doc.text(`Total Tickets: ${totalTickets}`, 15, yPosition)
      doc.text(`Total Closed: ${totalClosed}`, 70, yPosition)
      doc.text(`Total Breaches: ${totalBreaches}`, 125, yPosition)
      
      yPosition += 7
      doc.text(`Average Satisfaction: ${avgSatisfaction}/5.00`, 15, yPosition)
      doc.text(`Close Rate: ${((totalClosed/totalTickets)*100).toFixed(1)}%`, 70, yPosition)
      
      yPosition += 15
    }
    
    // Table Header
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(212, 115, 10)
    doc.text('Detailed Operator Statistics', 15, yPosition)
    
    yPosition += 8
    
    // Table column headers
    doc.setFillColor(212, 115, 10)
    doc.rect(15, yPosition, pageWidth - 30, 8, 'F')
    
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('Operator', 17, yPosition + 5)
    doc.text('Total', 80, yPosition + 5)
    doc.text('Closed', 100, yPosition + 5)
    doc.text('Avg Resolution', 120, yPosition + 5)
    doc.text('Breaches', 150, yPosition + 5)
    doc.text('Satisfaction', 170, yPosition + 5)
    doc.text('Score', 190, yPosition + 5)
    
    yPosition += 10
    
    // Table rows
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    
    operators.forEach((operator, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 30) {
        doc.addPage()
        doc.setFillColor(254, 243, 226)
        doc.rect(0, 0, pageWidth, pageHeight, 'F')
        yPosition = 20
        
        // Repeat header on new page
        doc.setFillColor(212, 115, 10)
        doc.rect(15, yPosition, pageWidth - 30, 8, 'F')
        doc.setFontSize(8)
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.text('Operator', 17, yPosition + 5)
        doc.text('Total', 80, yPosition + 5)
        doc.text('Closed', 100, yPosition + 5)
        doc.text('Avg Resolution', 120, yPosition + 5)
        doc.text('Breaches', 150, yPosition + 5)
        doc.text('Satisfaction', 170, yPosition + 5)
        doc.text('Score', 190, yPosition + 5)
        yPosition += 10
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
      }
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(255, 255, 255)
        doc.rect(15, yPosition - 4, pageWidth - 30, 7, 'F')
      } else {
        doc.setFillColor(249, 250, 251)
        doc.rect(15, yPosition - 4, pageWidth - 30, 7, 'F')
      }
      
      doc.setTextColor(31, 41, 55)
      
      // Operator name (truncate if too long)
      const operatorName = operator.operator_full_name || operator.operator_username
      const truncatedName = operatorName.length > 20 ? operatorName.substring(0, 18) + '...' : operatorName
      doc.text(truncatedName, 17, yPosition)
      
      // Statistics
      doc.text(String(operator.total_complaints || 0), 85, yPosition)
      doc.text(String(operator.closed_complaints || 0), 105, yPosition)
      doc.text(`${parseFloat(operator.avg_resolution_hours || 0).toFixed(1)}h`, 128, yPosition)
      
      // Breaches (color coded)
      const breaches = parseInt(operator.sla_breach_count || 0)
      if (breaches > 0) {
        doc.setTextColor(220, 38, 38) // red
      } else {
        doc.setTextColor(22, 163, 74) // green
      }
      doc.text(String(breaches), 158, yPosition)
      doc.setTextColor(31, 41, 55)
      
      // Satisfaction rating
      const satisfaction = parseFloat(operator.avg_satisfaction || 0).toFixed(2)
      doc.text(satisfaction, 178, yPosition)
      
      // Performance score (color coded)
      const score = parseFloat(operator.performance_score || 0).toFixed(2)
      if (score >= 80) {
        doc.setTextColor(22, 163, 74) // green
      } else if (score >= 60) {
        doc.setTextColor(245, 158, 11) // orange
      } else {
        doc.setTextColor(220, 38, 38) // red
      }
      doc.setFont('helvetica', 'bold')
      doc.text(score, 193, yPosition)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(31, 41, 55)
      
      yPosition += 7
    })
    
    // Legend section
    yPosition += 10
    if (yPosition > pageHeight - 40) {
      doc.addPage()
      doc.setFillColor(254, 243, 226)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')
      yPosition = 20
    }
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(212, 115, 10)
    doc.text('Performance Score Formula:', 15, yPosition)
    
    yPosition += 6
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(31, 41, 55)
    doc.text('Score = (Close Rate * 40) + (Avg Satisfaction * 20) - (Breaches * 5)', 15, yPosition)
    
    yPosition += 5
    doc.text('Excellent: >= 80 | Good: >= 60 | Needs Improvement: < 60', 15, yPosition)
    
    // Signature section
    const signatureY = pageHeight - 35
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(212, 115, 10)
    doc.text('Report Authorization', 15, signatureY)
    
    doc.setDrawColor(107, 114, 128)
    doc.setLineWidth(0.3)
    doc.line(15, signatureY + 15, 80, signatureY + 15)
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(31, 41, 55)
    const managerName = store.name && store.surname ? `${store.name} ${store.surname}` : store.username || 'Manager'
    doc.text(managerName, 20, signatureY + 12)
    
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('Manager Signature', 20, signatureY + 20)
    doc.text(`Date: ${currentDate}`, 20, signatureY + 26)
    
    // Footer
    doc.setFontSize(6)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(107, 114, 128)
    doc.text('TravelAgency Operator Performance Report - Confidential', 15, pageHeight - 5)
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber} of ${doc.internal.getNumberOfPages()}`, pageWidth - 25, pageHeight - 5)
    
    // Save PDF
    const filename = `Operator_Performance_Report_${selectedTimeRange.value}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
    
  } catch (error) {
    console.error('Error generating operator performance PDF:', error)
    alert('Failed to generate operator performance report. Please try again.')
  } finally {
    generatingOperatorPDF.value = false
  }
}

function goBack() {
  window.history.back()
}

// Lifecycle
onMounted(() => {
  fetchAnalytics()
})
</script>

<style scoped lang="scss">
.analytics-container {
  min-height: 100vh;
  background: linear-gradient(135deg, 
    rgba(244, 244, 245, 0.95) 0%, 
    rgba(255, 251, 235, 0.95) 100%);
}

.analytics-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  animation: slideInDown 0.7s ease-out;

  .header-content {
    display: flex;
    align-items: center;

    .page-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--warm-brown);
      margin: 0;
      background: linear-gradient(135deg, #8B4513, #D2691E);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .page-subtitle {
      color: var(--warm-text);
      margin: 0;
      font-size: 1rem;
      opacity: 0.8;
    }
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .pdf-btn {
      font-weight: 600;
      text-transform: none;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(212, 115, 10, 0.2);
      
      &:hover {
        box-shadow: 0 4px 12px rgba(212, 115, 10, 0.3);
        transform: translateY(-1px);
      }
    }
  }

  .time-range-selector {
    min-width: 220px;

    :deep(.v-field) {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 12px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 4px 12px rgba(212, 115, 10, 0.15);
      }
    }

    :deep(.v-field--focused) {
      box-shadow: 0 0 0 2px rgba(212, 115, 10, 0.2);
    }
  }
}

.metric-card,
.data-table-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(212, 115, 10, 0.1);
  transition: all 0.3s ease;
  animation: slideInUp 0.6s ease-out;

  &:hover {
    box-shadow: 0 8px 25px rgba(212, 115, 10, 0.15);
  }

  .card-title {
    background: linear-gradient(135deg, 
      rgba(212, 115, 10, 0.1) 0%, 
      rgba(245, 158, 11, 0.05) 100%);
    color: var(--warm-brown);
    font-weight: 600;
    font-size: 1.1rem;
    border-radius: 16px 16px 0 0;
    border-bottom: 1px solid rgba(212, 115, 10, 0.1);

    .v-icon {
      color: var(--warm-orange);
    }
  }

  .metric-content {
    padding: 1.5rem;
  }
}

// SLA Card specific styles
.sla-card {
  .sla-percentage {
    font-size: 3rem;
    font-weight: 700;
    background: linear-gradient(135deg, #10B981, #059669);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: 0.5rem;
  }

  .metric-subtitle {
    color: var(--warm-text);
    font-size: 0.95rem;
    margin-bottom: 1rem;
  }

  .progress-bar {
    border-radius: 8px;
    overflow: hidden;
  }

  .progress-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    color: var(--warm-text);
    
    .achieved {
      color: #10B981;
      font-weight: 600;
    }

    .total {
      color: var(--warm-brown);
      font-weight: 600;
    }
  }
}

// Pie chart styles
.tickets-card {
  .pie-chart-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2rem;
    padding: 1rem;
  }

  .pie-chart-container {
    position: relative;
  }

  .pie-chart {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: conic-gradient(
      #10B981 0deg var(--unbreached-percentage, 0deg),
      #EF4444 var(--unbreached-percentage, 0deg) 360deg
    );
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(212, 115, 10, 0.2);

    .pie-center {
      background: white;
      border-radius: 50%;
      width: 80px;
      height: 80px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

      .total-tickets {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--warm-brown);
      }

      .total-label {
        font-size: 0.7rem;
        color: var(--warm-text);
        opacity: 0.8;
      }
    }
  }

  .pie-legend {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .legend-color {
        width: 16px;
        height: 16px;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        &.unbreached-color {
          background: #10B981;
        }

        &.breached-color {
          background: #EF4444;
        }
      }

      .legend-text {
        display: flex;
        flex-direction: column;

        .legend-count {
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--warm-brown);
        }

        .legend-label {
          font-size: 0.8rem;
          color: var(--warm-text);
          opacity: 0.8;
        }
      }
    }
  }
}

// Targets card styles
.targets-card {
  .targets-grid {
    display: flex;
    align-items: center;
    justify-content: space-around;
    padding: 1rem;

    .metric-section {
      text-align: center;
      position: relative;

      .metric-number {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .metric-label {
        font-size: 0.9rem;
        color: var(--warm-text);
        font-weight: 500;
      }

      .metric-icon {
        margin-top: 0.5rem;
      }
    }

    .metric-divider {
      width: 2px;
      height: 60px;
      background: linear-gradient(to bottom, 
        transparent, 
        rgba(212, 115, 10, 0.3), 
        transparent);
    }

    .breached-section {
      color: #EF4444;
    }

    .unbreached-section {
      color: #10B981;
    }
  }
}

// Data table styles
.data-table-card {
  .data-table {
    .table-header {
      display: flex;
      background: linear-gradient(135deg, 
        rgba(212, 115, 10, 0.1) 0%, 
        rgba(245, 158, 11, 0.05) 100%);
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--warm-brown);
      border-bottom: 2px solid rgba(212, 115, 10, 0.1);

      .header-cell {
        flex: 1;
        padding: 1rem 0.75rem;
        border-right: 1px solid rgba(212, 115, 10, 0.1);
        text-transform: uppercase;
        letter-spacing: 0.5px;

        &:last-child {
          border-right: none;
        }

        &:nth-child(1) { flex: 0.8; }
        &:nth-child(2) { flex: 1; }
        &:nth-child(3) { flex: 1.2; }
        &:nth-child(4) { flex: 1; }
        &:nth-child(5) { flex: 1.5; }
      }
    }

    .table-body {
      max-height: 320px;
      overflow-y: auto;

      &::-webkit-scrollbar {
        width: 6px;
      }

      &::-webkit-scrollbar-track {
        background: rgba(212, 115, 10, 0.1);
        border-radius: 3px;
      }

      &::-webkit-scrollbar-thumb {
        background: rgba(212, 115, 10, 0.3);
        border-radius: 3px;

        &:hover {
          background: rgba(212, 115, 10, 0.5);
        }
      }

      .table-row {
        display: flex;
        border-bottom: 1px solid rgba(212, 115, 10, 0.1);
        transition: all 0.3s ease;

        &:hover {
          background: rgba(212, 115, 10, 0.05);
          transform: translateX(2px);
        }

        .table-cell {
          flex: 1;
          padding: 0.75rem;
          border-right: 1px solid rgba(212, 115, 10, 0.1);
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          color: var(--warm-text);

          &:last-child {
            border-right: none;
          }

          &:nth-child(1) { flex: 0.8; }
          &:nth-child(2) { flex: 1; }
          &:nth-child(3) { flex: 1.2; }
          &:nth-child(4) { flex: 1; }
          &:nth-child(5) { flex: 1.5; }

          &.assignee-cell,
          &.customer-cell {
            font-weight: 500;
            color: var(--warm-brown);
          }

          &.date-cell {
            font-size: 0.8rem;
            color: var(--warm-text);
            opacity: 0.8;
          }

          &.feedback-cell {
            .feedback-text {
              font-size: 0.8rem;
              line-height: 1.3;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              max-width: 100%;
            }
          }
        }
      }

      .no-data {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--warm-text);
        opacity: 0.6;

        .v-icon {
          opacity: 0.3;
        }

        p {
          margin: 0;
          font-style: italic;
        }
      }
    }
  }
}

.ticket-id-chip {
  background: linear-gradient(135deg, 
    rgba(212, 115, 10, 0.1), 
    rgba(245, 158, 11, 0.1));
  color: var(--warm-orange);
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.priority-chip {
  font-weight: 600;
  border-radius: 8px;

  .v-icon {
    margin-right: 2px;
  }
}

.risk-chip {
  font-weight: 500;
  border-radius: 6px;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;

  .rating-number {
    font-size: 0.8rem;
    color: var(--warm-text);
    opacity: 0.8;
  }
}

.go-back-btn {
  border: 2px solid rgba(212, 115, 10, 0.3);
  color: var(--warm-orange);
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(212, 115, 10, 0.1);
    border-color: var(--warm-orange);
    
  }

  .v-icon {
    margin-right: 4px;
  }
}

// Animation keyframes
@keyframes slideInDown {
  from {
    opacity: 0;
    /* transform: translateY(...) uklonjeno za bolje UX */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

/* Navigation Cards */
.navigation-cards-section {
  .navigation-card {
    background: linear-gradient(135deg, var(--warm-cream), var(--warm-cream-light));
    border: 1px solid var(--warm-orange-light);
    border-radius: 12px !important;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 25px rgba(212, 115, 10, 0.15) !important;
      border-color: var(--warm-orange);
    }

    .navigation-card-content {
      display: flex;
      align-items: center;
      padding: 1.5rem !important;
      gap: 1rem;
    }

    .nav-icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 48px;
    }

    .nav-text-content {
      flex: 1;
      
      .nav-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--warm-dark);
        margin: 0 0 0.25rem 0;
      }

      .nav-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .nav-arrow {
      opacity: 0.7;
      transition: all 0.3s ease;
    }

    &:hover .nav-arrow {
      opacity: 1;
      transform: translateX(4px);
    }

    &.escalations-card:hover {
      background: linear-gradient(135deg, var(--warm-cream), #f8e8e8);
    }

    &.compensations-card:hover {
      background: linear-gradient(135deg, var(--warm-cream), #e8f8e8);
    }

    &.tickets-card:hover {
      background: linear-gradient(135deg, var(--warm-cream), #f0f0f8);
    }
  }
}

// Responsive design
@media (max-width: 768px) {
  .analytics-container {
    padding: 1rem;
  }

  .analytics-header {
    flex-direction: column;
    gap: 1rem;

    .page-title {
      font-size: 1.5rem;
    }
  }

  /* Navigation Cards Mobile */
  .navigation-cards-section {
    .navigation-card {
      .navigation-card-content {
        padding: 1rem !important;
        
        .nav-text-content {
          .nav-title {
            font-size: 1rem;
          }

          .nav-subtitle {
            font-size: 0.8rem;
          }
        }
      }
    }
  }

  .pie-chart-wrapper {
    flex-direction: column;
    gap: 1rem;
  }

  .targets-grid {
    flex-direction: column;
    gap: 1rem;

    .metric-divider {
      width: 60px;
      height: 2px;
    }
  }

  .data-table {
    .table-header,
    .table-row {
      .header-cell,
      .table-cell {
        padding: 0.5rem 0.25rem;
        font-size: 0.75rem;

        &:nth-child(1) { flex: 0.6; }
        &:nth-child(2) { flex: 0.8; }
        &:nth-child(3) { flex: 1; }
        &:nth-child(4) { flex: 0.8; }
        &:nth-child(5) { flex: 1.2; }
      }
    }
  }
}
</style>
