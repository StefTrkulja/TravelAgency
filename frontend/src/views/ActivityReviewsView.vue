<template>
  <v-container class="py-8">
    <h2 class="text-h5 mb-6">{{ activityName }} Reviews</h2>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-data-table
      :headers="headers"
      :items="reviews"
      class="elevation-1"
      dense
    >
      <template #item.overallRating="{ item }">
        <v-rating :model-value="item.overallRating" readonly half-increments size="18" />
        <span>({{ item.overallRating }}/5)</span>
      </template>
      <template #item.revisit="{ item }">
        {{ item.revisit ? 'Y' : 'N' }}
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
const reviews = ref([])
const loading = ref(false)
const error = ref('')

const headers = [
  { title: 'Case ID', key: 'id' },
  { title: 'Passenger', key: 'passenger' },  
  { title: 'Overall Rating', key: 'overallRating' },
  { title: 'Feedback', key: 'comment' },
  { title: 'Organization & Punctuality', key: 'organizationRating' },
  { title: 'Guide Quality', key: 'guideRating' },
  { title: 'Value for Money', key: 'valueForMoneyRating' },
  { title: 'Safety & Comfort', key: 'safetyRating' },
  { title: 'Fun Factor', key: 'funRating' },
  { title: 'Revisit', key: 'wouldRevisit' },
  { title: 'Submitted At', key: 'createdAt' }  
]

async function fetchReviews() {
  loading.value = true
  try {
    const { data } = await axios.get(`/activities/reviews/activity/${activityId}`)

    reviews.value = data.map(r => ({
      ...r,
      passenger: r.user ? `${r.user.name} ${r.user.surname}` : r.userUsername,
      createdAt: new Date(r.createdAt).toLocaleString()
    }))

    if (data.length > 0 && data[0].activityName) {
      activityName.value = data[0].activityName
    }
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load reviews'
  } finally {
    loading.value = false
  }
}
onMounted(fetchReviews)
</script>
