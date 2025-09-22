<template>
  <v-container class="py-8">
    <div class="d-flex align-center justify-space-between mb-6">
      <h2 class="text-h5">
  Schedules for activity 
  <span v-if="activity">{{ activity.name }}</span>
  <span v-else>#{{ activityId }}</span>
</h2>
      <div class="d-flex ga-2">
        <v-btn variant="tonal" @click="goBack">Back</v-btn>
        <v-btn color="primary" @click="openCreateDialog">Add Schedule</v-btn>
      </div>
    </div>

    <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-card v-for="s in schedules" :key="s.id" class="mb-3" variant="outlined">
      <v-card-text class="d-flex align-center justify-space-between flex-wrap">
        <div>
          <div class="text-subtitle-2">
            <strong>{{ formatDT(s.startTime) }}</strong> → <strong>{{ formatDT(s.endTime) }}</strong>
          </div>
          <div class="text-caption mt-1">ID: {{ s.id }}</div>
        </div>
        <div class="d-flex ga-2">
          <v-btn icon="mdi-pencil" variant="tonal" @click="openEditDialog(s)" />
          <v-btn icon="mdi-delete" variant="tonal" color="error" @click="confirmDelete(s)" />
        </div>
      </v-card-text>
    </v-card>

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
const snackbar = reactive({ open: false, msg: '' });

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
