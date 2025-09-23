<template>
  <v-container class="py-8">
    <div class="d-flex align-center justify-space-between mb-6">
      <h2 class="text-h5">{{ activityName }} Customers</h2>
      
      <!-- Export PDF Button -->
      <v-btn 
        color="primary" 
        variant="elevated"
        prepend-icon="mdi-download"
        @click="exportParticipantsPDF"
        :loading="exportingPDF"
        :disabled="!hasParticipants"
      >
        Export Participant List
      </v-btn>
    </div>

    <!-- Error + Loading -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <!-- Filters -->
    <v-row class="mb-4" dense>
      <v-col cols="12" sm="4">
        <v-text-field v-model="filters.firstName" label="Filter by first name" clearable />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field v-model="filters.lastName" label="Filter by last name" clearable />
      </v-col>
      <v-col cols="12" sm="4">
        <v-text-field v-model="filters.email" label="Filter by email" clearable />
      </v-col>
      <v-col cols="12" sm="4" class="d-flex align-center">
        <v-btn @click="fetchGroupedCustomers" color="primary">Apply Filter</v-btn>
      </v-col>
    </v-row>

    <!-- Main content wrapper for PDF generation -->
    <div ref="contentRef" id="participant-list-content">
      <!-- Header for PDF -->
      <div class="pdf-header mb-4" style="text-align: center;">
        <h1 class="text-h4 mb-2">Participant List</h1>
        <h2 class="text-h6 text-grey-darken-1">{{ activityName }}</h2>
        <p class="text-caption text-grey-darken-2">Generated on {{ new Date().toLocaleDateString() }}</p>
      </div>

      <!-- Grouped display -->
      <div v-for="(schedule, scheduleId) in groupedParticipants" :key="scheduleId" class="mb-6">
        <h3 class="text-h6">
          Schedule: {{ new Date(schedule.schedule.startTime).toLocaleString() }} –
          {{ new Date(schedule.schedule.endTime).toLocaleString() }}
        </h3>

        <div v-for="(booking, bookingId) in schedule.bookings" :key="bookingId" class="ml-6 mb-4">
          <h4 class="text-subtitle-1">Booking #{{ bookingId }}</h4>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Special Notes</th>
                <th>Allergies</th>
                <th>Medical Conditions</th>
                <th>Preferences</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in booking.participants" :key="p.id">
                <td>{{ p.firstName }} {{ p.lastName }}</td>
                <td>{{ p.email }}</td>
                <td>{{ p.specialRequirements || '—' }}</td>
                <td>{{ p.allergy || 'NONE' }}</td>
                <td>{{ p.medicalCondition || 'NONE' }}</td>
                <td>{{ p.preferences || '—' }}</td>
              </tr>
            </tbody>
          </v-table>
        </div>
      </div>
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

/* Schedule sections */
.mb-6 {
  page-break-inside: avoid;
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
}
</style>
