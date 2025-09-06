<template>
  <v-container class="py-8">
    <h2 class="text-h5 mb-6">{{ activityName }} Customers</h2>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-data-table
      :headers="headers"
      :items="customers"
      class="elevation-1"
      dense
    >
      <template #item.attendance="{ item }">
        {{ item.attendance ? 'Y' : 'N' }}
      </template>
      <template #item.registrationTime="{ item }">
        {{ new Date(item.registrationTime).toLocaleString() }}
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import axios from '@/utils/axiosInstance'

const route = useRoute()
const activityId = route.params.activityId

const activityName = ref('Activity')
const customers = ref([])
const loading = ref(false)
const error = ref('')

const headers = [
  { title: 'Activity Booking ID', key: 'activityBookingId' },
  { title: 'Name', key: 'name' },
  { title: 'Contact Info', key: 'contactInfo' },
  { title: 'Special Notes', key: 'specialNotes' },
  { title: 'Allergies', key: 'allergies' },
  { title: 'Physical Limitations', key: 'limitations' },
  { title: 'Preferences', key: 'preferences' },
  { title: 'Registration Status', key: 'registrationStatus' },
  { title: 'Attendance', key: 'attendance' },
  { title: 'Registration Time', key: 'registrationTime' }
]

async function fetchCustomers() {
  loading.value = true
  try {
    const { data } = await axios.get(`/activities/participants/activity/${activityId}`)
    customers.value = data.map(p => ({
      activityBookingId: p.activity_booking_id,
      name: `${p.firstName} ${p.lastName}`,
      contactInfo: p.email,
      specialNotes: p.specialRequirements,
      allergies: p.allergy,
      limitations: p.medicalCondition,
      preferences: p.preferences,
      registrationStatus: p.isCancelled ? 'Cancelled' : 'Active',
      attendance: p.attended,
      registrationTime: p.createdAt
    }))
    if (data.length > 0 && data[0].activityName) {
      activityName.value = data[0].activityName
    }
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load customers'
  } finally {
    loading.value = false
  }
}

onMounted(fetchCustomers)
</script>
