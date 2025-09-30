<template>
  <v-container class="activities-container" fluid>
    <!-- Header Section with Warm Gradient -->
    <div class="activities-header">
      <div class="activities-header-content">
        <div class="header-main">
          <div class="header-icon">
            <v-icon size="48" color="white">mdi-map-marker-star</v-icon>
          </div>
          <div>
            <h1 class="activities-title font-heading">Activities Management</h1>
            <h2 class="activities-subtitle">{{ arrangementName }}</h2>
          </div>
        </div>
        
        <div class="header-actions">
          <div v-if="store.role === 'operator'" class="operator-actions">
            <v-chip 
              color="rgba(255, 255, 255, 0.9)" 
              variant="elevated"
              prepend-icon="mdi-counter"
              class="count-chip"
            >
              {{ activities.length }} Activities
            </v-chip>
            <v-btn 
              color="white" 
              variant="elevated"
              prepend-icon="mdi-plus"
              @click="openCreateDialog"
              class="create-btn"
            >
              Create Activity
            </v-btn>
          </div>
          
          <div v-else-if="store.role === 'manager'" class="manager-actions">
            <v-chip 
              color="rgba(255, 255, 255, 0.9)" 
              variant="elevated"
              prepend-icon="mdi-chart-line"
              class="dashboard-chip"
            >
              Manager Dashboard
            </v-chip>
            <div class="activity-count">{{ activities.length }} activities to manage</div>
          </div>
        </div>
      </div>
    </div>

    <div class="main-content">

      <!-- Status Messages -->
      <v-alert v-if="error" type="error" variant="tonal" class="modern-alert" prominent>
        <template v-slot:prepend>
          <v-icon>mdi-alert-circle</v-icon>
        </template>
        <strong>Error:</strong> {{ error }}
      </v-alert>
      
      <v-progress-linear 
        v-if="loading" 
        indeterminate 
        class="loading-bar" 
        color="primary"
        height="6"
        rounded
      />


      <v-dialog v-model="showValueDialog" max-width="500">
        <v-card class="modern-card">
          <v-card-title class="dialog-header">
            <div class="dialog-header-content">
              <v-icon class="mr-3" color="primary" size="32">mdi-tune</v-icon>
              <div>
                <h3 class="dialog-title">Adjust Recommendation Weight</h3>
                <p class="dialog-subtitle">Optimize activity visibility</p>
              </div>
            </div>
          </v-card-title>
          <v-card-text class="pa-6">
            <p class="weight-description">
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
              color="primary"
              track-color="grey-lighten-3"
              class="weight-slider"
            />
            <div class="weight-display">
              Current Weight: <strong class="weight-value">{{ selectedValue }}</strong> / 10
            </div>
          </v-card-text>
          <v-card-actions class="pa-6 pt-0">
            <v-spacer />
            <v-btn variant="text" @click="showValueDialog = false" class="cancel-btn">Cancel</v-btn>
            <v-btn color="primary" variant="elevated" @click="confirmUpdateValue" class="save-btn">
              Save Weight
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Activities Grid -->
      <v-row class="activities-grid">
        <v-col
          v-for="a in activities"
          :key="a.id"
          cols="12"
          lg="6"
          xl="4"
        >
          <v-card
            class="modern-card activity-card h-100"
            variant="elevated"
            elevation="0"
            hover
          >
            <!-- Image Header -->
            <div class="position-relative image-container">
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
              >
                <v-icon size="64" color="grey-lighten-1">mdi-image-outline</v-icon>
              </div>

              <!-- Status Badge -->
              <v-chip
                :color="a.status === 'ACTIVE' ? 'success' : 'warning'"
                variant="flat"
                size="small"
                class="status-badge"
              >
                {{ a.status }}
              </v-chip>

              <!-- Price Badge -->
              <v-chip
                color="primary"
                variant="flat"
                class="price-badge"
              >
                ${{ a.price }}
              </v-chip>
            </div>

            <!-- Content -->
            <v-card-text class="card-content">
              <div class="activity-title">{{ a.name }}</div>
              <p class="activity-description">
                {{ a.description }}
              </p>

              <!-- Activity Details -->
              <div class="activity-details">
                <v-row dense>
                  <v-col cols="6">
                    <div class="detail-item">
                      <v-icon size="16" class="detail-icon" color="primary">mdi-account-group</v-icon>
                      <span class="detail-text">Max: {{ a.maxCapacity }}</span>
                    </div>
                  </v-col>
                  <v-col cols="6">
                    <div class="detail-item">
                      <v-icon size="16" class="detail-icon" color="primary">mdi-clock-outline</v-icon>
                      <span class="detail-text">{{ a.lengthInMin || 60 }}min</span>
                    </div>
                  </v-col>
                  <v-col cols="6" v-if="a.difficulty">
                    <div class="detail-item">
                      <v-icon size="16" class="detail-icon" color="primary">mdi-speedometer</v-icon>
                      <span class="detail-text">Level {{ a.difficulty }}/5</span>
                    </div>
                  </v-col>
                  <v-col cols="6" v-if="store.role === 'manager' && a.value">
                    <div class="detail-item">
                      <v-icon size="16" class="detail-icon" color="warning">mdi-star</v-icon>
                      <span class="detail-text">Weight {{ a.value }}/10</span>
                    </div>
                  </v-col>
                </v-row>
              </div>

              <!-- Feature Tags -->
              <div class="feature-tags">
                <v-chip
                  v-if="a.isPetFriendly"
                  size="small"
                  color="success"
                  variant="tonal"
                  class="feature-chip"
                >
                  <v-icon size="14" start>mdi-dog</v-icon>
                  Pet Friendly
                </v-chip>
                <v-chip
                  v-if="a.isFamilyFriendly"
                  size="small"
                  color="info"
                  variant="tonal"
                  class="feature-chip"
                >
                  <v-icon size="14" start>mdi-account-child</v-icon>
                  Family
                </v-chip>
                <v-chip
                  v-if="a.isOutdoor"
                  size="small"
                  color="success"
                  variant="tonal"
                  class="feature-chip"
                >
                  <v-icon size="14" start>mdi-tree</v-icon>
                  Outdoor
                </v-chip>
                <v-chip
                  v-if="a.isAdventure"
                  size="small"
                  color="warning"
                  variant="tonal"
                  class="feature-chip"
                >
                  <v-icon size="14" start>mdi-hiking</v-icon>
                  Adventure
                </v-chip>
                <v-chip
                  v-if="a.isPremiumOption"
                  size="small"
                  color="deep-purple"
                  variant="tonal"
                  class="feature-chip"
                >
                  <v-icon size="14" start>mdi-crown</v-icon>
                  Premium
                </v-chip>
              </div>
            </v-card-text>

            <!-- Actions -->
            <v-card-actions class="card-actions">
              <div v-if="store.role === 'operator'" class="operator-actions-card">
                <v-btn
                  variant="outlined"
                  size="small"
                  icon="mdi-pencil"
                  @click="openEditDialog(a)"
                  class="action-btn edit-btn"
                />
                <v-btn
                  variant="outlined"
                  size="small"
                  color="error"
                  icon="mdi-delete"
                  @click="confirmDelete(a)"
                  class="action-btn delete-btn"
                />
                <v-btn
                  variant="elevated"
                  color="primary"
                  @click="goToSchedules(a.id)"
                  class="schedules-btn"
                  prepend-icon="mdi-calendar-plus"
                >
                  Schedules
                </v-btn>
              </div>

              <div v-else-if="store.role === 'manager'" class="manager-actions-card">
                <div class="manager-btn-row">
                  <v-btn
                    variant="elevated"
                    color="info"
                    @click="openAnalyticsDialog(a.id)"
                    class="manager-btn"
                    prepend-icon="mdi-chart-line"
                    size="small"
                  >
                    Analytics
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    color="primary"
                    @click="openValueDialog(a)"
                    class="manager-btn"
                    prepend-icon="mdi-tune"
                    size="small"
                  >
                    Weight
                  </v-btn>
                </div>
                <div class="manager-btn-row">
                  <v-btn
                    variant="outlined"
                    @click="goToReviews(a.id)"
                    class="manager-btn"
                    prepend-icon="mdi-star"
                    size="small"
                  >
                    Reviews
                  </v-btn>
                  <v-btn
                    variant="outlined"
                    @click="goToCustomers(a.id)"
                    class="manager-btn"
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
    </div>
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
.activities-container {
  background: linear-gradient(135deg, var(--warm-orange) 0%, var(--warm-amber) 100%);
  min-height: 100vh;
  padding: 0;
}

/* Header Styling */
.activities-header {
  background: linear-gradient(135deg, var(--warm-orange) 0%, var(--warm-amber) 100%);
  color: white;
  padding: 2rem;
  margin: -24px -24px 2rem -24px;
}

.activities-header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activities-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.activities-subtitle {
  font-size: 1.1rem;
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
}

.header-actions {
  display: flex;
  align-items: center;
}

.operator-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.count-chip,
.dashboard-chip {
  background: rgba(255, 255, 255, 0.9) !important;
  color: var(--warm-orange) !important;
  font-weight: 600;
}

.create-btn {
  background: rgba(255, 255, 255, 0.9) !important;
  color: var(--warm-orange) !important;
  font-weight: 600;
  min-width: 160px;
}

.manager-actions {
  text-align: center;
}

.activity-count {
  font-size: 0.9rem;
  opacity: 0.9;
  margin-top: 0.5rem;
}

/* Main Content */
.main-content {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Loading and Error */
.loading-bar {
  margin-bottom: 1rem;
  border-radius: 6px;
}

.modern-alert {
  margin-bottom: 1rem;
}

/* Activities Grid */
.activities-grid {
  margin: 0;
}

/* Activity Cards */
.activity-card {
  transition: all 0.3s ease;
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.activity-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

/* Image Container */
.image-container {
  position: relative;
  overflow: hidden;
}

.activity-image {
  border-radius: 0;
  transition: transform 0.3s ease;
}

.activity-card:hover .activity-image {
  transform: scale(1.05);
}

.activity-placeholder {
  height: 220px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 0;
}

/* Status and Price Badges */
.status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  font-weight: 600;
  z-index: 2;
}

.price-badge {
  position: absolute;
  bottom: 12px;
  left: 12px;
  font-weight: 700;
  font-size: 1rem;
  z-index: 2;
}

/* Card Content */
.card-content {
  padding: 1.5rem !important;
}

.activity-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--warm-orange);
  margin-bottom: 0.75rem;
  line-height: 1.3;
}

.activity-description {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.5;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Activity Details */
.activity-details {
  margin-bottom: 1rem;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
}

.detail-icon {
  margin-right: 0.5rem;
}

.detail-text {
  font-size: 0.85rem;
  color: #666;
  font-weight: 500;
}

/* Feature Tags */
.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.feature-chip {
  font-weight: 600;
  font-size: 0.75rem;
}

/* Card Actions */
.card-actions {
  padding: 0 1.5rem 1.5rem 1.5rem !important;
  background: rgba(0, 0, 0, 0.02);
}

.operator-actions-card {
  display: flex;
  width: 100%;
  gap: 0.5rem;
  align-items: center;
}

.action-btn {
  flex-shrink: 0;
  border-width: 2px;
}

.edit-btn {
  color: var(--warm-orange);
  border-color: var(--warm-orange);
}

.delete-btn {
  border-width: 2px;
}

.schedules-btn {
  flex: 1;
  background: var(--warm-orange) !important;
  font-weight: 600;
}

.manager-actions-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 0.75rem;
}

.manager-btn-row {
  display: flex;
  gap: 0.5rem;
}

.manager-btn {
  flex: 1;
  font-weight: 500;
}

/* Dialog Styling */
.dialog-header {
  background: linear-gradient(135deg, var(--warm-orange) 0%, var(--warm-amber) 100%);
  color: white;
  padding: 1.5rem !important;
}

.dialog-header-content {
  display: flex;
  align-items: center;
}

.dialog-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.dialog-subtitle {
  font-size: 1rem;
  margin: 0.25rem 0 0 0;
  opacity: 0.9;
}

.weight-description {
  font-size: 0.95rem;
  line-height: 1.5;
  color: #666;
  margin-bottom: 2rem;
}

.weight-slider {
  margin: 1rem 0;
}

.weight-display {
  text-align: center;
  font-size: 1.1rem;
  color: #333;
  margin-top: 1rem;
}

.weight-value {
  color: var(--warm-orange);
  font-size: 1.3rem;
}

.cancel-btn {
  color: #666;
}

.save-btn,
.generate-btn {
  background: var(--warm-orange) !important;
  font-weight: 600;
}

/* Responsive Design */
@media (max-width: 768px) {
  .activities-header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-actions {
    width: 100%;
  }

  .operator-actions {
    flex-direction: column;
    gap: 0.75rem;
    width: 100%;
  }

  .count-chip,
  .create-btn {
    width: 100%;
  }

  .activity-card {
    margin-bottom: 1.5rem;
  }

  .activities-title {
    font-size: 2rem;
  }

  .card-content {
    padding: 1rem !important;
  }

  .card-actions {
    padding: 0 1rem 1rem 1rem !important;
  }

  .operator-actions-card {
    flex-direction: column;
    gap: 0.75rem;
  }

  .action-btn {
    width: 100%;
  }

  .schedules-btn {
    width: 100%;
  }

  .manager-btn-row {
    flex-direction: column;
    gap: 0.75rem;
  }

  .manager-btn {
    width: 100%;
  }
}

/* Animation for cards */
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

/* Custom scrollbar for mobile */
@media (max-width: 768px) {
  .feature-tags {
    overflow-x: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--warm-orange) transparent;
  }

  .feature-tags::-webkit-scrollbar {
    height: 4px;
  }

  .feature-tags::-webkit-scrollbar-track {
    background: transparent;
  }

  .feature-tags::-webkit-scrollbar-thumb {
    background: var(--warm-orange);
    border-radius: 2px;
  }
}
</style>
