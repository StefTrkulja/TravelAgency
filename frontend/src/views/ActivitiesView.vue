<template>
  <v-container class="py-8">
    <h2 class="text-h5 mb-6">Activities for arrangement #{{ arrangementName }}</h2>

        <div v-if="store.role === 'operator'" class="d-flex justify-end mb-4">
        <v-btn color="primary" @click="openCreateDialog">Create Activity</v-btn>
        </div>


    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />


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

    <!-- Activity Cards -->
<v-card
  v-for="a in activities"
  :key="a.id"
  class="mb-4"
  variant="outlined"
>
  <v-card-text>
    <v-row no-gutters align="center">
      <!-- Image -->
      <v-col cols="12" md="3" class="d-flex justify-center">
        <v-img
          v-if="a.imagePath"
          :src="`http://localhost:3000/${a.imagePath}`"
          alt="Activity image"
          max-width="220"
          aspect-ratio="4/3"
          class="rounded"
          cover
        />
      </v-col>

      <!-- Info -->
      <v-col cols="12" md="6" class="px-4">
        <div class="text-subtitle-1 font-weight-bold">{{ a.name }}</div>
        <div class="text-body-2 mb-2">{{ a.description }}</div>
        <div class="text-body-2">
          <strong>Price:</strong> {{ a.price }} |
          <strong>Status:</strong> {{ a.status }} |
          <strong>Max:</strong> {{ a.maxCapacity }}
        </div>
      </v-col>

      <!-- Actions -->
      <v-col cols="12" md="3" class="d-flex justify-end">
        <div v-if="store.role === 'operator'" class="d-flex ga-2">
          <v-btn icon="mdi-pencil" variant="tonal" @click="openEditDialog(a)" />
          <v-btn icon="mdi-delete" variant="tonal" color="error" @click="confirmDelete(a)" />
          <v-btn variant="flat" @click="goToSchedules(a.id)">Add Schedule</v-btn>
        </div>

        <div v-else-if="store.role === 'manager'" class="d-flex flex-column ga-2">
          <v-btn variant="flat" @click="openAnalyticsDialog(a.id)">Analytics</v-btn>
          <v-btn small color="primary" @click="openValueDialog(a)">
  Adjust Weight
</v-btn>


          <v-btn variant="flat" @click="goToReviews(a.id)">See Reviews</v-btn>
          <v-btn variant="flat" @click="goToCustomers(a.id)">Customers</v-btn>
        </div>
      </v-col>
    </v-row>
  </v-card-text>
</v-card>


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
