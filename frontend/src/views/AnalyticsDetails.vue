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
      data: [0, 0, 0],
      backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726'],
    },
  ],
})

const pieChartData = ref({
  labels: ['Revisiting', 'Cancelled', 'Other'],
  datasets: [
    {
      label: 'Rates',
      data: [0, 0, 0],
      backgroundColor: ['#29B6F6', '#EF5350', '#AB47BC'],
    },
  ],
})


async function fetchAnalytics() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await axios.get(`/activities/analytics/${analyticsId}`)
    analytics.value = data

    // mock update charts from backend data
    barChartData.value.datasets[0].data = [
      data.averageOverallRating || 0,
      data.averageGuideRating || 0,
      data.averageSafetyRating || 0,
    ]

    pieChartData.value.datasets[0].data = [
      data.revisitingRate || 0,
      data.cancellationRate || 0,
      100 - (data.revisitingRate || 0) - (data.cancellationRate || 0),
    ]
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load analytics'
  } finally {
    loading.value = false
  }
}

onMounted(fetchAnalytics)
</script>
