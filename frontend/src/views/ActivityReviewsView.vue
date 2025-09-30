<template>
  <v-container class="reviews-container" fluid>
    <!-- Header Section with Warm Gradient -->
    <div class="reviews-header">
      <div class="reviews-header-content">
        <div class="header-main">
          <div class="header-icon">
            <v-icon size="48" color="white">mdi-star</v-icon>
          </div>
          <div>
            <h1 class="reviews-title font-heading">{{ activityName }} Reviews</h1>
            <p class="reviews-subtitle">Comprehensive review analysis and export</p>
          </div>
        </div>
        
        <div class="header-actions">
          <!-- Export PDF Button -->
          <v-btn 
            color="white" 
            variant="elevated"
            prepend-icon="mdi-download"
            @click="exportReviewsPDF"
            :loading="exportingPDF"
            :disabled="!hasReviews"
            class="export-btn"
          >
            Export Reviews Report
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

      <!-- Summary Statistics -->
      <v-row class="stats-row" v-if="reviewStats">
        <v-col cols="12" sm="6" md="3">
          <v-card class="modern-card stats-card stats-card--primary">
            <v-card-text class="pa-6 text-center">
              <div class="stats-icon">
                <v-icon size="32" color="primary">mdi-format-list-numbered</v-icon>
              </div>
              <div class="stats-number">{{ reviewStats.totalReviews }}</div>
              <div class="stats-label">Total Reviews</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="modern-card stats-card stats-card--success">
            <v-card-text class="pa-6 text-center">
              <div class="stats-icon">
                <v-icon size="32" color="success">mdi-star</v-icon>
              </div>
              <div class="stats-number">{{ reviewStats.averageRating.toFixed(1) }}</div>
              <div class="stats-label">Average Rating</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="modern-card stats-card stats-card--warning">
            <v-card-text class="pa-6 text-center">
              <div class="stats-icon">
                <v-icon size="32" color="warning">mdi-heart</v-icon>
              </div>
              <div class="stats-number">{{ reviewStats.wouldRevisitCount }}</div>
              <div class="stats-label">Would Revisit</div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-card class="modern-card stats-card stats-card--info">
            <v-card-text class="pa-6 text-center">
              <div class="stats-icon">
                <v-icon size="32" color="info">mdi-comment-text</v-icon>
              </div>
              <div class="stats-number">{{ reviewStats.withCommentsCount }}</div>
              <div class="stats-label">With Comments</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Filters -->
      <v-card class="modern-card filters-card">
        <v-card-text class="pa-6">
          <div class="filters-header">
            <v-icon color="primary" size="24">mdi-filter-variant</v-icon>
            <h3 class="filters-title">Filter Reviews</h3>
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
            <v-col cols="12" sm="4">
              <v-select
                v-model="filters.minRating"
                :items="ratingOptions"
                label="Minimum rating (real-time filter)"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-star"
                class="filter-field"
                clearable
                hint="Filters reviews instantly without server request"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" sm="4" class="d-flex align-center">
              <v-btn 
                @click="fetchGroupedReviews" 
                color="primary"
                variant="elevated"
                class="apply-filter-btn"
                prepend-icon="mdi-magnify"
              >
                Apply Name/Email Filter
              </v-btn>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Main content wrapper for PDF generation -->
      <v-card class="modern-card reviews-content-card">
        <v-card-text class="pa-6">
          <div ref="contentRef" id="reviews-content">
            <!-- Header for PDF -->
            <div class="pdf-header" style="text-align: center;">
              <h1 class="pdf-title">Activity Reviews Report</h1>
              <h2 class="pdf-subtitle">{{ activityName }}</h2>
              <p class="pdf-date">Generated on {{ new Date().toLocaleDateString() }}</p>
              
              <!-- PDF Stats Summary -->
              <div v-if="reviewStats" class="pdf-stats">
                <div class="pdf-stats-grid">
                  <div class="pdf-stat-item">
                    <div class="pdf-stat-number">{{ reviewStats.totalReviews }}</div>
                    <div class="pdf-stat-label">Total Reviews</div>
                  </div>
                  <div class="pdf-stat-item">
                    <div class="pdf-stat-number">{{ reviewStats.averageRating.toFixed(1) }}/5</div>
                    <div class="pdf-stat-label">Average Rating</div>
                  </div>
                  <div class="pdf-stat-item">
                    <div class="pdf-stat-number">{{ reviewStats.wouldRevisitCount }}</div>
                    <div class="pdf-stat-label">Would Revisit</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Grouped reviews -->
            <div v-for="(schedule, scheduleId) in filteredReviews" :key="scheduleId" class="schedule-section">
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
                
                <div class="reviews-table-wrapper">
                  <v-table density="compact" class="review-table modern-table">
                    <thead>
                      <tr class="table-header">
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
                          <div class="reviewer-name">{{ r.user?.name }} {{ r.user?.surname }}</div>
                          <div class="reviewer-email">{{ r.user?.email }}</div>
                        </td>
                        <td class="text-center">
                          <v-chip
                            :color="getRatingColor(r.overallRating)"
                            size="small"
                            variant="tonal"
                            class="rating-chip"
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
                            color="warning"
                          />
                        </td>
                        <td class="text-center">
                          <v-rating
                            :model-value="r.guideRating"
                            readonly
                            density="compact"
                            size="16"
                            color="warning"
                          />
                        </td>
                        <td class="text-center">
                          <v-rating
                            :model-value="r.valueForMoneyRating"
                            readonly
                            density="compact"
                            size="16"
                            color="warning"
                          />
                        </td>
                        <td class="text-center">
                          <v-rating
                            :model-value="r.safetyRating"
                            readonly
                            density="compact"
                            size="16"
                            color="warning"
                          />
                        </td>
                        <td class="text-center">
                          <v-rating
                            :model-value="r.funRating"
                            readonly
                            density="compact"
                            size="16"
                            color="warning"
                          />
                        </td>
                        <td class="text-center">
                          <v-icon 
                            :color="r.wouldRevisit ? 'success' : 'error'"
                            size="20"
                            class="revisit-icon"
                          >
                            {{ r.wouldRevisit ? 'mdi-check-circle' : 'mdi-close-circle' }}
                          </v-icon>
                        </td>
                        <td class="comment-cell">
                          <div v-if="r.comment" class="comment-text">{{ r.comment }}</div>
                          <div v-else class="no-comment">No comment</div>
                        </td>
                        <td class="text-center date-cell">
                          {{ new Date(r.createdAt).toLocaleDateString() }}
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
.reviews-container {
  background: linear-gradient(135deg, var(--warm-orange) 0%, var(--warm-amber) 100%);
  min-height: 100vh;
  padding: 0;
}

/* Header Styling */
.reviews-header {
  background: linear-gradient(135deg, var(--warm-orange) 0%, var(--warm-amber) 100%);
  color: white;
  padding: 2rem;
  margin: -24px -24px 2rem -24px;
}

.reviews-header-content {
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

.reviews-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.reviews-subtitle {
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

/* Stats Cards */
.stats-row {
  margin-bottom: 2rem;
}

.stats-card {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stats-card:hover {
  transform: translateY(-4px);
}

.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--warm-orange);
}

.stats-card--primary::before {
  background: var(--warm-orange);
}

.stats-card--success::before {
  background: #4caf50;
}

.stats-card--warning::before {
  background: #ff9800;
}

.stats-card--info::before {
  background: #2196f3;
}

.stats-icon {
  margin-bottom: 1rem;
}

.stats-number {
  font-size: 3rem;
  font-weight: 700;
  color: var(--warm-orange);
  line-height: 1;
  margin-bottom: 0.5rem;
}

.stats-label {
  font-size: 1rem;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

/* Reviews Content Card */
.reviews-content-card {
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

.pdf-stats {
  margin-top: 1.5rem;
}

.pdf-stats-grid {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.pdf-stat-item {
  text-align: center;
  min-width: 120px;
}

.pdf-stat-number {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--warm-orange);
}

.pdf-stat-label {
  font-size: 0.9rem;
  color: #666;
  margin-top: 0.25rem;
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

/* Reviews Table */
.reviews-table-wrapper {
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

.review-row {
  transition: all 0.2s ease;
}

.review-row:hover {
  background: rgba(212, 115, 10, 0.05);
}

.review-row td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid #f0f0f0;
  vertical-align: top;
}

/* Table Cell Styling */
.reviewer-cell {
  min-width: 180px;
  max-width: 200px;
}

.reviewer-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
}

.reviewer-email {
  font-size: 0.85rem;
  color: #666;
}

.rating-chip {
  font-weight: 600;
}

.revisit-icon {
  opacity: 0.8;
}

.comment-cell {
  min-width: 200px;
  max-width: 300px;
  word-wrap: break-word;
}

.comment-text {
  font-size: 0.9rem;
  line-height: 1.4;
  color: #333;
}

.no-comment {
  font-size: 0.85rem;
  color: #999;
  font-style: italic;
}

.date-cell {
  min-width: 100px;
  font-size: 0.85rem;
  color: #666;
}

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

/* Rating stars in PDF */
.v-rating {
  justify-content: center;
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

/* Responsive design */
@media (max-width: 768px) {
  .reviews-header-content {
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

  .pdf-stats-grid {
    flex-direction: column;
    gap: 1rem;
  }

  .schedule-section {
    margin-bottom: 2rem;
  }

  .booking-section {
    margin-left: 1rem;
  }

  .reviewer-cell,
  .comment-cell {
    min-width: unset;
    max-width: unset;
  }
  
  .review-table {
    font-size: 11px;
  }

  .table-header th {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }

  .review-row td {
    padding: 0.75rem 0.5rem;
  }
}
</style>
