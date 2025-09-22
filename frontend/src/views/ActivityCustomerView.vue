<template>
  <v-container class="py-8">
    <h2 class="text-h5 mb-6">{{ activityName }} Customers</h2>

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
              <th>Limitations</th>
              <th>Preferences</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in booking.participants" :key="p.id">
              <td>{{ p.firstName }} {{ p.lastName }}</td>
              <td>{{ p.email }}</td>
              <td>{{ p.specialRequirements }}</td>
              <td>{{ p.allergy }}</td>
              <td>{{ p.medicalCondition }}</td>
              <td>{{ p.preferences }}</td>
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
const groupedParticipants = ref({})
const loading = ref(false)
const error = ref('')
const filters = reactive({ firstName: '', lastName: '', email: '' })


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
