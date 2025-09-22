<template>
  <v-container class="py-8">
    <h2 class="text-h5 mb-6">{{ activityName }} Reviews</h2>

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
      <v-col cols="12" class="d-flex justify-end">
        <v-btn @click="fetchGroupedReviews" color="primary">Apply Filter</v-btn>
      </v-col>
    </v-row>

    <!-- Grouped reviews -->
    <div v-for="(schedule, scheduleId) in groupedReviews" :key="scheduleId" class="mb-6">
      <h3 class="text-h6">
        Schedule:
        {{ new Date(schedule.schedule.startTime).toLocaleString() }} –
        {{ new Date(schedule.schedule.endTime).toLocaleString() }}
      </h3>

      <div
        v-for="(booking, bookingId) in schedule.bookings"
        :key="bookingId"
        class="ml-6 mb-4"
      >
        <h4 class="text-subtitle-1">Booking #{{ bookingId }}</h4>
        <v-table density="compact">
          <thead>
            <tr>
              <th>User</th>
              <th>Overall</th>
              <th>Organization</th>
              <th>Guide</th>
              <th>Value</th>
              <th>Safety</th>
              <th>Fun</th>
              <th>Would Revisit</th>
              <th>Comment</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in booking.reviews" :key="r.id">
              <td>{{ r.user?.name }} {{ r.user?.surname }} ({{ r.user?.email }})</td>
              <td>{{ r.overallRating }}/5</td>
              <td>{{ r.organizationRating }}/5</td>
              <td>{{ r.guideRating }}/5</td>
              <td>{{ r.valueForMoneyRating }}/5</td>
              <td>{{ r.safetyRating }}/5</td>
              <td>{{ r.funRating }}/5</td>
              <td>{{ r.wouldRevisit ? 'Yes' : 'No' }}</td>
              <td>{{ r.comment }}</td>
              <td>{{ new Date(r.createdAt).toLocaleString() }}</td>
            </tr>
          </tbody>
        </v-table>
      </div>
    </div>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/utils/axiosInstance'

const route = useRoute()
const activityId = route.params.activityId

const activityName = ref('Activity')
const groupedReviews = ref({})
const loading = ref(false)
const error = ref('')
const filters = reactive({ firstName: '', lastName: '', email: '' })

async function fetchGroupedReviews() {
  loading.value = true
  try {
    const { data } = await axios.get(`/activities/reviews/activity/${activityId}/grouped`, {
      params: {
        firstName: filters.firstName || undefined,
        lastName: filters.lastName || undefined,
        email: filters.email || undefined
      }
    })
    groupedReviews.value = data

    // optional: set activity name from first schedule if backend provides it
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
