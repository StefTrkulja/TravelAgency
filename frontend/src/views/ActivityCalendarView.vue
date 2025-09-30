<template>
  <v-container class="calendar-container" fluid>
    <!-- Header Section with Warm Gradient -->
    <div class="calendar-header">
      <div class="calendar-header-content">
        <div class="header-main">
          <div class="header-icon">
            <v-icon size="48" color="white">mdi-calendar-month</v-icon>
          </div>
          <div>
            <h1 class="calendar-title font-heading">Activity Calendar</h1>
            <p class="calendar-subtitle">Manage and view all activity schedules</p>
          </div>
        </div>
        
        <div class="header-actions">
          <!-- Calendar View Toggle -->
          <v-btn-toggle v-model="viewMode" mandatory class="view-toggle">
            <v-btn value="month" size="small" class="toggle-btn">Month</v-btn>
            <v-btn value="week" size="small" class="toggle-btn">Week</v-btn>
            <v-btn value="day" size="small" class="toggle-btn">Day</v-btn>
          </v-btn-toggle>
          
          <!-- Refresh Button -->
          <v-btn 
            color="white" 
            variant="elevated"
            prepend-icon="mdi-refresh"
            @click="fetchSchedules"
            :loading="loading"
            class="refresh-btn"
          >
            Refresh
          </v-btn>
        </div>
      </div>
    </div>

    <div class="main-content">

      <!-- Filters -->
      <v-card class="modern-card filters-card">
        <v-card-text class="pa-6">
          <div class="filters-header">
            <v-icon color="primary" size="24">mdi-filter-variant</v-icon>
            <h3 class="filters-title">Filters</h3>
          </div>
          
          <v-row class="filters-row">
            <v-col cols="12" md="3">
              <v-select
                v-model="filters.destinationId"
                :items="destinations"
                item-title="name"
                item-value="id"
                label="Filter by Destination"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-map-marker"
                clearable
                class="filter-field"
                @update:model-value="fetchSchedules"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-select
                v-model="filters.arrangementId"
                :items="arrangements"
                item-title="title"
                item-value="id"
                label="Filter by Arrangement"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-package-variant"
                clearable
                class="filter-field"
                @update:model-value="fetchSchedules"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="filters.fromDate"
                label="From Date"
                type="date"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-start"
                class="filter-field"
                @update:model-value="fetchSchedules"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model="filters.toDate"
                label="To Date"
                type="date"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-calendar-end"
                class="filter-field"
                @update:model-value="fetchSchedules"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Calendar Navigation -->
      <v-card class="modern-card navigation-card">
        <v-card-text class="pa-6">
          <div class="navigation-content">
            <div class="navigation-controls">
              <v-btn
                icon="mdi-chevron-left"
                variant="text"
                color="primary"
                size="large"
                class="nav-btn"
                @click="previousPeriod"
              />
              <h3 class="period-title">{{ formatPeriodTitle() }}</h3>
              <v-btn
                icon="mdi-chevron-right"
                variant="text"
                color="primary"
                size="large"
                class="nav-btn"
                @click="nextPeriod"
              />
            </div>
            
            <v-btn
              color="primary"
              variant="elevated"
              class="today-btn"
              @click="goToToday"
            >
              Today
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <!-- Loading -->
      <v-progress-linear v-if="loading" indeterminate class="loading-bar" color="primary" height="6" rounded />

      <!-- Error -->
      <v-alert v-if="error" type="error" variant="tonal" class="modern-alert">
        <strong>Error:</strong> {{ error }}
      </v-alert>

      <!-- Calendar Grid -->
      <v-card class="modern-card calendar-card">
        <v-card-text class="pa-6">
          <!-- Month View -->
      <div v-if="viewMode === 'month'" class="calendar-month">
        <!-- Month Header -->
        <div class="calendar-header">
          <div v-for="day in dayHeaders" :key="day" class="calendar-day-header">
            {{ day }}
          </div>
        </div>
        
        <!-- Month Grid -->
        <div class="calendar-grid">
          <div
            v-for="(day, index) in monthDays"
            :key="index"
            class="calendar-day"
            :class="{
              'calendar-day--other-month': !day.isCurrentMonth,
              'calendar-day--today': day.isToday,
              'calendar-day--has-activities': day.activities.length > 0
            }"
          >
            <div class="calendar-day-number">{{ day.date.getDate() }}</div>
            
            <!-- Activities for this day -->
            <div class="calendar-activities">
              <div
                v-for="activity in day.activities.slice(0, 3)"
                :key="activity.id"
                class="calendar-activity"
                :class="`calendar-activity--${getActivityColor(activity)}`"
                @click="openActivityDetails(activity)"
                :title="getActivityTooltip(activity)"
              >
                <div class="activity-title">{{ activity.activityName }}</div>
                <div class="activity-time">
                  {{ formatTime(activity.startTime) }} - {{ formatTime(activity.endTime) }}
                </div>
                <div class="activity-meta">
                  {{ activity.bookedParticipants }}/{{ activity.maxCapacity }}
                </div>
              </div>
              
              <!-- More activities indicator -->
              <div v-if="day.activities.length > 3" class="activity-more">
                +{{ day.activities.length - 3 }} more
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Week View -->
      <div v-else-if="viewMode === 'week'" class="calendar-week">
        <div class="week-header">
          <div class="time-column"></div>
          <div v-for="day in weekDays" :key="day.date.toISOString()" class="week-day-header">
            <div class="week-day-name">{{ formatDayName(day.date) }}</div>
            <div class="week-day-date">{{ day.date.getDate() }}</div>
          </div>
        </div>
        
        <div class="week-grid">
          <!-- Time slots -->
          <div v-for="hour in timeSlots" :key="hour" class="time-row">
            <div class="time-label">{{ formatHour(hour) }}</div>
            
            <!-- Day columns -->
            <div v-for="day in weekDays" :key="day.date.toISOString()" class="week-day-column">
              <div
                v-for="activity in getActivitiesForHour(day.activities, hour)"
                :key="activity.id"
                class="week-activity"
                :class="`week-activity--${getActivityColor(activity)}`"
                @click="openActivityDetails(activity)"
                :title="getActivityTooltip(activity)"
              >
                <div class="activity-title">{{ activity.activityName }}</div>
                <div class="activity-arrangement">{{ activity.arrangementTitle }}</div>
                <div class="activity-participants">{{ activity.bookedParticipants }}/{{ activity.maxCapacity }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Day View -->
      <div v-else-if="viewMode === 'day'" class="calendar-day-view">
        <h4 class="mb-4">{{ formatDate(currentDate) }}</h4>
        
        <div v-if="dayActivities.length === 0" class="text-center text-grey pa-8">
          No activities scheduled for this day
        </div>
        
        <div v-else class="day-activities">
          <v-timeline>
            <v-timeline-item
              v-for="activity in dayActivities"
              :key="activity.id"
              :dot-color="getActivityColor(activity)"
              size="small"
            >
              <template #opposite>
                <div class="text-caption">
                  {{ formatTime(activity.startTime) }} - {{ formatTime(activity.endTime) }}
                </div>
              </template>
              
              <v-card class="mb-2" variant="outlined" @click="openActivityDetails(activity)">
                <v-card-text class="pa-3">
                  <div class="font-weight-bold">{{ activity.activityName }}</div>
                  <div class="text-body-2">{{ activity.arrangementTitle }}</div>
                  <div class="text-body-2">Destination: {{ activity.destinationName }}</div>
                  <div class="text-caption">
                    Participants: {{ activity.bookedParticipants }}/{{ activity.maxCapacity }}
                    <v-chip
                      v-if="activity.hasConflicts"
                      size="small"
                      color="error"
                      class="ml-2"
                    >
                      Conflict!
                    </v-chip>
                  </div>
                </v-card-text>
              </v-card>
            </v-timeline-item>
          </v-timeline>
        </div>
      </div>
        </v-card-text>
      </v-card>

    <!-- Activity Details Dialog -->
    <v-dialog v-model="activityDialog.open" max-width="800">
      <v-card v-if="activityDialog.activity" class="modern-card">
        <v-card-title class="dialog-header">
          <div class="dialog-header-content">
            <v-icon class="mr-3" color="primary" size="32">mdi-calendar-clock</v-icon>
            <div>
              <h3 class="dialog-title">{{ activityDialog.activity.activityName }}</h3>
              <p class="dialog-subtitle">Activity Schedule Details</p>
            </div>
          </div>
          <v-chip
            :color="getActivityColor(activityDialog.activity)"
            variant="flat"
            class="status-chip"
          >
            {{ getActivityStatus(activityDialog.activity) }}
          </v-chip>
        </v-card-title>
        
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <h4 class="text-subtitle-1 mb-2">Schedule Details</h4>
              <div><strong>Date:</strong> {{ formatDate(activityDialog.activity.startTime) }}</div>
              <div><strong>Time:</strong> {{ formatTime(activityDialog.activity.startTime) }} - {{ formatTime(activityDialog.activity.endTime) }}</div>
              <div><strong>Duration:</strong> {{ calculateDuration(activityDialog.activity.startTime, activityDialog.activity.endTime) }}</div>
            </v-col>
            
            <v-col cols="12" md="6">
              <h4 class="text-subtitle-1 mb-2">Booking Information</h4>
              <div><strong>Capacity:</strong> {{ activityDialog.activity.maxCapacity }}</div>
              <div><strong>Booked:</strong> {{ activityDialog.activity.bookedParticipants }}</div>
              <div><strong>Available:</strong> {{ activityDialog.activity.maxCapacity - activityDialog.activity.bookedParticipants }}</div>
              <div><strong>Occupancy:</strong> {{ Math.round((activityDialog.activity.bookedParticipants / activityDialog.activity.maxCapacity) * 100) }}%</div>
            </v-col>
            
            <v-col cols="12">
              <h4 class="text-subtitle-1 mb-2">Arrangement Details</h4>
              <div><strong>Arrangement:</strong> {{ activityDialog.activity.arrangementTitle }}</div>
              <div><strong>Destination:</strong> {{ activityDialog.activity.destinationName }}</div>
              <div><strong>Transport:</strong> {{ activityDialog.activity.transportType }}</div>
              <div><strong>Accommodation:</strong> {{ activityDialog.activity.accommodationType }}</div>
            </v-col>
            
            <!-- Conflict Warnings -->
            <v-col v-if="activityDialog.activity.conflicts && activityDialog.activity.conflicts.length > 0" cols="12">
              <v-alert type="warning" variant="tonal">
                <div class="font-weight-bold">Schedule Conflicts Detected:</div>
                <ul class="mt-2">
                  <li v-for="conflict in activityDialog.activity.conflicts" :key="conflict.id">
                    {{ conflict.message }}
                  </li>
                </ul>
              </v-alert>
            </v-col>
          </v-row>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn 
            color="primary" 
            variant="outlined"
            :to="`/activities/${activityDialog.activity.activityId}/customers`"
          >
            View Participants
          </v-btn>
          <v-btn 
            color="secondary" 
            variant="outlined"
            :to="`/activities/${activityDialog.activity.activityId}/schedules`"
          >
            Manage Schedules
          </v-btn>
          <v-btn text @click="activityDialog.open = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Legend -->
    <v-card class="mt-6 pa-4">
      <h4 class="text-subtitle-1 mb-3">Calendar Legend</h4>
      <v-row>
        <v-col cols="12" md="3">
          <div class="d-flex align-center gap-2 mb-2">
            <div class="legend-color legend-color--green"></div>
            <span>Available (< 80% booked)</span>
          </div>
          <div class="d-flex align-center gap-2 mb-2">
            <div class="legend-color legend-color--orange"></div>
            <span>Nearly Full (80-95% booked)</span>
          </div>
        </v-col>
        <v-col cols="12" md="3">
          <div class="d-flex align-center gap-2 mb-2">
            <div class="legend-color legend-color--red"></div>
            <span>Full/Overbooked (95%+ booked)</span>
          </div>
          <div class="d-flex align-center gap-2 mb-2">
            <div class="legend-color legend-color--grey"></div>
            <span>Past/Completed</span>
          </div>
        </v-col>
        <v-col cols="12" md="6">
          <div class="text-body-2 text-grey-darken-2">
            Click on any activity to view details, participants, and manage schedules.
            Use filters to focus on specific destinations or arrangements.
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
    </div>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import axios from '@/utils/axiosInstance'

// State
const loading = ref(false)
const error = ref('')
const viewMode = ref('month')
const currentDate = ref(new Date())
const schedules = ref([])
const destinations = ref([])
const arrangements = ref([])

// Filters
const filters = reactive({
  destinationId: null,
  arrangementId: null,
  fromDate: '',
  toDate: ''
})

// Dialog
const activityDialog = reactive({
  open: false,
  activity: null
})

// Snackbar
const snackbar = reactive({
  show: false,
  message: '',
  color: 'success'
})

// Calendar constants
const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const timeSlots = Array.from({ length: 24 }, (_, i) => i) // 0-23 hours

// Computed properties
const monthDays = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  
  // First day of the month
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  // Start from Sunday of the week containing the first day
  const startDate = new Date(firstDay)
  startDate.setDate(startDate.getDate() - startDate.getDay())
  
  const days = []
  const current = new Date(startDate)
  
  // Generate 42 days (6 weeks)
  for (let i = 0; i < 42; i++) {
    const isCurrentMonth = current.getMonth() === month
    const isToday = isToday_(current)
    const activities = getActivitiesForDate(current)
    
    days.push({
      date: new Date(current),
      isCurrentMonth,
      isToday,
      activities
    })
    
    current.setDate(current.getDate() + 1)
  }
  
  return days
})

const weekDays = computed(() => {
  const days = []
  const startOfWeek = new Date(currentDate.value)
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(date.getDate() + i)
    
    days.push({
      date,
      activities: getActivitiesForDate(date)
    })
  }
  
  return days
})

const dayActivities = computed(() => {
  return getActivitiesForDate(currentDate.value).sort((a, b) => 
    new Date(a.startTime) - new Date(b.startTime)
  )
})

// Methods
function isToday_(date) {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

function getActivitiesForDate(date) {
  const dateStr = date.toDateString()
  return schedules.value.filter(schedule => 
    new Date(schedule.startTime).toDateString() === dateStr
  )
}

function getActivitiesForHour(activities, hour) {
  return activities.filter(activity => {
    const startHour = new Date(activity.startTime).getHours()
    const endHour = new Date(activity.endTime).getHours()
    return hour >= startHour && hour <= endHour
  })
}

function getActivityColor(activity) {
  if (new Date(activity.endTime) < new Date()) {
    return 'grey' // Past activity
  }
  
  const occupancy = activity.bookedParticipants / activity.maxCapacity
  
  if (occupancy >= 0.95) return 'red'     // Full/Overbooked
  if (occupancy >= 0.8) return 'orange'   // Nearly full
  return 'green'                          // Available
}

function getActivityStatus(activity) {
  if (new Date(activity.endTime) < new Date()) {
    return 'Completed'
  }
  
  const occupancy = activity.bookedParticipants / activity.maxCapacity
  
  if (occupancy >= 0.95) return 'Full'
  if (occupancy >= 0.8) return 'Nearly Full'
  return 'Available'
}

function getActivityTooltip(activity) {
  return `${activity.activityName}\n${activity.arrangementTitle}\n${formatTime(activity.startTime)} - ${formatTime(activity.endTime)}\nParticipants: ${activity.bookedParticipants}/${activity.maxCapacity}`
}

function formatTime(dateTime) {
  return new Date(dateTime).toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
}

function formatDate(dateTime) {
  return new Date(dateTime).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatDayName(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short' })
}

function formatHour(hour) {
  return `${hour.toString().padStart(2, '0')}:00`
}

function formatPeriodTitle() {
  if (viewMode.value === 'month') {
    return currentDate.value.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    })
  } else if (viewMode.value === 'week') {
    const startOfWeek = new Date(currentDate.value)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(endOfWeek.getDate() + 6)
    
    return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  } else {
    return formatDate(currentDate.value)
  }
}

function calculateDuration(startTime, endTime) {
  const diff = new Date(endTime) - new Date(startTime)
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours === 0) return `${minutes} minutes`
  if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`
  return `${hours}h ${minutes}m`
}

function previousPeriod() {
  const newDate = new Date(currentDate.value)
  
  if (viewMode.value === 'month') {
    newDate.setMonth(newDate.getMonth() - 1)
  } else if (viewMode.value === 'week') {
    newDate.setDate(newDate.getDate() - 7)
  } else {
    newDate.setDate(newDate.getDate() - 1)
  }
  
  currentDate.value = newDate
  fetchSchedules()
}

function nextPeriod() {
  const newDate = new Date(currentDate.value)
  
  if (viewMode.value === 'month') {
    newDate.setMonth(newDate.getMonth() + 1)
  } else if (viewMode.value === 'week') {
    newDate.setDate(newDate.getDate() + 7)
  } else {
    newDate.setDate(newDate.getDate() + 1)
  }
  
  currentDate.value = newDate
  fetchSchedules()
}

function goToToday() {
  currentDate.value = new Date()
  fetchSchedules()
}

function openActivityDetails(activity) {
  activityDialog.activity = activity
  activityDialog.open = true
}

function showSnackbar(message, color = 'success') {
  snackbar.message = message
  snackbar.color = color
  snackbar.show = true
}

/**
 * Fetch activity schedules based on current filters
 */
async function fetchSchedules() {
  loading.value = true
  error.value = ''
  
  try {
    // Build query parameters
    const params = {}
    
    if (filters.destinationId) params.destinationId = filters.destinationId
    if (filters.arrangementId) params.arrangementId = filters.arrangementId
    if (filters.fromDate) params.fromDate = filters.fromDate
    if (filters.toDate) params.toDate = filters.toDate
    
    // If no date filters, set based on current view
    if (!filters.fromDate && !filters.toDate) {
      if (viewMode.value === 'month') {
        const year = currentDate.value.getFullYear()
        const month = currentDate.value.getMonth()
        params.fromDate = new Date(year, month, 1).toISOString().split('T')[0]
        params.toDate = new Date(year, month + 1, 0).toISOString().split('T')[0]
      } else if (viewMode.value === 'week') {
        const startOfWeek = new Date(currentDate.value)
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        const endOfWeek = new Date(startOfWeek)
        endOfWeek.setDate(endOfWeek.getDate() + 6)
        params.fromDate = startOfWeek.toISOString().split('T')[0]
        params.toDate = endOfWeek.toISOString().split('T')[0]
      } else {
        params.fromDate = currentDate.value.toISOString().split('T')[0]
        params.toDate = currentDate.value.toISOString().split('T')[0]
      }
    }
    
    // Fetch schedules (this endpoint would need to be created)
    try {
      const { data } = await axios.get('/calendar/activity-schedules', { params })
      schedules.value = data
    } catch (err) {
      console.log('Calendar API not available, using mock data')
      // Mock data for demonstration
      schedules.value = generateMockSchedules()
    }
    
  } catch (err) {
    error.value = 'Failed to load activity schedules'
    console.error('Error fetching schedules:', err)
  } finally {
    loading.value = false
  }
}

/**
 * Fetch destinations for filter dropdown
 */
async function fetchDestinations() {
  try {
    const { data } = await axios.get('/destinations')
    destinations.value = data
  } catch (err) {
    console.error('Error fetching destinations:', err)
  }
}

/**
 * Fetch arrangements for filter dropdown
 */
async function fetchArrangements() {
  try {
    const { data } = await axios.get('/anjaArrangements')
    arrangements.value = data
  } catch (err) {
    console.error('Error fetching arrangements:', err)
  }
}

/**
 * Generate mock schedule data for demonstration
 */
function generateMockSchedules() {
  const mockSchedules = []
  const today = new Date()
  
  // Generate some sample activities for the next 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    
    // Skip some days randomly
    if (Math.random() > 0.6) continue
    
    // 1-3 activities per day
    const numActivities = Math.floor(Math.random() * 3) + 1
    
    for (let j = 0; j < numActivities; j++) {
      const startHour = 8 + Math.floor(Math.random() * 10) // 8 AM to 6 PM
      const duration = [1, 2, 3, 4][Math.floor(Math.random() * 4)] // 1-4 hours
      
      const startTime = new Date(date)
      startTime.setHours(startHour, 0, 0, 0)
      
      const endTime = new Date(startTime)
      endTime.setHours(startTime.getHours() + duration)
      
      const maxCapacity = [10, 15, 20, 25, 30][Math.floor(Math.random() * 5)]
      const bookedParticipants = Math.floor(Math.random() * (maxCapacity + 2)) // Can be overbooked
      
      const activities = [
        'Eiffel Tower Visit', 'Seine River Cruise', 'Louvre Museum Tour', 
        'Montmartre Walking Tour', 'Wine Tasting', 'Cooking Class',
        'City Bus Tour', 'Notre Dame Visit', 'Palace of Versailles',
        'Latin Quarter Walk'
      ]
      
      const arrangements = [
        'Paris City Break', 'French Cultural Tour', 'Romantic Paris',
        'Paris for Families', 'Art & History Paris'
      ]
      
      mockSchedules.push({
        id: `mock-${i}-${j}`,
        activityId: Math.floor(Math.random() * 100),
        activityName: activities[Math.floor(Math.random() * activities.length)],
        arrangementId: Math.floor(Math.random() * 5) + 1,
        arrangementTitle: arrangements[Math.floor(Math.random() * arrangements.length)],
        destinationName: 'Paris',
        transportType: 'BUS',
        accommodationType: 'HOTEL',
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        maxCapacity,
        bookedParticipants,
        hasConflicts: bookedParticipants > maxCapacity,
        conflicts: bookedParticipants > maxCapacity ? [
          { id: 1, message: `Overbooked by ${bookedParticipants - maxCapacity} participants` }
        ] : []
      })
    }
  }
  
  return mockSchedules
}

// Watch for view mode changes
watch(viewMode, () => {
  fetchSchedules()
})

// Initialize
onMounted(async () => {
  await Promise.all([
    fetchDestinations(),
    fetchArrangements(),
    fetchSchedules()
  ])
})
</script>

<style scoped>
.calendar-container {
  background: var(--warm-bg);
  min-height: 100vh;
  padding: 0 !important;
}

/* Header Section */
.calendar-header {
  background: var(--warm-gradient);
  padding: 2rem;
  margin: -24px -24px 2rem -24px;
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

.calendar-header-content {
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
  gap: 1.5rem;
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

.calendar-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.calendar-subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  margin: 0.5rem 0 0 0;
  font-weight: 400;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.view-toggle {
  background: rgba(255, 255, 255, 0.9) !important;
  border-radius: 12px !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.toggle-btn {
  color: var(--warm-orange) !important;
  font-weight: 600 !important;
}

.toggle-btn.v-btn--selected {
  background: var(--warm-orange) !important;
  color: white !important;
}

.refresh-btn {
  background: rgba(255, 255, 255, 0.9) !important;
  color: var(--warm-orange) !important;
  font-weight: 600 !important;
}

/* Main Content */
.main-content {
  padding: 0 2rem 2rem 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Modern Cards */
.modern-card {
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(245, 158, 11, 0.1) !important;
  border-radius: 16px !important;
  box-shadow: 0 4px 20px rgba(212, 115, 10, 0.1) !important;
  margin-bottom: 1.5rem;
  transition: all 0.3s ease !important;
  
  &:hover {
    box-shadow: 0 8px 32px rgba(212, 115, 10, 0.15) !important;
  }
}

/* Filters Card */
.filters-card {
  margin-bottom: 1.5rem;
}

.filters-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.filters-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--warm-orange);
  margin: 0;
}

.filters-row {
  margin: 0;
}

.filter-field {
  :deep(.v-field) {
    border-radius: 12px !important;
    box-shadow: 0 2px 8px rgba(212, 115, 10, 0.06) !important;
  }
  
  :deep(.v-field--focused) {
    box-shadow: 0 4px 16px rgba(212, 115, 10, 0.12) !important;
  }
}

/* Navigation Card */
.navigation-card {
  margin-bottom: 1.5rem;
}

.navigation-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.navigation-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.period-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--warm-orange);
  margin: 0;
  min-width: 200px;
  text-align: center;
}

.nav-btn {
  color: var(--warm-orange) !important;
}

.today-btn {
  background: var(--warm-orange) !important;
  font-weight: 600 !important;
}

/* Loading and Alert */
.loading-bar {
  margin-bottom: 1rem;
  border-radius: 6px;
}

.modern-alert {
  border-radius: 12px !important;
  margin-bottom: 1rem;
}

/* Calendar Card */
.calendar-card {
  margin-bottom: 0;
}

/* Calendar Month View */
.calendar-month {
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: var(--warm-gradient);
  color: white;
}

.calendar-day-header {
  padding: 1rem 0.5rem;
  text-align: center;
  font-weight: 700;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 0.9rem;
  letter-spacing: 0.5px;
}

.calendar-day-header:last-child {
  border-right: none;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  min-height: 120px;
  border-right: 1px solid rgba(245, 158, 11, 0.1);
  border-bottom: 1px solid rgba(245, 158, 11, 0.1);
  padding: 0.5rem;
  position: relative;
  background: white;
  transition: background-color 0.2s ease;
}

.calendar-day:nth-child(7n) {
  border-right: none;
}

.calendar-day--other-month {
  background-color: #fafafa;
  color: #999;
}

.calendar-day--today {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(212, 115, 10, 0.1) 100%);
  border: 2px solid var(--warm-orange);
}

.calendar-day--has-activities {
  background-color: rgba(245, 158, 11, 0.02);
}

.calendar-day-number {
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--warm-orange);
}

.calendar-activities {
  font-size: 0.75rem;
}

.calendar-activity {
  margin-bottom: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.calendar-activity:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.calendar-activity--green {
  background-color: #c8e6c9;
  color: #2e7d32;
  border-color: #4caf50;
}

.calendar-activity--orange {
  background-color: #ffe0b2;
  color: #f57c00;
  border-color: #ff9800;
}

.calendar-activity--red {
  background-color: #ffcdd2;
  color: #d32f2f;
  border-color: #f44336;
}

.calendar-activity--grey {
  background-color: #f5f5f5;
  color: #757575;
  border-color: #9e9e9e;
}

.activity-title {
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.activity-time, .activity-meta {
  font-size: 0.7rem;
  opacity: 0.8;
  margin-top: 0.125rem;
}

.activity-more {
  font-size: 0.7rem;
  color: var(--warm-orange);
  font-style: italic;
  font-weight: 600;
  margin-top: 0.25rem;
}

/* Calendar Week View */
.calendar-week {
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.week-header {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  background: var(--warm-gradient);
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.time-column {
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.week-day-header {
  padding: 1rem 0.5rem;
  text-align: center;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
}

.week-day-header:last-child {
  border-right: none;
}

.week-day-name {
  font-weight: 700;
  font-size: 0.9rem;
}

.week-day-date {
  font-size: 0.8rem;
  opacity: 0.9;
  margin-top: 0.25rem;
}

.week-grid {
  max-height: 600px;
  overflow-y: auto;
}

.time-row {
  display: grid;
  grid-template-columns: 80px repeat(7, 1fr);
  min-height: 40px;
  border-bottom: 1px solid #f0f0f0;
}

.time-label {
  padding: 0.5rem;
  font-size: 0.8rem;
  color: #666;
  border-right: 1px solid #e0e0e0;
  text-align: center;
  background: rgba(245, 158, 11, 0.02);
}

.week-day-column {
  border-right: 1px solid #e0e0e0;
  padding: 0.25rem;
  position: relative;
}

.week-day-column:last-child {
  border-right: none;
}

.week-activity {
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  margin-bottom: 0.25rem;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.week-activity:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.week-activity--green {
  background-color: #c8e6c9;
  color: #2e7d32;
  border-color: #4caf50;
}

.week-activity--orange {
  background-color: #ffe0b2;
  color: #f57c00;
  border-color: #ff9800;
}

.week-activity--red {
  background-color: #ffcdd2;
  color: #d32f2f;
  border-color: #f44336;
}

.week-activity--grey {
  background-color: #f5f5f5;
  color: #757575;
  border-color: #9e9e9e;
}

.activity-arrangement {
  font-size: 0.7rem;
  opacity: 0.8;
}

.activity-participants {
  font-size: 0.7rem;
  font-weight: 600;
}

/* Day View */
.day-activities {
  max-height: 600px;
  overflow-y: auto;
}

/* Legend */
.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 6px;
  flex-shrink: 0;
}

.legend-color--green {
  background-color: #c8e6c9;
  border: 1px solid #4caf50;
}

.legend-color--orange {
  background-color: #ffe0b2;
  border: 1px solid #ff9800;
}

.legend-color--red {
  background-color: #ffcdd2;
  border: 1px solid #f44336;
}

.legend-color--grey {
  background-color: #f5f5f5;
  border: 1px solid #9e9e9e;
}

/* Responsive Design */
@media (max-width: 960px) {
  .calendar-header {
    padding: 1.5rem 1rem;
  }
  
  .calendar-header-content {
    flex-direction: column;
    gap: 1.5rem;
    text-align: center;
  }
  
  .header-main {
    flex-direction: column;
    gap: 1rem;
  }
  
  .header-icon {
    width: 64px;
    height: 64px;
  }
  
  .calendar-title {
    font-size: 2rem;
  }
  
  .main-content {
    padding: 0 1rem 1rem 1rem;
  }
  
  .navigation-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .period-title {
    font-size: 1.2rem;
  }
}

@media (max-width: 768px) {
  .calendar-day {
    min-height: 80px;
  }
  
  .calendar-activity {
    font-size: 0.7rem;
  }
  
  .activity-time, .activity-meta {
    display: none;
  }
  
  .filters-row .v-col {
    margin-bottom: 0.5rem;
  }
}
</style>
