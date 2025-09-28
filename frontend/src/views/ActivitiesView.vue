<template>
  <v-container class="py-8" fluid>
    <!-- Header Section -->
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold text-primary mb-2">
          <v-icon class="mr-2" size="32">mdi-map-marker-star</v-icon>
          Activities Management
        </h1>
        <h2 class="text-h6 text-grey-darken-1">{{ arrangementName }}</h2>
      </div>
      
      <div v-if="store.role === 'operator'" class="d-flex align-center ga-3">
        <v-chip 
          color="primary" 
          variant="tonal" 
          prepend-icon="mdi-counter"
        >
          {{ activities.length }} Activities
        </v-chip>
        <v-btn 
          color="primary" 
          variant="elevated"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
          size="large"
        >
          Create Activity
        </v-btn>
      </div>
      
      <div v-else-if="store.role === 'manager'" class="text-center">
        <v-chip 
          color="success" 
          variant="tonal" 
          prepend-icon="mdi-chart-line"
          class="mb-2"
        >
          Manager Dashboard
        </v-chip>
        <div class="text-caption">{{ activities.length }} activities to manage</div>
      </div>
    </div>

    <!-- Status Messages -->
    <v-alert v-if="error" type="error" variant="tonal" class="mb-6" prominent>
      <template v-slot:prepend>
        <v-icon>mdi-alert-circle</v-icon>
      </template>
      {{ error }}
    </v-alert>
    
    <v-progress-linear 
      v-if="loading" 
      indeterminate 
      class="mb-6" 
      color="primary"
      height="6"
      rounded
    />


    <v-dialog v-model="showValueDialog" max-width="500">
  <v-card>
    <v-card-title class="text-h6">
      Adjust Recommendation Weight
    </v-card-title>
    <v-card-text>
      <p class="mb-4">
        The recommendation system uses this weight to decide how prominently
        this activity appears to customers. Increasing the weight will push
        the activity higher in suggestions.
      </p>
      <v-slider
        v-model="selectedValue"
        :min="1"
        :max="10"
        step="1"
        ticks="always"
        tick-size="4"
        thumb-label="always"
      />
      <div class="text-center mt-2">
        Current Weight: <strong>{{ selectedValue }}</strong> / 10
      </div>
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn text @click="showValueDialog = false">Cancel</v-btn>
      <v-btn color="primary" @click="confirmUpdateValue">
        Save Weight
      </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>

    <!-- Activities Grid -->
    <v-row>
      <v-col
        v-for="a in activities"
        :key="a.id"
        cols="12"
        lg="6"
        xl="4"
      >
        <v-card
          class="activity-card h-100"
          variant="elevated"
          elevation="3"
          hover
        >
          <!-- Image Header -->
          <div class="position-relative">
            <v-img
              v-if="a.imagePath"
              :src="`http://localhost:3000/${a.imagePath}`"
              alt="Activity image"
              height="220"
              cover
              class="activity-image"
            >
              <template v-slot:placeholder>
                <div class="d-flex align-center justify-center fill-height">
                  <v-progress-circular indeterminate color="primary" />
                </div>
              </template>
            </v-img>
            <div
              v-else
              class="d-flex align-center justify-center activity-placeholder"
              style="height: 220px; background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);"
            >
              <v-icon size="64" color="grey-lighten-1">mdi-image-outline</v-icon>
            </div>

            <!-- Status Badge -->
            <v-chip
              :color="a.status === 'ACTIVE' ? 'success' : 'warning'"
              variant="flat"
              size="small"
              class="position-absolute"
              style="top: 12px; right: 12px;"
            >
              {{ a.status }}
            </v-chip>

            <!-- Price Badge -->
            <v-chip
              color="primary"
              variant="flat"
              class="position-absolute font-weight-bold"
              style="bottom: 12px; left: 12px;"
            >
              ${{ a.price }}
            </v-chip>
          </div>

          <!-- Content -->
          <v-card-text class="pb-2">
            <div class="text-h6 font-weight-bold mb-2 text-primary">{{ a.name }}</div>
            <p class="text-body-2 text-grey-darken-1 mb-3" style="line-height: 1.4;">
              {{ a.description }}
            </p>

            <!-- Activity Details -->
            <div class="mb-4">
              <v-row dense>
                <v-col cols="6">
                  <div class="d-flex align-center mb-1">
                    <v-icon size="16" class="mr-1" color="grey-darken-1">mdi-account-group</v-icon>
                    <span class="text-caption">Max: {{ a.maxCapacity }}</span>
                  </div>
                </v-col>
                <v-col cols="6">
                  <div class="d-flex align-center mb-1">
                    <v-icon size="16" class="mr-1" color="grey-darken-1">mdi-clock-outline</v-icon>
                    <span class="text-caption">{{ a.lengthInMin || 60 }}min</span>
                  </div>
                </v-col>
                <v-col cols="6" v-if="a.difficulty">
                  <div class="d-flex align-center">
                    <v-icon size="16" class="mr-1" color="grey-darken-1">mdi-speedometer</v-icon>
                    <span class="text-caption">Level {{ a.difficulty }}/5</span>
                  </div>
                </v-col>
                <v-col cols="6" v-if="store.role === 'manager' && a.value">
                  <div class="d-flex align-center">
                    <v-icon size="16" class="mr-1" color="orange">mdi-star</v-icon>
                    <span class="text-caption">Weight {{ a.value }}/10</span>
                  </div>
                </v-col>
              </v-row>
            </div>

            <!-- Feature Tags -->
            <div class="d-flex flex-wrap ga-1 mb-4">
              <v-chip
                v-if="a.isPetFriendly"
                size="x-small"
                color="green"
                variant="tonal"
              >
                <v-icon size="12" start>mdi-dog</v-icon>
                Pet Friendly
              </v-chip>
              <v-chip
                v-if="a.isFamilyFriendly"
                size="x-small"
                color="blue"
                variant="tonal"
              >
                <v-icon size="12" start>mdi-account-child</v-icon>
                Family
              </v-chip>
              <v-chip
                v-if="a.isOutdoor"
                size="x-small"
                color="teal"
                variant="tonal"
              >
                <v-icon size="12" start>mdi-tree</v-icon>
                Outdoor
              </v-chip>
              <v-chip
                v-if="a.isAdventure"
                size="x-small"
                color="orange"
                variant="tonal"
              >
                <v-icon size="12" start>mdi-hiking</v-icon>
                Adventure
              </v-chip>
              <v-chip
                v-if="a.isPremiumOption"
                size="x-small"
                color="purple"
                variant="tonal"
              >
                <v-icon size="12" start>mdi-crown</v-icon>
                Premium
              </v-chip>
            </div>
          </v-card-text>

          <!-- Actions -->
          <v-card-actions class="pt-0">
            <div v-if="store.role === 'operator'" class="d-flex w-100 ga-1">
              <v-btn
                variant="outlined"
                size="small"
                icon="mdi-pencil"
                @click="openEditDialog(a)"
                class="flex-shrink-0"
              />
              <v-btn
                variant="outlined"
                size="small"
                color="error"
                icon="mdi-delete"
                @click="confirmDelete(a)"
                class="flex-shrink-0"
              />
              <v-btn
                variant="flat"
                color="primary"
                @click="goToSchedules(a.id)"
                class="flex-grow-1"
                prepend-icon="mdi-calendar-plus"
              >
                Schedules
              </v-btn>
            </div>

            <div v-else-if="store.role === 'manager'" class="d-flex flex-column w-100 ga-2">
              <div class="d-flex ga-1">
                <v-btn
                  variant="flat"
                  color="info"
                  @click="openAnalyticsDialog(a.id)"
                  class="flex-grow-1"
                  prepend-icon="mdi-chart-line"
                  size="small"
                >
                  Analytics
                </v-btn>
                <v-btn
                  variant="outlined"
                  color="primary"
                  @click="openValueDialog(a)"
                  class="flex-grow-1"
                  prepend-icon="mdi-tune"
                  size="small"
                >
                  Weight
                </v-btn>
              </div>
              <div class="d-flex ga-1">
                <v-btn
                  variant="outlined"
                  @click="goToReviews(a.id)"
                  class="flex-grow-1"
                  prepend-icon="mdi-star"
                  size="small"
                >
                  Reviews
                </v-btn>
                <v-btn
                  variant="outlined"
                  @click="goToCustomers(a.id)"
                  class="flex-grow-1"
                  prepend-icon="mdi-account-group"
                  size="small"
                >
                  Customers
                </v-btn>
              </div>
            </div>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>


    <!-- Analytics Dialog -->
    <v-dialog v-model="analyticsDialog.open" max-width="500">
    <v-card>
        <v-card-title>Generate Analytics</v-card-title>
        <v-card-text>
        <v-text-field v-model="analyticsForm.fromDate" label="From Date" type="date" />
        <v-text-field v-model="analyticsForm.toDate" label="To Date" type="date" />
        </v-card-text>
        <v-card-actions>
        <v-spacer />
        <v-btn text @click="analyticsDialog.open = false">Cancel</v-btn>
        <v-btn color="primary" @click="generateAnalytics">Generate</v-btn>
        </v-card-actions>
    </v-card>
    </v-dialog>


    <!-- Create / Edit Dialog -->
    <v-dialog v-model="dialog.open" max-width="600">
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? 'Create Activity' : 'Edit Activity' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name" label="Name" />
          <v-textarea v-model="form.description" label="Description" rows="3" />
          <v-text-field v-model.number="form.price" label="Price" type="number" />
          <v-text-field v-model.number="form.minCapacity" label="Min Capacity" type="number" />
          <v-text-field v-model.number="form.maxCapacity" label="Max Capacity" type="number" />
          <v-select v-model="form.status" :items="statusOptions" label="Status" />
          <v-switch v-model="form.isPetFriendly" label="Pet Friendly" />
          <v-switch v-model="form.isFamilyFriendly" label="Family Friendly" />
          <v-switch v-model="form.isOutdoor" label="Outdoor" />
          <v-switch v-model="form.isAdventure" label="Adventure" />
          <v-switch v-model="form.isPremiumOption" label="Premium option" />
          <v-text-field v-model.number="form.lengthInMin" label="Length (min)" type="number" />
          <v-text-field v-model.number="form.difficulty" label="Difficulty (1-5)" type="number" />
          <v-select v-model="form.targetAgeGroup" :items="ageGroups" label="Target Age Group" />
          <v-select v-model="form.season" :items="seasonOptions" label="Season" />
          <v-file-input
  v-model="form.imageFile"
  label="Attach Image"
  accept="image/*"
  prepend-icon="mdi-image"
/>

        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog.open = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveActivity">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm -->
    <v-dialog v-model="deleteDialog.open" max-width="420">
      <v-card>
        <v-card-title>Delete Activity</v-card-title>
        <v-card-text>
          Are you sure you want to delete <strong>{{ deleteDialog.item?.name }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.open = false">Cancel</v-btn>
          <v-btn color="error" @click="doDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.open" :timeout="2500">
      {{ snackbar.msg }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/utils/axiosInstance';
import { store } from '@/utils/store';

const route = useRoute();
const router = useRouter();

// If arrangement page isn't ready, you can navigate directly to /arrangements/1/activities
const arrangementId = computed(() => Number(route.params.arrangementId) || 1);
const arrangementName = 'Paris Summer Trip';

const activities = ref([]);
const loading = ref(false);
const error = ref('');

const statusOptions = ['ACTIVE','INACTIVE'];
const ageGroups = ['KIDS','TEENS','ADULTS','ALL'];
const seasonOptions = ['SPRING','SUMMER','AUTUMN','WINTER','ALL'];

const dialog = reactive({ open: false, mode: 'create', editingId: null });
const deleteDialog = reactive({ open: false, item: null });
const snackbar = reactive({ open: false, msg: '' });
const analyticsDialog = reactive({ open: false, activityId: null });
const analyticsForm = reactive({ fromDate: '', toDate: '' });

const showValueDialog = ref(false)
const selectedActivityId = ref(null)
const selectedValue = ref(5)

function openValueDialog(activity) {
  selectedActivityId.value = activity.id
  selectedValue.value = activity.value ?? 5
  showValueDialog.value = true
}

const form = reactive({
  name: '',
  description: '',
  price: 0,
  minCapacity: 1,
  maxCapacity: 10,
  lengthInMin: 60,
  difficulty: null,
  status: 'ACTIVE',
  isPetFriendly: false,
  isFamilyFriendly: false,
  isOutdoor: false,
  isAdventure: false,
  isPremiumOption: false,
  targetAgeGroup: 'ALL',
  season: 'ALL',
  arrangement_id: null,
  user_id: null, 
  imageFile: null,
});

function openAnalyticsDialog(activityId) {
  analyticsDialog.activityId = activityId;
  analyticsDialog.open = true;
}

async function generateAnalytics() {
  try {
    const { data } = await axios.post('/activities/analytics/create', {
      activity_id: analyticsDialog.activityId,
      fromDate: analyticsForm.fromDate,
      toDate: analyticsForm.toDate
    });
    analyticsDialog.open = false;
    router.push(`/activities/${analyticsDialog.activityId}/analytics/${data.id}`);
  } catch (e) {
    snackbar.msg = e?.response?.data?.errors?.[0]?.message || 'Failed to generate analytics';
    snackbar.open = true;
  }
}

async function fetchActivities() {
  loading.value = true;
  error.value = '';
  try {
    // axiosInstance has baseURL "http://localhost:3000/api", so this calls /api/activities/arrangement/:id
    const { data } = await axios.get(`/activities/arrangement/${arrangementId.value}`);
    activities.value = data;
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load activities';
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  dialog.mode = 'create';
  dialog.editingId = null;
  Object.assign(form, {
    name: '',
    description: '',
    price: 0,
    minCapacity: 1,
    maxCapacity: 10,
    lengthInMin: 60,
    difficulty: null,
    status: 'ACTIVE',
    isPetFriendly: false,
    isFamilyFriendly: false,
    isOutdoor: false,
    isAdventure: false,
    isPremiumOption: false,
    targetAgeGroup: 'ALL',
    season: 'ALL',
    arrangement_id: arrangementId.value,
    user_id: 1, // TODO: map from your auth (store) when available
  });
  dialog.open = true;
}

function openEditDialog(item) {
  dialog.mode = 'edit';
  dialog.editingId = item.id;
  Object.assign(form, {
    name: item.name,
    description: item.description,
    price: item.price,
    minCapacity: item.minCapacity,
    maxCapacity: item.maxCapacity,
    lengthInMin: item.lengthInMin,
    difficulty: item.difficulty,
    status: item.status,
    isPetFriendly: item.isPetFriendly,
    isFamilyFriendly: item.isFamilyFriendly,
    isOutdoor: item.isOutdoor,
    isAdventure: item.isAdventure,
    isPremiumOption: item.isPremiumOption,
    targetAgeGroup: item.targetAgeGroup,
    season: item.season,
    arrangement_id: item.arrangement_id ?? arrangementId.value,
    user_id: item.user_id ?? 1,
  });
  dialog.open = true;
}

async function saveActivity() {
  try {
    const fd = new FormData();
    for (const key in form) {
      if (form[key] !== null && form[key] !== undefined) {
        if (key === 'imageFile') {
          if (form.imageFile) fd.append('image', form.imageFile);
        } else {
          fd.append(key, form[key]);
        }
      }
    }

    if (dialog.mode === 'create') {
      await axios.post('/activities/create', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      snackbar.msg = 'Activity created';
    } else {
      await axios.put(`/activities/${dialog.editingId}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      snackbar.msg = 'Activity updated';
    }

    snackbar.open = true;
    dialog.open = false;
    await fetchActivities();
  } catch (e) {
    snackbar.msg = e?.response?.data?.errors?.[0]?.message || 'Save failed';
    snackbar.open = true;
  }
}


function confirmDelete(item) {
  deleteDialog.item = item;
  deleteDialog.open = true;
}

async function doDelete() {
  if (!deleteDialog.item) return;
  try {
    await axios.delete(`/activities/${deleteDialog.item.id}`); // -> /api/activities/:id
    snackbar.msg = 'Activity deleted';
    snackbar.open = true;
    deleteDialog.open = false;
    await fetchActivities();
  } catch (e) {
    snackbar.msg = e?.response?.data?.errors?.[0]?.message || 'Delete failed';
    snackbar.open = true;
  }
}

function goToSchedules(activityId) {
  router.push(`/activities/${activityId}/schedules`);
}

function goToReviews(activityId) {
  router.push(`/activities/${activityId}/reviews`)
}

function goToCustomers(activityId) {
  router.push(`/activities/${activityId}/customers`);
}

async function confirmUpdateValue() {
  try {
    await axios.put(`/activities/${selectedActivityId.value}/value`, {
      value: selectedValue.value
    })
    showValueDialog.value = false
    // refresh list so UI updates with new value
    await fetchActivities()
  } catch (e) {
    console.error('Failed to update recommendation weight', e)
  }
}

onMounted(fetchActivities);
</script>

<style scoped>
.activity-card {
  transition: all 0.3s ease;
  border-radius: 16px !important;
  overflow: hidden;
}

.activity-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}

.activity-image {
  border-radius: 0;
  transition: transform 0.3s ease;
}

.activity-card:hover .activity-image {
  transform: scale(1.05);
}

.activity-placeholder {
  border-radius: 0;
}

/* Custom chip styling */
.v-chip {
  font-weight: 500;
}

/* Status badge positioning */
.position-absolute {
  position: absolute;
}

/* Smooth transitions for all interactive elements */
.v-btn {
  transition: all 0.2s ease;
}

.v-btn:hover {
  transform: translateY(-1px);
}

/* Card content improvements */
.v-card-text {
  padding: 20px !important;
}

.v-card-actions {
  padding: 0 20px 20px 20px !important;
}

/* Header improvements */
.text-h4 {
  background: linear-gradient(45deg, #1976d2, #42a5f5);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Feature tags styling */
.v-chip.v-chip--size-x-small {
  height: 20px;
  font-size: 10px;
}

/* Progress bar improvements */
.v-progress-linear {
  border-radius: 3px;
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .activity-card {
    margin-bottom: 16px;
  }
}

/* Animation for card loading */
.activity-card {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Gradient overlay for better text readability on images */
.v-img::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 60%,
    rgba(0, 0, 0, 0.3) 100%
  );
  pointer-events: none;
}

/* Enhanced button styling */
.v-btn--variant-flat {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.v-btn--variant-outlined {
  border-width: 1.5px;
}
</style>
