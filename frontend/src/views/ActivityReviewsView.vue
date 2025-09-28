<template>
  <v-container class="py-8">
    <div class="d-flex align-center justify-space-between mb-6">
      <h2 class="text-h5">{{ activityName }} Reviews</h2>
      
      <!-- Export PDF Button -->
      <v-btn 
        color="primary" 
        variant="elevated"
        prepend-icon="mdi-download"
        @click="exportReviewsPDF"
        :loading="exportingPDF"
        :disabled="!hasReviews"
      >
        Export Reviews Report
      </v-btn>
    </div>

    <!-- Error + Loading -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <!-- Summary Statistics -->
    <v-row class="mb-6" v-if="reviewStats">
      <v-col cols="12" sm="6" md="3">
        <v-card class="text-center pa-4" color="primary" variant="tonal">
          <div class="text-h4 font-weight-bold">{{ reviewStats.totalReviews }}</div>
          <div class="text-caption">Total Reviews</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="text-center pa-4" color="success" variant="tonal">
          <div class="text-h4 font-weight-bold">{{ reviewStats.averageRating.toFixed(1) }}</div>
          <div class="text-caption">Average Rating</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="text-center pa-4" color="warning" variant="tonal">
          <div class="text-h4 font-weight-bold">{{ reviewStats.wouldRevisitCount }}</div>
          <div class="text-caption">Would Revisit</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="text-center pa-4" color="info" variant="tonal">
          <div class="text-h4 font-weight-bold">{{ reviewStats.withCommentsCount }}</div>
          <div class="text-caption">With Comments</div>
        </v-card>
      </v-col>
    </v-row>

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
      <v-col cols="12" sm="4">
        <v-select
          v-model="filters.minRating"
          :items="ratingOptions"
          label="Minimum rating (real-time filter)"
          clearable
          hint="Filters reviews instantly without server request"
          persistent-hint
        />
      </v-col>
      <v-col cols="12" sm="4" class="d-flex align-center">
        <v-btn @click="fetchGroupedReviews" color="primary">Apply Name/Email Filter</v-btn>
      </v-col>
    </v-row>

    <!-- Main content wrapper for PDF generation -->
    <div ref="contentRef" id="reviews-content">
      <!-- Header for PDF -->
      <div class="pdf-header mb-4" style="text-align: center;">
        <h1 class="text-h4 mb-2">Activity Reviews Report</h1>
        <h2 class="text-h6 text-grey-darken-1">{{ activityName }}</h2>
        <p class="text-caption text-grey-darken-2">Generated on {{ new Date().toLocaleDateString() }}</p>
        
        <!-- PDF Stats Summary -->
        <div v-if="reviewStats" class="mt-4 mb-4">
          <div class="d-flex justify-center gap-4">
            <div class="text-center">
              <div class="font-weight-bold">{{ reviewStats.totalReviews }}</div>
              <div class="text-caption">Total Reviews</div>
            </div>
            <div class="text-center">
              <div class="font-weight-bold">{{ reviewStats.averageRating.toFixed(1) }}/5</div>
              <div class="text-caption">Average Rating</div>
            </div>
            <div class="text-center">
              <div class="font-weight-bold">{{ reviewStats.wouldRevisitCount }}</div>
              <div class="text-caption">Would Revisit</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Grouped reviews -->
      <div v-for="(schedule, scheduleId) in filteredReviews" :key="scheduleId" class="mb-6">
        <h3 class="text-h6 mb-3">
          Schedule: {{ new Date(schedule.schedule.startTime).toLocaleString() }} –
          {{ new Date(schedule.schedule.endTime).toLocaleString() }}
        </h3>

        <div v-for="(booking, bookingId) in schedule.bookings" :key="bookingId" class="ml-6 mb-4">
          <h4 class="text-subtitle-1 mb-2">Booking #{{ bookingId }}</h4>
          <v-table density="compact" class="review-table">
            <thead>
              <tr>
                <th class="text-left">Reviewer</th>
                <th class="text-center">Overall</th>
                <th class="text-center">Organization</th>
                <th class="text-center">Guide</th>
                <th class="text-center">Value</th>
                <th class="text-center">Safety</th>
                <th class="text-center">Fun</th>
                <th class="text-center">Revisit</th>
                <th class="text-left">Comment</th>
                <th class="text-center">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in booking.reviews" :key="r.id" class="review-row">
                <td class="reviewer-cell">
                  <div class="font-weight-medium">{{ r.user?.name }} {{ r.user?.surname }}</div>
                  <div class="text-caption text-grey-darken-1">{{ r.user?.email }}</div>
                </td>
                <td class="text-center">
                  <v-chip
                    :color="getRatingColor(r.overallRating)"
                    size="small"
                    variant="tonal"
                  >
                    {{ r.overallRating }}/5
                  </v-chip>
                </td>
                <td class="text-center">
                  <v-rating
                    :model-value="r.organizationRating"
                    readonly
                    density="compact"
                    size="16"
                  />
                </td>
                <td class="text-center">
                  <v-rating
                    :model-value="r.guideRating"
                    readonly
                    density="compact"
                    size="16"
                  />
                </td>
                <td class="text-center">
                  <v-rating
                    :model-value="r.valueForMoneyRating"
                    readonly
                    density="compact"
                    size="16"
                  />
                </td>
                <td class="text-center">
                  <v-rating
                    :model-value="r.safetyRating"
                    readonly
                    density="compact"
                    size="16"
                  />
                </td>
                <td class="text-center">
                  <v-rating
                    :model-value="r.funRating"
                    readonly
                    density="compact"
                    size="16"
                  />
                </td>
                <td class="text-center">
                  <v-icon 
                    :color="r.wouldRevisit ? 'success' : 'error'"
                    size="20"
                  >
                    {{ r.wouldRevisit ? 'mdi-check' : 'mdi-close' }}
                  </v-icon>
                </td>
                <td class="comment-cell">
                  <div v-if="r.comment" class="text-body-2">{{ r.comment }}</div>
                  <div v-else class="text-caption text-grey-darken-1 font-italic">No comment</div>
                </td>
                <td class="text-center text-caption">
                  {{ new Date(r.createdAt).toLocaleDateString() }}
                </td>
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
const groupedReviews = ref({})
const loading = ref(false)
const error = ref('')
const exportingPDF = ref(false)
const contentRef = ref(null)
const filters = reactive({ 
  firstName: '', 
  lastName: '', 
  email: '', 
  minRating: null 
})

// Rating options for filter
const ratingOptions = [
  { title: '5 Stars', value: 5 },
  { title: '4+ Stars', value: 4 },
  { title: '3+ Stars', value: 3 },
  { title: '2+ Stars', value: 2 },
  { title: '1+ Stars', value: 1 }
]

// Snackbar for notifications
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

// Computed property for filtered reviews (client-side filtering)
const filteredReviews = computed(() => {
  if (!filters.minRating) return groupedReviews.value
  
  const filtered = {}
  
  Object.entries(groupedReviews.value).forEach(([scheduleId, schedule]) => {
    const filteredBookings = {}
    
    Object.entries(schedule.bookings).forEach(([bookingId, booking]) => {
      const filteredReviewsInBooking = booking.reviews.filter(review => 
        review.overallRating >= filters.minRating
      )
      
      if (filteredReviewsInBooking.length > 0) {
        filteredBookings[bookingId] = {
          ...booking,
          reviews: filteredReviewsInBooking
        }
      }
    })
    
    if (Object.keys(filteredBookings).length > 0) {
      filtered[scheduleId] = {
        ...schedule,
        bookings: filteredBookings
      }
    }
  })
  
  return filtered
})

// Computed property to check if there are reviews
const hasReviews = computed(() => {
  return Object.keys(filteredReviews.value).length > 0
})

// Computed property for review statistics (based on filtered reviews)
const reviewStats = computed(() => {
  const allReviews = []
  
  Object.values(filteredReviews.value).forEach(schedule => {
    Object.values(schedule.bookings).forEach(booking => {
      allReviews.push(...booking.reviews)
    })
  })
  
  if (allReviews.length === 0) return null
  
  const totalReviews = allReviews.length
  const averageRating = allReviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews
  const wouldRevisitCount = allReviews.filter(r => r.wouldRevisit).length
  const withCommentsCount = allReviews.filter(r => r.comment && r.comment.trim()).length
  
  return {
    totalReviews,
    averageRating,
    wouldRevisitCount,
    withCommentsCount
  }
})

/**
 * Get color for rating chip based on rating value
 */
function getRatingColor(rating) {
  if (rating >= 4.5) return 'success'
  if (rating >= 3.5) return 'warning'
  if (rating >= 2.5) return 'orange'
  return 'error'
}

/**
 * Export reviews as PDF
 */
async function exportReviewsPDF() {
  exportingPDF.value = true
  
  try {
    // Wait for any pending renders
    await nextTick()
    
    // Get the content element
    const element = contentRef.value || document.getElementById('reviews-content')
    
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
    const filename = `${activityName.value}_Reviews_${date}.pdf`

    // Save the PDF
    pdf.save(filename)

    // Show success message
    showSnackbar('Reviews report exported successfully!', 'success')

  } catch (error) {
    console.error('PDF generation error:', error)
    showSnackbar('Failed to export reviews report. Please try again.', 'error')
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

async function fetchGroupedReviews() {
  loading.value = true
  try {
    const { data } = await axios.get(`/activities/reviews/activity/${activityId}/grouped`, {
      params: {
        firstName: filters.firstName || undefined,
        lastName: filters.lastName || undefined,
        email: filters.email || undefined
        // Remove minRating from backend request - we'll filter client-side
      }
    })
    groupedReviews.value = data

    const firstSchedule = Object.values(data)[0]
    if (firstSchedule?.schedule?.activityName) {
      activityName.value = firstSchedule.schedule.activityName
    }
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load reviews'
  } finally {
    loading.value = false
  }
}

onMounted(fetchGroupedReviews)
</script>

<style scoped>
/* PDF-specific styling */
.pdf-header {
  page-break-inside: avoid;
}

#reviews-content {
  font-family: 'Roboto', sans-serif;
}

/* Ensure proper spacing for PDF */
.review-table {
  margin-bottom: 16px;
  page-break-inside: avoid;
  border-collapse: collapse;
}

.review-table th,
.review-table td {
  border: 1px solid #e0e0e0;
  padding: 8px;
}

.review-table th {
  background-color: #f5f5f5;
  font-weight: bold;
  font-size: 14px;
}

.review-table td {
  font-size: 12px;
}

/* Custom table cell styles */
.reviewer-cell {
  min-width: 180px;
  max-width: 200px;
}

.comment-cell {
  min-width: 200px;
  max-width: 300px;
  word-wrap: break-word;
}

.review-row:hover {
  background-color: #f8f9fa;
}

/* Schedule sections */
.mb-6 {
  page-break-inside: avoid;
}

/* Rating stars in PDF */
.v-rating {
  justify-content: center;
}

/* Statistics cards */
.gap-4 {
  gap: 16px;
}

/* Print-specific styles */
@media print {
  .v-btn {
    display: none !important;
  }
  
  .pdf-header {
    margin-bottom: 30px;
  }
  
  .review-table {
    box-shadow: none !important;
    border: 1px solid #e0e0e0;
  }
  
  .v-chip {
    background-color: #f0f0f0 !important;
    color: #333 !important;
  }
  
  .v-rating .v-icon {
    color: #333 !important;
  }
}

/* Responsive design improvements */
@media (max-width: 768px) {
  .reviewer-cell,
  .comment-cell {
    min-width: unset;
    max-width: unset;
  }
  
  .review-table {
    font-size: 11px;
  }
}
</style>
