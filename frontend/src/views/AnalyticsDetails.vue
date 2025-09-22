<template>
  <v-container class="py-8">
    <h2 class="text-h5 mb-6">Analytics for {{ activity?.name || 'Activity' }}</h2>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </v-alert>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

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
        <BarChart :chart-data="barChartData" />
      </v-col>

      <v-col cols="12" md="6">
        <PieChart :chart-data="pieChartData" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/utils/axiosInstance'
import BarChart from '@/components/Charts/BarChart.vue'
import PieChart from '@/components/Charts/PieChart.vue'

const route = useRoute()
const activityId = route.params.activityId
const analyticsId = route.params.analyticsId

const analytics = ref(null)
const activity = ref(null)
const loading = ref(false)
const error = ref('')

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

onMounted(fetchAnalytics)
</script>
