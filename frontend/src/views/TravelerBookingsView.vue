<template>
  <v-container class="py-8">
    <h2 class="text-h5 mb-6">My Arrangement Bookings</h2>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-card
      v-for="b in arrangementBookings"
      :key="b.id"
      class="mb-4 pa-4"
      variant="outlined"
      @click="goToActivities(b.id)"
      style="cursor: pointer"
    >
      <div class="d-flex justify-space-between align-center">
        <div>
          <div class="text-subtitle-1 font-weight-bold">
            {{ b.departure?.arrangement?.title }}
          </div>
          <div class="text-body-2">
            {{ formatDate(b.departure?.startDate) }} →
            {{ formatDate(b.departure?.endDate) }}
          </div>
          <div class="text-caption mt-1">
            Travelers: {{ b.travelersCount }} | Status: {{ b.status }} | Total: €{{ b.grandTotal }}
          </div>
        </div>
        <v-chip :color="b.status === 'CANCELLED' ? 'error' : 'success'" label>
          {{ b.status }}
        </v-chip>
      </div>
    </v-card>

    <v-alert v-if="!loading && arrangementBookings.length === 0" type="info" variant="tonal">
      You don’t have any arrangement bookings yet.
    </v-alert>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axiosInstance'
import { store } from '@/utils/store'

const arrangementBookings = ref([])
const loading = ref(false)
const error = ref('')
const router = useRouter()

function formatDate(dt) {
  if (!dt) return ''
  return new Date(dt).toLocaleDateString()
}

async function fetchArrangementBookings() {
  loading.value = true
  try {
    const { data } = await axios.get(`/bookings/user/${store.username}`)
    arrangementBookings.value = data
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load arrangement bookings'
  } finally {
    loading.value = false
  }
}

function goToActivities(bookingId) {
  router.push(`/traveler/booking/${bookingId}/activities`)
}

onMounted(fetchArrangementBookings)
</script>
