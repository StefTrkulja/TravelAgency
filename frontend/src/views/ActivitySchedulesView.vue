<template>
  <v-container class="py-8" fluid>
    <!-- Header Section -->
    <div class="d-flex align-center justify-space-between mb-8">
      <div>
        <h1 class="text-h4 font-weight-bold text-primary mb-2">
          <v-icon class="mr-2" size="32">mdi-calendar-clock</v-icon>
          Activity Schedules
        </h1>
        <h2 class="text-h6 text-grey-darken-1">
          <span v-if="activity">{{ activity.name }}</span>
          <span v-else>Activity #{{ activityId }}</span>
        </h2>
      </div>
      
      <div class="d-flex align-center ga-3">
        <v-chip 
          color="primary" 
          variant="tonal" 
          prepend-icon="mdi-counter"
        >
          {{ schedules.length }} {{ schedules.length === 1 ? 'Schedule' : 'Schedules' }}
        </v-chip>
        
        <v-btn 
          variant="tonal" 
          prepend-icon="mdi-arrow-left"
          @click="goBack"
        >
          Back
        </v-btn>
        
        <v-btn 
          color="primary" 
          variant="elevated"
          prepend-icon="mdi-plus"
          @click="openCreateDialog"
          size="large"
        >
          Add Schedule
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

    <v-alert v-if="!loading && schedules.length === 0" type="info" variant="tonal" class="mb-6" prominent>
      <template v-slot:prepend>
        <v-icon>mdi-information</v-icon>
      </template>
      No schedules have been created for this activity yet. Create the first schedule to get started.
    </v-alert>
    
    <v-progress-linear 
      v-if="loading" 
      indeterminate 
      class="mb-6" 
      color="primary"
      height="6"
      rounded
    />

    <!-- Schedules Grid -->
    <v-row>
      <v-col
        v-for="s in schedules"
        :key="s.id"
        cols="12"
        md="6"
        lg="4"
      >
        <v-card
          class="schedule-card h-100"
          variant="elevated"
          elevation="3"
          hover
        >
          <v-card-text class="pa-6">
            <!-- Schedule Time Display -->
            <div class="text-center mb-4">
              <div class="d-flex align-center justify-center mb-2">
                <v-icon color="primary" class="mr-2">mdi-calendar-start</v-icon>
                <span class="text-h6 font-weight-bold text-primary">Schedule #{{ s.id }}</span>
              </div>
              
              <v-chip 
                color="success" 
                variant="tonal" 
                prepend-icon="mdi-clock-outline"
                class="mb-3"
              >
                {{ getDuration(s.startTime, s.endTime) }}
              </v-chip>
            </div>

            <!-- Time Details -->
            <div class="mb-4">
              <div class="d-flex align-center mb-2">
                <v-icon size="20" class="mr-2" color="green">mdi-play-circle</v-icon>
                <div>
                  <div class="font-weight-medium">Start Time</div>
                  <div class="text-body-2 text-grey-darken-1">{{ formatDT(s.startTime) }}</div>
                </div>
              </div>
              
              <v-divider class="my-2" />
              
              <div class="d-flex align-center">
                <v-icon size="20" class="mr-2" color="red">mdi-stop-circle</v-icon>
                <div>
                  <div class="font-weight-medium">End Time</div>
                  <div class="text-body-2 text-grey-darken-1">{{ formatDT(s.endTime) }}</div>
                </div>
              </div>
            </div>

            <!-- Status Indicator -->
            <div class="mb-4">
              <v-chip
                :color="getScheduleStatus(s).color"
                variant="tonal"
                :prepend-icon="getScheduleStatus(s).icon"
                size="small"
              >
                {{ getScheduleStatus(s).text }}
              </v-chip>
            </div>
          </v-card-text>

          <!-- Action Buttons -->
          <v-card-actions class="pa-4 pt-0">
            <v-btn
              variant="tonal"
              prepend-icon="mdi-pencil"
              @click="openEditDialog(s)"
              class="flex-grow-1"
            >
              Edit
            </v-btn>
            
            <v-btn
              variant="tonal"
              color="error"
              prepend-icon="mdi-delete"
              @click="confirmDelete(s)"
              class="flex-grow-1 ml-2"
            >
              Delete
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

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
.schedule-card {
  transition: all 0.3s ease;
}

.schedule-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15) !important;
}
</style>
