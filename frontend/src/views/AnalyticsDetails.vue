<template>
  <v-container class="py-8">
    <div class="d-flex align-center justify-space-between mb-6">
      <h2 class="text-h5">Analytics for {{ activity?.name || 'Activity' }}</h2>
      
      <!-- Download PDF Button -->
      <v-btn 
        color="primary" 
        variant="elevated"
        prepend-icon="mdi-download"
        @click="downloadPDF"
        :loading="generatingPDF"
      >
        Download PDF
      </v-btn>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <!-- Main content wrapper for PDF generation -->
    <div ref="contentRef" id="analytics-content">
      <!-- Header for PDF -->
      <div class="pdf-header mb-4" style="text-align: center;">
        <h1 class="text-h4 mb-2">Activity Analytics Report</h1>
        <h2 class="text-h6 text-grey-darken-1">{{ activity?.name || 'Activity' }}</h2>
        <p class="text-caption text-grey-darken-2">Generated on {{ new Date().toLocaleDateString() }}</p>
      </div>

      <v-row v-if="analytics">
        <!-- Summary cards -->
        <v-col cols="12" md="3">
          <v-card class="pa-4">
            <div class="text-h6">Participants</div>
            <div class="text-h5 font-weight-bold">{{ analytics.numberOfParticipants }}</div>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="pa-4">
            <div class="text-h6">Income (€)</div>
            <div class="text-h5 font-weight-bold">{{ analytics.fullIncome }}</div>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="pa-4">
            <div class="text-h6">Profits (€)</div>
            <div class="text-h5 font-weight-bold">{{ analytics.profits }}</div>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="pa-4">
            <div class="text-h6">Reviews</div>
            <div class="text-h5 font-weight-bold">{{ analytics.numberOfReviews }}</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts -->
      <v-row class="mt-6">
        <v-col cols="12" md="6">
          <v-card class="pa-4">
            <h3 class="text-h6 mb-4">Rating Analytics</h3>
            <BarChart :chart-data="barChartData" />
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card class="pa-4">
            <h3 class="text-h6 mb-4">Booking Status Distribution</h3>
            <PieChart :chart-data="pieChartData" />
          </v-card>
        </v-col>
      </v-row>

      <!-- Additional Analytics Tables for PDF -->
      <v-row class="mt-6" v-if="analytics">
        <v-col cols="12">
          <v-card class="pa-4">
            <h3 class="text-h6 mb-4">Detailed Metrics</h3>
            <v-table>
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Total Participants</td>
                  <td>{{ analytics.numberOfParticipants || 0 }}</td>
                </tr>
                <tr>
                  <td>Total Income</td>
                  <td>€{{ analytics.fullIncome || 0 }}</td>
                </tr>
                <tr>
                  <td>Total Profits</td>
                  <td>€{{ analytics.profits || 0 }}</td>
                </tr>
                <tr>
                  <td>Number of Reviews</td>
                  <td>{{ analytics.numberOfReviews || 0 }}</td>
                </tr>
                <tr>
                  <td>Average Overall Rating</td>
                  <td>{{ (analytics.averageOverallRating || 0).toFixed(1) }}/5</td>
                </tr>
                <tr>
                  <td>Average Guide Rating</td>
                  <td>{{ (analytics.averageGuideRating || 0).toFixed(1) }}/5</td>
                </tr>
                <tr>
                  <td>Average Safety Rating</td>
                  <td>{{ (analytics.averageSafetyRating || 0).toFixed(1) }}/5</td>
                </tr>
                <tr>
                  <td>Revisiting Rate</td>
                  <td>{{ ((analytics.revisitingRate || 0) * 100).toFixed(1) }}%</td>
                </tr>
                <tr>
                  <td>Cancellation Rate</td>
                  <td>{{ ((analytics.cancellationRate || 0) * 100).toFixed(1) }}%</td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Success/Error Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/utils/axiosInstance'
import BarChart from '@/components/Charts/BarChart.vue'
import PieChart from '@/components/Charts/PieChart.vue'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const route = useRoute()
const activityId = route.params.activityId
const analyticsId = route.params.analyticsId

const analytics = ref(null)
const activity = ref(null)
const loading = ref(false)
const error = ref('')
const generatingPDF = ref(false)
const contentRef = ref(null)

// Snackbar for notifications
const snackbar = ref({
  show: false,
  message: '',
  color: 'success'
})

const barChartData = ref({
  labels: ['Overall', 'Guide', 'Safety'],
  datasets: [
    {
      label: 'Ratings',
      data: [4.2, 3.8, 4.5], // Sample data to test if charts work
      backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726'],
    },
  ],
})

const pieChartData = ref({
  labels: ['Revisiting', 'Cancelled', 'Other'],
  datasets: [
    {
      label: 'Rates',
      data: [65, 20, 15], // Sample data to test if charts work
      backgroundColor: ['#29B6F6', '#EF5350', '#AB47BC'],
    },
  ],
})

/**
 * Download analytics as PDF
 */
async function downloadPDF() {
  generatingPDF.value = true
  
  try {
    // Wait for any pending renders
    await nextTick()
    
    // Get the content element
    const element = contentRef.value || document.getElementById('analytics-content')
    
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
    const activityName = activity.value?.name || 'Activity'
    const date = new Date().toISOString().split('T')[0]
    const filename = `${activityName}_Analytics_${date}.pdf`

    // Save the PDF
    pdf.save(filename)

    // Show success message
    showSnackbar('PDF downloaded successfully!', 'success')

  } catch (error) {
    console.error('PDF generation error:', error)
    showSnackbar('Failed to generate PDF. Please try again.', 'error')
  } finally {
    generatingPDF.value = false
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
 * Fetch activity details
 */
async function fetchActivity() {
  if (!activityId) return
  
  try {
    const { data } = await axios.get(`/activities/${activityId}`)
    activity.value = data
  } catch (e) {
    console.error('Failed to fetch activity details:', e)
  }
}

async function fetchAnalytics() {
  loading.value = true
  error.value = ''
  
  // Test different possible endpoints
  const possibleEndpoints = [
    `/activities/analytics/${analyticsId}`,
    `/activity-analytics/${analyticsId}`,
    `/analytics/${analyticsId}`
  ]
  
  for (const endpoint of possibleEndpoints) {
    try {
      console.log('Trying endpoint:', endpoint)
      const { data } = await axios.get(endpoint)
      console.log('Success with endpoint:', endpoint, 'Data:', data)
      analytics.value = data

      // Update charts with real data
      barChartData.value = {
        labels: ['Overall', 'Guide', 'Safety'],
        datasets: [
          {
            label: 'Ratings',
            data: [
              data.averageOverallRating || 0,
              data.averageGuideRating || 0,
              data.averageSafetyRating || 0,
            ],
            backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726'],
          },
        ],
      }

      pieChartData.value = {
        labels: ['Revisiting', 'Cancelled', 'Other'],
        datasets: [
          {
            label: 'Rates (%)',
            data: [
              (data.revisitingRate || 0) * 100,
              (data.cancellationRate || 0) * 100,
              100 - ((data.revisitingRate || 0) * 100) - ((data.cancellationRate || 0) * 100),
            ],
            backgroundColor: ['#29B6F6', '#EF5350', '#AB47BC'],
          },
        ],
      }
      
      loading.value = false
      return // Success, exit the function
    } catch (e) {
      console.log('Failed with endpoint:', endpoint, 'Error:', e.response?.status, e.response?.data)
      continue // Try next endpoint
    }
  }
  
  // If we get here, all endpoints failed
  console.error('All analytics endpoints failed')
  error.value = 'Analytics service is not available. The backend analytics API endpoint may not be configured.'
  
  // Show sample data so charts aren't empty
  console.log('Using fallback sample data')
  barChartData.value = {
    labels: ['Overall', 'Guide', 'Safety'],
    datasets: [
      {
        label: 'Ratings (Sample)',
        data: [4.2, 3.8, 4.5],
        backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726'],
      },
    ],
  }

  pieChartData.value = {
    labels: ['Revisiting', 'Cancelled', 'Other'],
    datasets: [
      {
        label: 'Rates (Sample) %',
        data: [65, 20, 15],
        backgroundColor: ['#29B6F6', '#EF5350', '#AB47BC'],
      },
    ],
  }
  
  loading.value = false
}

onMounted(async () => {
  await fetchActivity()
  await fetchAnalytics()
})
</script>

<style scoped>
/* PDF-specific styling */
.pdf-header {
  page-break-inside: avoid;
}

#analytics-content {
  font-family: 'Roboto', sans-serif;
}

/* Ensure proper spacing for PDF */
.v-card {
  margin-bottom: 16px;
  page-break-inside: avoid;
}

/* Chart containers */
.v-col:has(.v-card) {
  page-break-inside: avoid;
}

/* Table styling for PDF */
.v-table {
  border-collapse: collapse;
}

.v-table th,
.v-table td {
  border: 1px solid #e0e0e0;
  padding: 12px;
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
  
  .v-card {
    box-shadow: none !important;
    border: 1px solid #e0e0e0;
  }
}
</style>
