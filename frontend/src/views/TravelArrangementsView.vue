<template>
  <v-container class="py-8" fluid>
    <!-- Header Section -->
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold text-primary mb-2">
          <v-icon class="mr-2" size="32">mdi-map</v-icon>
          Travel Arrangements
        </h1>
        <p class="text-h6 text-grey-darken-1">Manage all travel arrangements and their activities</p>
      </div>
      
      <div class="d-flex align-center ga-3">
        <v-chip 
          color="primary" 
          variant="tonal" 
          prepend-icon="mdi-counter"
        >
          {{ arrangements.length }} {{ arrangements.length === 1 ? 'Arrangement' : 'Arrangements' }}
        </v-chip>
        
        <v-btn 
          v-if="store.role === 'OPERATOR' || store.role === 'operator'"
          color="primary" 
          variant="elevated"
          prepend-icon="mdi-plus"
          to="/op/arrangements/new"
          size="large"
        >
          Create Arrangement
        </v-btn>
      </div>
    </div>

    <!-- Status Messages -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-6" prominent>
      <template v-slot:prepend>
        <v-icon>mdi-alert-circle</v-icon>
      </template>
      {{ error }}
    </v-alert>

    <v-alert v-if="!loading && arrangements.length === 0" type="info" variant="tonal" class="mb-6" prominent>
      <template v-slot:prepend>
        <v-icon>mdi-information</v-icon>
      </template>
      No travel arrangements found. 
      <span v-if="store.role === 'OPERATOR' || store.role === 'operator'">
        Create your first arrangement to get started.
      </span>
    </v-alert>

    <!-- Loading State -->
    <div v-if="loading" class="text-center py-12">
      <v-progress-circular size="64" indeterminate color="primary" />
      <p class="mt-4 text-h6">Loading arrangements...</p>
    </div>

    <!-- Arrangements List -->
    <div v-else-if="arrangements.length > 0">
      <v-row>
        <v-col v-for="arrangement in arrangements" :key="arrangement.id" cols="12">
          <v-card 
            class="mb-4 arrangement-card" 
            elevation="2" 
            @click="goToActivities(arrangement)"
            style="cursor: pointer;"
            hover
          >
            <v-card-text class="pa-6">
              <v-row align="center">
                <v-col cols="12" md="6">
                  <div class="d-flex align-center mb-3">
                    <v-icon color="primary" class="mr-2">mdi-map-marker</v-icon>
                    <h3 class="text-h6 font-weight-bold">
                      {{ arrangement.title }}
                    </h3>
                  </div>
                  
                  <div class="d-flex align-center mb-2">
                    <v-icon size="small" class="mr-2 text-grey-darken-1">mdi-map</v-icon>
                    <span class="text-body-2 text-grey-darken-1">
                      {{ arrangement.destination?.name || 'Destination' }}
                    </span>
                  </div>
                  
                  <div class="d-flex align-center mb-2">
                    <v-icon size="small" class="mr-2 text-grey-darken-1">mdi-account</v-icon>
                    <span class="text-body-2 text-grey-darken-1">
                      Created by {{ arrangement.creator?.name || arrangement.createdByUsername }}
                    </span>
                  </div>
                  
                  <div class="d-flex align-center mb-2">
                    <v-icon size="small" class="mr-2 text-grey-darken-1">mdi-transportation</v-icon>
                    <span class="text-body-2 text-grey-darken-1">
                      {{ arrangement.transportType }} • {{ arrangement.accommodationType }}
                    </span>
                  </div>
                  
                  <div class="d-flex align-center">
                    <v-icon size="small" class="mr-2 text-grey-darken-1">mdi-tag</v-icon>
                    <span class="text-body-2 text-grey-darken-1">
                      {{ arrangement.type?.replace('_', ' ') }}
                    </span>
                  </div>
                </v-col>
                
                <v-col cols="12" md="3" class="text-center">
                  <div class="mb-2">
                    <v-chip 
                      :color="getStatusColor(arrangement.status)" 
                      variant="tonal"
                      size="small"
                    >
                      {{ arrangement.status }}
                    </v-chip>
                  </div>
                  
                  <div class="text-h6 font-weight-bold text-primary">
                    ${{ parseFloat(arrangement.basePricePerPerson || 0).toFixed(2) }}
                    <div class="text-caption text-grey-darken-1">per person</div>
                  </div>
                </v-col>
                
                <v-col cols="12" md="3" class="text-right">
                  <v-btn 
                    color="primary" 
                    variant="elevated"
                    prepend-icon="mdi-map-marker-star"
                    @click.stop="goToActivities(arrangement)"
                  >
                    Manage Activities
                  </v-btn>
                </v-col>
              </v-row>
              
              <!-- Summary if available -->
              <v-row v-if="arrangement.summary" class="mt-3">
                <v-col cols="12">
                  <v-divider class="mb-3" />
                  <p class="text-body-2 text-grey-darken-1">
                    {{ arrangement.summary }}
                  </p>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Snackbar for messages -->
    <v-snackbar v-model="snackbar.open" :timeout="3000" :color="snackbar.color">
      {{ snackbar.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from '@/utils/axiosInstance'
import { store } from '@/utils/store'

const router = useRouter()

// Reactive data
const arrangements = ref([])
const loading = ref(true)
const error = ref('')
const snackbar = reactive({
  open: false,
  message: '',
  color: 'success'
})

// Methods
function getStatusColor(status) {
  const colors = {
    'ACTIVE': 'success',
    'DRAFT': 'warning',
    'PENDING': 'info',
    'INACTIVE': 'error',
    'READY': 'primary',
    'QUOTING': 'orange',
    'CHANGES_REQUESTED': 'purple'
  }
  return colors[status] || 'grey'
}

function goToActivities(arrangement) {
  router.push(`/arrangements/${arrangement.id}/activities`)
}

async function fetchArrangements() {
  try {
    loading.value = true
    error.value = ''
    
    // Use the new travel arrangements endpoint
    const { data } = await axios.get('/travel-arrangements')
    arrangements.value = data || []
    
  } catch (err) {
    console.error('Error fetching arrangements:', err)
    error.value = 'Failed to load travel arrangements. Please try again later.'
    snackbar.message = 'Failed to load arrangements'
    snackbar.color = 'error'
    snackbar.open = true
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  fetchArrangements()
})
</script>

<style scoped>
.arrangement-card {
  transition: all 0.3s ease;
}

.arrangement-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}
</style>
