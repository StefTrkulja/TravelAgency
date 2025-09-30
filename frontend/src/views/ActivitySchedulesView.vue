<template>
  <v-container class="schedules-container" fluid>
    <!-- Header Section with Warm Gradient -->
    <div class="schedules-header">
      <div class="schedules-header-content">
        <div class="header-main">
          <div class="header-icon">
            <v-icon size="48" color="white">mdi-calendar-clock</v-icon>
          </div>
          <div>
            <h1 class="schedules-title font-heading">Activity Schedules</h1>
            <h2 class="schedules-subtitle">
              <span v-if="activity">{{ activity.name }}</span>
              <span v-else>Activity #{{ activityId }}</span>
            </h2>
          </div>
        </div>
        
        <div class="header-actions">
          <v-chip 
            color="white" 
            variant="flat" 
            prepend-icon="mdi-counter"
            class="stats-chip"
          >
            {{ schedules.length }} {{ schedules.length === 1 ? 'Schedule' : 'Schedules' }}
          </v-chip>
          
          <v-btn 
            variant="outlined" 
            prepend-icon="mdi-arrow-left"
            @click="goBack"
            class="back-btn"
            color="white"
          >
            Back
          </v-btn>
          
          <v-btn 
            color="white" 
            variant="elevated"
            prepend-icon="mdi-plus"
            @click="openCreateDialog"
            size="large"
            class="add-btn"
          >
            Add Schedule
          </v-btn>
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

      <v-alert v-if="!loading && schedules.length === 0" type="info" variant="tonal" class="modern-alert" prominent>
        <template v-slot:prepend>
          <v-icon>mdi-information</v-icon>
        </template>
        <strong>No schedules yet.</strong> No schedules have been created for this activity yet. Create the first schedule to get started.
      </v-alert>
      
      <v-progress-linear 
        v-if="loading" 
        indeterminate 
        class="loading-bar" 
        color="primary"
        height="6"
        rounded
      />

      <!-- Schedules Grid -->
      <div class="schedules-grid">
        <v-card
          v-for="s in schedules"
          :key="s.id"
          class="modern-card schedule-card"
          elevation="0"
          hover
        >
          <v-card-text class="pa-8">
            <!-- Schedule Header -->
            <div class="schedule-header">
              <div class="schedule-title-row">
                <v-icon color="primary" size="28">mdi-calendar-start</v-icon>
                <h3 class="schedule-title">Schedule #{{ s.id }}</h3>
              </div>
              
              <v-chip 
                color="success" 
                variant="tonal" 
                prepend-icon="mdi-clock-outline"
                class="duration-chip"
              >
                {{ getDuration(s.startTime, s.endTime) }}
              </v-chip>
            </div>

            <!-- Time Details -->
            <div class="time-details">
              <div class="time-item">
                <div class="time-icon-wrapper start-time">
                  <v-icon size="20" color="white">mdi-play-circle</v-icon>
                </div>
                <div class="time-info">
                  <div class="time-label">Start Time</div>
                  <div class="time-value">{{ formatDT(s.startTime) }}</div>
                </div>
              </div>
              
              <div class="time-divider"></div>
              
              <div class="time-item">
                <div class="time-icon-wrapper end-time">
                  <v-icon size="20" color="white">mdi-stop-circle</v-icon>
                </div>
                <div class="time-info">
                  <div class="time-label">End Time</div>
                  <div class="time-value">{{ formatDT(s.endTime) }}</div>
                </div>
              </div>
            </div>

            <!-- Status Indicator -->
            <div class="status-section">
              <v-chip
                :color="getScheduleStatus(s).color"
                variant="flat"
                :prepend-icon="getScheduleStatus(s).icon"
                size="small"
                class="status-chip"
              >
                {{ getScheduleStatus(s).text }}
              </v-chip>
            </div>
          </v-card-text>

          <!-- Action Buttons -->
          <v-card-actions class="pa-8 pt-0">
            <v-btn
              variant="outlined"
              prepend-icon="mdi-pencil"
              @click="openEditDialog(s)"
              class="action-btn edit-btn"
              color="primary"
            >
              Edit
            </v-btn>
            
            <v-btn
              variant="outlined"
              color="error"
              prepend-icon="mdi-delete"
              @click="confirmDelete(s)"
              class="action-btn delete-btn"
            >
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </div>
    </div>

    <!-- Create / Edit dialog -->
    <v-dialog v-model="dialog.open" max-width="520">
      <v-card>
        <v-card-title>{{ dialog.mode === 'create' ? 'Add Schedule' : 'Edit Schedule' }}</v-card-title>
        <v-card-text>
          <v-text-field
            v-model="form.startTime"
            label="Start time (ISO or yyyy-mm-dd hh:mm)"
            placeholder="2025-09-06 10:00"
          />
          <v-text-field
            v-model="form.endTime"
            label="End time (ISO or yyyy-mm-dd hh:mm)"
            placeholder="2025-09-06 12:00"
          />
          <div class="text-caption mt-2">
            Tip: Use local format like <code>2025-09-06 10:00</code>; we’ll convert to ISO.
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog.open = false">Cancel</v-btn>
          <v-btn color="primary" @click="saveSchedule">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm -->
    <v-dialog v-model="deleteDialog.open" max-width="420">
      <v-card>
        <v-card-title>Delete Schedule</v-card-title>
        <v-card-text>
          Are you sure you want to delete schedule <strong>#{{ deleteDialog.item?.id }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog.open = false">Cancel</v-btn>
          <v-btn color="error" @click="doDelete">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.open" :timeout="2400">
      {{ snackbar.msg }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from '@/utils/axiosInstance';

const route = useRoute();
const router = useRouter();

const activityId = computed(() => Number(route.params.activityId));
const schedules = ref([]);
const loading = ref(false);
const error = ref('');
const activity = ref(null);

const dialog = reactive({ open: false, mode: 'create', editingId: null });
const deleteDialog = reactive({ open: false, item: null });
const snackbar = reactive({ open: false, msg: '', color: 'success' });

const form = reactive({
  startTime: '',
  endTime: '',
});

// --- utils ---
function formatDT(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  if (isNaN(d)) return String(dt);
  return d.toLocaleString();
}

function getDuration(startTime, endTime) {
  if (!startTime || !endTime) return 'Unknown duration';
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours}h ${diffMins}m`;
  }
  return `${diffMins}m`;
}

function getScheduleStatus(schedule) {
  const now = new Date();
  const start = new Date(schedule.startTime);
  const end = new Date(schedule.endTime);
  
  if (now < start) {
    return { color: 'info', icon: 'mdi-clock-outline', text: 'Upcoming' };
  } else if (now >= start && now <= end) {
    return { color: 'success', icon: 'mdi-play', text: 'Active' };
  } else {
    return { color: 'grey', icon: 'mdi-check', text: 'Completed' };
  }
}

// Converts "YYYY-MM-DD HH:mm" to ISO; if already ISO, returns as is
function toISO(localish) {
  if (!localish) return null;
  // if already ISO-like
  if (/^\d{4}-\d{2}-\d{2}T/.test(localish)) return localish;
  // replace space with 'T' and append seconds, assume local timezone
  const normalized = localish.trim().replace(' ', 'T') + ':00';
  const d = new Date(normalized);
  if (isNaN(d)) return null;
  return d.toISOString();
}

// --- data ops ---
async function fetchSchedules() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await axios.get(`/activities/schedules/activity/${activityId.value}`);
    schedules.value = data;
  } catch (e) {
    error.value = e?.response?.data?.errors?.[0]?.message || e?.response?.data?.message || 'Failed to load schedules';
  } finally {
    loading.value = false;
  }
}

async function fetchActivity() {
  try {
    const { data } = await axios.get(`/activities/${activityId.value}`);
    activity.value = data;
  } catch (e) {
    console.error("Failed to fetch activity:", e);
  }
}

function openCreateDialog() {
  dialog.mode = 'create';
  dialog.editingId = null;
  Object.assign(form, { startTime: '', endTime: '' });
  dialog.open = true;
}

function openEditDialog(s) {
  dialog.mode = 'edit';
  dialog.editingId = s.id;
  // show local-readable values; keep raw (ISO works too)
  Object.assign(form, {
    startTime: s.startTime,
    endTime: s.endTime,
  });
  dialog.open = true;
}

async function saveSchedule() {
  // basic validation + normalization
  const startIso = toISO(form.startTime);
  const endIso = toISO(form.endTime);

  if (!startIso || !endIso) {
    snackbar.msg = 'Please provide valid start and end times';
    snackbar.open = true;
    return;
  }

  try {
    if (dialog.mode === 'create') {
        await axios.post('/activities/schedules/create', {
        activity_id: activityId.value,
        startTime: startIso,
        endTime: endIso,
        });
      snackbar.msg = 'Schedule created';
    } else {
      await axios.put(`/activities/schedules/${dialog.editingId}`, {
        startTime: startIso,
        endTime: endIso,
      });
      snackbar.msg = 'Schedule updated';
    }
    snackbar.open = true;
    dialog.open = false;
    await fetchSchedules();
  } catch (e) {
    snackbar.msg = e?.response?.data?.errors?.[0]?.message || 'Save failed';
    snackbar.open = true;
  }
}

function confirmDelete(s) {
  deleteDialog.item = s;
  deleteDialog.open = true;
}

async function doDelete() {
  if (!deleteDialog.item) return;
  try {
    await axios.delete(`/activities/schedules/${deleteDialog.item.id}`);
    snackbar.msg = 'Schedule deleted';
    snackbar.open = true;
    deleteDialog.open = false;
    await fetchSchedules();
  } catch (e) {
    snackbar.msg = e?.response?.data?.errors?.[0]?.message || 'Delete failed';
    snackbar.open = true;
  }
}

function goBack() {
  router.back();
}

onMounted(async () => {
  await Promise.all([fetchActivity(), fetchSchedules()]);
});

</script>

<style scoped>
.schedules-container {
  background: var(--warm-bg);
  min-height: 100vh;
  padding: 0 !important;
  
  /* Background pattern */
  background-image: 
    radial-gradient(circle at 30% 70%, rgba(245, 158, 11, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 70% 30%, rgba(212, 115, 10, 0.04) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.02) 0%, transparent 50%);
}

/* Header Section */
.schedules-header {
  background: var(--warm-gradient);
  padding: 48px 24px;
  margin: 0 0 32px 0;
  color: white;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"><g fill="none" fill-rule="evenodd"><g fill="rgba(255,255,255,0.05)" fill-opacity="0.4"><circle cx="30" cy="30" r="2"/></g></svg>') repeat;
    opacity: 0.3;
  }
}

.schedules-header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  z-index: 1;
}

.header-main {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.schedules-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.schedules-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 8px 0 0 0;
  font-weight: 400;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.stats-chip {
  background: rgba(255, 255, 255, 0.15) !important;
  color: white !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  font-weight: 600 !important;
}

.back-btn {
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  color: white !important;
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border-radius: 12px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.5) !important;
  }
  
  :deep(.v-icon) {
    color: white !important;
  }
}

.add-btn {
  background: rgba(255, 255, 255, 0.95) !important;
  color: var(--warm-orange) !important;
  border-radius: 16px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  text-transform: none !important;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.2) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  
  &:hover {
    background: white !important;
    box-shadow: 0 8px 24px rgba(255, 255, 255, 0.3) !important;
    transform: translateY(-2px);
  }
  
  :deep(.v-icon) {
    color: var(--warm-orange) !important;
  }
}

/* Main Content */
.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* Modern Cards */
.modern-card {
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(245, 158, 11, 0.1) !important;
  border-radius: 24px !important;
  box-shadow: 0 8px 32px rgba(212, 115, 10, 0.12) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 48px rgba(212, 115, 10, 0.18) !important;
    border-color: rgba(245, 158, 11, 0.2) !important;
  }
}

/* Modern Alerts */
.modern-alert {
  border-radius: 16px !important;
  box-shadow: 0 4px 16px rgba(33, 150, 243, 0.1) !important;
  margin-bottom: 32px;
  
  :deep(.v-alert__content) {
    font-weight: 500;
  }
}

.loading-bar {
  margin-bottom: 32px;
  border-radius: 8px !important;
}

/* Schedules Grid */
.schedules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

.schedule-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 32px;
}

.schedule-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.schedule-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--warm-orange);
  margin: 0;
  letter-spacing: 0.3px;
}

.duration-chip {
  font-weight: 600 !important;
  letter-spacing: 0.3px !important;
}

/* Time Details */
.time-details {
  margin-bottom: 24px;
}

.time-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
}

.time-icon-wrapper {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &.start-time {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
  }
  
  &.end-time {
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  }
}

.time-info {
  flex: 1;
}

.time-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(28, 25, 23, 0.8);
  margin-bottom: 4px;
}

.time-value {
  font-size: 0.95rem;
  color: rgba(28, 25, 23, 0.7);
  font-weight: 500;
}

.time-divider {
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(245, 158, 11, 0.2) 50%, transparent 100%);
  margin: 8px 0;
}

/* Status Section */
.status-section {
  margin-bottom: 24px;
  text-align: center;
}

.status-chip {
  font-weight: 600 !important;
  letter-spacing: 0.3px !important;
}

/* Action Buttons */
.action-btn {
  flex: 1;
  border-radius: 12px !important;
  font-weight: 600 !important;
  letter-spacing: 0.3px !important;
  text-transform: none !important;
  transition: all 0.3s ease !important;
  
  &:not(:last-child) {
    margin-right: 12px;
  }
}

.edit-btn {
  &:hover {
    background: rgba(212, 115, 10, 0.1) !important;
    border-color: var(--warm-orange) !important;
  }
}

.delete-btn {
  &:hover {
    background: rgba(239, 68, 68, 0.1) !important;
  }
}

/* Status Color Overrides */
:deep(.v-chip--variant-flat) {
  &.text-success {
    background: rgba(16, 185, 129, 0.15) !important;
    color: #10B981 !important;
  }
  
  &.text-info {
    background: rgba(59, 130, 246, 0.15) !important;
    color: #3B82F6 !important;
  }
  
  &.text-grey {
    background: rgba(107, 114, 128, 0.15) !important;
    color: #6B7280 !important;
  }
}

/* Responsive Design */
@media (max-width: 960px) {
  .schedules-header {
    padding: 32px 16px;
  }
  
  .schedules-header-content {
    flex-direction: column;
    gap: 24px;
    text-align: center;
  }
  
  .header-main {
    flex-direction: column;
    gap: 16px;
  }
  
  .header-icon {
    width: 64px;
    height: 64px;
  }
  
  .schedules-title {
    font-size: 2rem;
  }
  
  .schedules-subtitle {
    font-size: 1.1rem;
  }
  
  .header-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .main-content {
    padding: 0 16px;
  }
  
  .schedules-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .schedule-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}

@media (max-width: 600px) {
  .schedules-title {
    font-size: 1.8rem;
  }
  
  .schedule-title {
    font-size: 1.3rem;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .add-btn,
  .back-btn {
    width: 100%;
    max-width: 280px;
  }
  
  .time-item {
    padding: 12px 0;
  }
  
  .time-icon-wrapper {
    width: 36px;
    height: 36px;
  }
}
</style>
