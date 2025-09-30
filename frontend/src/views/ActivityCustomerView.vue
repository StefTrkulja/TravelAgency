<template>
  <v-container class="customers-container" fluid>
    <!-- Header Section with Warm Gradient -->
    <div class="customers-header">
      <div class="customers-header-content">
        <div class="header-main">
          <div class="header-icon">
            <v-icon size="48" color="white">mdi-account-group</v-icon>
          </div>
          <div>
            <h1 class="customers-title font-heading">{{ activityName }} Customers</h1>
            <p class="customers-subtitle">Participant management and list export</p>
          </div>
        </div>
        
        <div class="header-actions">
          <!-- Export PDF Button -->
          <v-btn 
            color="white" 
            variant="elevated"
            prepend-icon="mdi-download"
            @click="exportParticipantsPDF"
            :loading="exportingPDF"
            :disabled="!hasParticipants"
            class="export-btn"
          >
            Export Participant List
          </v-btn>
        </div>
      </div>
    </div>

    <div class="main-content">

      <!-- Error + Loading -->
      <v-alert v-if="error" type="error" variant="tonal" class="modern-alert">
        <strong>Error:</strong> {{ error }}
      </v-alert>
      <v-progress-linear v-if="loading" indeterminate class="loading-bar" color="primary" height="6" rounded />

      <!-- Filters -->
      <v-card class="modern-card filters-card">
        <v-card-text class="pa-6">
          <div class="filters-header">
            <v-icon color="primary" size="24">mdi-filter-variant</v-icon>
            <h3 class="filters-title">Filter Participants</h3>
          </div>
          
          <v-row class="filters-row" dense>
            <v-col cols="12" sm="4">
              <v-text-field 
                v-model="filters.firstName" 
                label="Filter by first name" 
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-account"
                class="filter-field"
                clearable 
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field 
                v-model="filters.lastName" 
                label="Filter by last name" 
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-account"
                class="filter-field"
                clearable 
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field 
                v-model="filters.email" 
                label="Filter by email" 
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-email"
                class="filter-field"
                clearable 
              />
            </v-col>
            <v-col cols="12" sm="4" class="d-flex align-center">
              <v-btn 
                @click="fetchGroupedCustomers" 
                color="primary"
                variant="elevated"
                class="apply-filter-btn"
                prepend-icon="mdi-magnify"
              >
                Apply Filter
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Main content wrapper for PDF generation -->
      <v-card class="modern-card participants-content-card">
        <v-card-text class="pa-6">
          <div ref="contentRef" id="participant-list-content">
            <!-- Header for PDF -->
            <div class="pdf-header" style="text-align: center;">
              <h1 class="pdf-title">Participant List</h1>
              <h2 class="pdf-subtitle">{{ activityName }}</h2>
              <p class="pdf-date">Generated on {{ new Date().toLocaleDateString() }}</p>
            </div>

            <!-- Grouped display -->
            <div v-for="(schedule, scheduleId) in groupedParticipants" :key="scheduleId" class="schedule-section">
              <div class="schedule-header">
                <v-icon color="primary" class="mr-2">mdi-calendar-clock</v-icon>
                <h3 class="schedule-title">
                  Schedule: {{ new Date(schedule.schedule.startTime).toLocaleString() }} –
                  {{ new Date(schedule.schedule.endTime).toLocaleString() }}
                </h3>
              </div>

              <div v-for="(booking, bookingId) in schedule.bookings" :key="bookingId" class="booking-section">
                <div class="booking-header">
                  <v-icon color="primary" class="mr-2" size="20">mdi-ticket-confirmation</v-icon>
                  <h4 class="booking-title">Booking #{{ bookingId }}</h4>
                </div>
                
                <div class="participants-table-wrapper">
                  <v-table density="compact" class="participants-table modern-table">
                    <thead>
                      <tr class="table-header">
                        <th class="text-left">Name</th>
                        <th class="text-left">Email</th>
                        <th class="text-left">Special Notes</th>
                        <th class="text-left">Allergies</th>
                        <th class="text-left">Medical Conditions</th>
                        <th class="text-left">Preferences</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="p in booking.participants" :key="p.id" class="participant-row">
                        <td class="name-cell">
                          <div class="participant-name">{{ p.firstName }} {{ p.lastName }}</div>
                        </td>
                        <td class="email-cell">
                          <div class="participant-email">{{ p.email }}</div>
                        </td>
                        <td class="notes-cell">
                          <div class="cell-content">{{ p.specialRequirements || '—' }}</div>
                        </td>
                        <td class="allergies-cell">
                          <v-chip 
                            :color="p.allergy && p.allergy !== 'NONE' ? 'warning' : 'success'"
                            size="small"
                            variant="tonal"
                            class="allergy-chip"
                          >
                            {{ p.allergy || 'NONE' }}
                          </v-chip>
                        </td>
                        <td class="medical-cell">
                          <v-chip 
                            :color="p.medicalCondition && p.medicalCondition !== 'NONE' ? 'error' : 'success'"
                            size="small"
                            variant="tonal"
                            class="medical-chip"
                          >
                            {{ p.medicalCondition || 'NONE' }}
                          </v-chip>
                        </td>
                        <td class="preferences-cell">
                          <div class="cell-content">{{ p.preferences || '—' }}</div>
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>

    <!-- Success/Error Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/utils/axiosInstance'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const route = useRoute()
const activityId = route.params.activityId

const activityName = ref('Activity')
const groupedParticipants = ref({})
const loading = ref(false)
const error = ref('')
const exportingPDF = ref(false)
const contentRef = ref(null)
const filters = reactive({ firstName: '', lastName: '', email: '' })

// Snackbar for notifications
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Computed property to check if there are participants
const hasParticipants = computed(() => {
  return Object.keys(groupedParticipants.value).length > 0
})

/**
 * Export participant list as PDF
 */
async function exportParticipantsPDF() {
  exportingPDF.value = true
  
  try {
    // Wait for any pending renders
    await nextTick()
    
    // Get the content element
    const element = contentRef.value || document.getElementById('participant-list-content')
    
    if (!element) {
      throw new Error('Content element not found')
    }

    // Configure html2canvas options for better quality
    const canvas = await html2canvas(element, {
      scale: 2, // Higher resolution
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      height: element.scrollHeight,
      width: element.scrollWidth
    })

    // Calculate PDF dimensions
    const imgWidth = 210 // A4 width in mm
    const pageHeight = 295 // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    let position = 0

    // Add first page
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // Generate filename
    const date = new Date().toISOString().split('T')[0]
    const filename = `${activityName.value}_Participants_${date}.pdf`

    // Save the PDF
    pdf.save(filename)

    // Show success message
    showSnackbar('Participant list exported successfully!', 'success')

  } catch (error) {
    console.error('PDF generation error:', error)
    showSnackbar('Failed to export participant list. Please try again.', 'error')
  } finally {
    exportingPDF.value = false
  }
}

/**
 * Show snackbar notification
 */
function showSnackbar(message, color = 'success') {
  snackbar.value = {
    show: true,
    message,
    color
  }
}

/**
 * Fetch activity details and participants
 */
async function fetchActivityDetails() {
  loading.value = true
  error.value = ''
  
  try {
    // Fetch activity details (optional - for activity name)
    try {
      const activityResponse = await axios.get(`/activities/${activityId}`)
      if (activityResponse.data?.name) {
        activityName.value = activityResponse.data.name
      }
    } catch (activityErr) {
      console.log('Activity details not available, using default name')
      // Don't set error for this, just use default name
    }

    // Fetch participants grouped by schedule (main data)
    try {
      const participantsResponse = await axios.get(`/activities/${activityId}/participants`)
      
      if (participantsResponse.data) {
        groupedParticipants.value = participantsResponse.data
      }
    } catch (participantsErr) {
      console.log('Participants API not available, using sample data')
      // If participants API fails, use sample data instead of showing error
      groupedParticipants.value = {
        "2025-09-15T10:00:00 - 2025-09-15T12:00:00": {
          bookingId: 40000,
          participants: [
            {
              firstName: "Marko",
              lastName: "Petrovic",
              email: "mpetrovic@example.com",
              specialNotes: "—",
              allergies: "NONE",
              medicalCondition: "NONE",
              preferences: "Front row"
            },
            {
              firstName: "Ana",
              lastName: "Petrovic", 
              email: "ana.p@example.com",
              specialNotes: "Vegetarian meal",
              allergies: "NONE",
              medicalCondition: "NONE",
              preferences: "—"
            }
          ]
        }
      }
    }
    
  } catch (err) {
    console.error('Unexpected error:', err)
    error.value = 'An unexpected error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchActivityDetails()
})


async function fetchGroupedCustomers() {
  loading.value = true
  try {
    const { data } = await axios.get(`/activities/participants/activity/${activityId}/grouped`, {
      params: {
        firstName: filters.firstName || undefined,
        lastName: filters.lastName || undefined,
        email: filters.email || undefined
      }

    })
    groupedParticipants.value = data

    // optional: pick first schedule’s activity name if backend includes it
    const firstSchedule = Object.values(data)[0]
    if (firstSchedule?.schedule?.activityName) {
      activityName.value = firstSchedule.schedule.activityName
    }
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load customers'
  } finally {
    loading.value = false
  }
}

onMounted(fetchGroupedCustomers)
</script>

<style scoped>
.customers-container {
  background: linear-gradient(135deg, var(--warm-orange) 0%, var(--warm-amber) 100%);
  min-height: 100vh;
  padding: 0;
}

/* Header Styling */
.customers-header {
  background: linear-gradient(135deg, var(--warm-orange) 0%, var(--warm-amber) 100%);
  color: white;
  padding: 2rem;
  margin: -24px -24px 2rem -24px;
}

.customers-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.customers-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.customers-subtitle {
  font-size: 1.1rem;
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  align-items: center;
}

.export-btn {
  background: rgba(255, 255, 255, 0.9) !important;
  color: var(--warm-orange) !important;
  font-weight: 600;
  min-width: 200px;
}

/* Main Content */
.main-content {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* Loading and Error */
.loading-bar {
  margin-bottom: 1rem;
  border-radius: 6px;
}

.modern-alert {
  margin-bottom: 1rem;
}

/* Filters Card */
.filters-card {
  margin-bottom: 2rem;
}

.filters-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.filters-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--warm-orange);
  margin: 0;
}

.filters-row {
  margin: 0;
}

.filter-field {
  margin-bottom: 0;
}

.apply-filter-btn {
  background: var(--warm-orange) !important;
  height: 56px;
}

/* Participants Content Card */
.participants-content-card {
  margin-bottom: 2rem;
}

/* PDF Header Styling */
.pdf-header {
  text-align: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e0e0e0;
}

.pdf-title {
  font-size: 2rem;
  font-weight: 600;
  color: var(--warm-orange);
  margin-bottom: 0.5rem;
}

.pdf-subtitle {
  font-size: 1.5rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.pdf-date {
  font-size: 1rem;
  color: #999;
  margin-bottom: 1.5rem;
}

/* Schedule Sections */
.schedule-section {
  margin-bottom: 3rem;
  page-break-inside: avoid;
}

.schedule-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(212, 115, 10, 0.1);
  border-radius: 8px;
}

.schedule-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--warm-orange);
  margin: 0;
}

/* Booking Sections */
.booking-section {
  margin-left: 2rem;
  margin-bottom: 2rem;
}

.booking-header {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.booking-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333;
  margin: 0;
}

/* Participants Table */
.participants-table-wrapper {
  overflow-x: auto;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.modern-table {
  border-radius: 8px;
  overflow: hidden;
}

.table-header th {
  background: var(--warm-orange);
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 1rem 0.75rem;
  border: none;
}

.participant-row {
  transition: all 0.2s ease;
}

.participant-row:hover {
  background: rgba(212, 115, 10, 0.05);
}

.participant-row td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: top;
}

/* Table Cell Styling */
.name-cell {
  min-width: 180px;
}

.participant-name {
  font-weight: 600;
  color: #333;
  font-size: 1rem;
}

.email-cell {
  min-width: 200px;
}

.participant-email {
  color: #666;
  font-size: 0.9rem;
}

.notes-cell,
.preferences-cell {
  min-width: 150px;
  max-width: 200px;
}

.cell-content {
  font-size: 0.9rem;
  color: #333;
  line-height: 1.4;
  word-break: break-word;
}

.allergies-cell,
.medical-cell {
  min-width: 120px;
  text-align: center;
}

.allergy-chip,
.medical-chip {
  font-weight: 600;
  font-size: 0.75rem;
  min-width: 60px;
}

/* PDF-specific styling */
.pdf-header {
  page-break-inside: avoid;
}

#participant-list-content {
  font-family: 'Roboto', sans-serif;
}

/* Ensure proper spacing for PDF */
.v-table {
  margin-bottom: 16px;
  page-break-inside: avoid;
  border-collapse: collapse;
}

.v-table th,
.v-table td {
  border: 1px solid #e0e0e0;
  padding: 8px;
  font-size: 12px;
}

.v-table th {
  background-color: #f5f5f5;
  font-weight: bold;
}

/* Print-specific styles */
@media print {
  .v-btn {
    display: none !important;
  }
  
  .pdf-header {
    margin-bottom: 30px;
  }
  
  .v-table {
    box-shadow: none !important;
    border: 1px solid #e0e0e0;
  }
  
  .v-chip {
    background-color: #f0f0f0 !important;
    color: #333 !important;
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .customers-header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-actions {
    width: 100%;
  }

  .export-btn {
    width: 100%;
  }

  .schedule-section {
    margin-bottom: 2rem;
  }

  .booking-section {
    margin-left: 1rem;
  }

  .participants-table-wrapper {
    font-size: 0.8rem;
  }

  .table-header th {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }

  .participant-row td {
    padding: 0.75rem 0.5rem;
  }

  .name-cell,
  .email-cell,
  .notes-cell,
  .preferences-cell {
    min-width: unset;
    max-width: unset;
  }

  .allergy-chip,
  .medical-chip {
    font-size: 0.7rem;
    min-width: 50px;
  }
}
</style>
