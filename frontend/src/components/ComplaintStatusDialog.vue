<template>
  <v-dialog v-model="open" max-width="900px">
    <v-card elevation="1" class="pa-4">
      <div class="d-flex align-center mb-3">
        <div class="text-h6 font-weight-bold">Complaint #{{ complaintId }}</div>
        <v-spacer />
        <div class="d-flex align-center">
          <span class="mr-2 text-caption text-medium-emphasis">Current:</span>
          <v-chip variant="tonal">{{ currentStatusName }}</v-chip>
        </div>
      </div>

      <v-divider class="mb-4" />

      <v-row>
        <v-col cols="12" md="6">
          <v-select
            v-model="selectedCode"
            :items="allowed"
            item-title="toStatusName"
            item-value="toStatusCode"
            label="Next status"
            :loading="loadingAllowed"
            :disabled="loadingAllowed || allowed.length === 0"
            density="comfortable"
            variant="outlined"
            hide-details="auto"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            v-model="note"
            label="Note (optional)"
            density="comfortable"
            variant="outlined"
            hide-details="auto"
          />
        </v-col>
      </v-row>

      <div class="d-flex justify-end gap-2 mt-2">
        <v-btn variant="outlined" @click="fetchAllowed">Refresh</v-btn>
        <v-btn
          color="primary"
          :disabled="!selectedCode"
          :loading="submitting"
          @click="confirmDlg = true"
        >
          Change status
        </v-btn>
      </div>
    </v-card>

    <!-- Confirm -->
    <v-dialog v-model="confirmDlg" max-width="420">
      <v-card>
        <v-card-title class="text-h6">Confirm status change</v-card-title>
        <v-card-text>
          Change from <strong>{{ currentStatusName }}</strong>
          to <strong>{{ labelForCode(selectedCode) }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDlg = false">Cancel</v-btn>
          <v-btn color="primary" :loading="submitting" @click="applyChange">Confirm</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :timeout="2200">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-dialog>
</template>

<script>
import { ref, watch, computed } from 'vue'
import axiosInstance from '@/utils/axiosInstance'

export default {
  name: 'ComplaintStatusDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    complaintId: { type: Number, required: true },
    currentStatusCode: { type: String, required: true },
    currentStatusName: { type: String, required: true },
    statusId: { type: [Number, String], required: true }, 
  },
  emits: ['update:modelValue', 'updated'],
  setup(props, { emit }) {
    const open = computed({
      get: () => props.modelValue,
      set: (v) => emit('update:modelValue', v),
    })

    const allowed = ref([])          // [{ toStatusCode, toStatusName, ... }]
    const loadingAllowed = ref(false)
    const selectedCode = ref(null)   // drži toStatusCode
    const note = ref('')
    const submitting = ref(false)
    const confirmDlg = ref(false)
    const snackbar = ref({ show: false, text: '' })

    function labelForCode(code) {
      const f = allowed.value.find(a => a.toStatusCode === code)
      return f ? f.toStatusName : code
    }

    async function fetchAllowed() {
      loadingAllowed.value = true
      try {
        const { data } = await axiosInstance.get(`/complaint/${props.statusId}/allowed-statuses`)
        const arr = Array.isArray(data) ? data : []

        // Normalizacija uvek obezbeđuje toStatusCode / toStatusName ključeve
        allowed.value = arr.map(x => ({
          ...x,
          toStatusCode: x.toStatusCode ?? x.code ?? x.toCode ?? null,
          toStatusName: x.toStatusName ?? x.name ?? x.toName ?? null,
        }))

        selectedCode.value = allowed.value.length === 1 ? allowed.value[0].toStatusCode : null
      } catch (e) {
        snackbar.value = { show: true, text: e.message || 'Failed to load allowed statuses.' }
      } finally {
        loadingAllowed.value = false
      }
    }

    async function applyChange() {
      if (!selectedCode.value) return
      submitting.value = true
      try {
        const { data } = await axiosInstance.post(
          `/complaint/${props.complaintId}/transition`,
          { toCode: selectedCode.value, note: note.value },
        )
        snackbar.value = { show: true, text: 'Status updated.' }
        confirmDlg.value = false
        open.value = false
        emit('updated', data)
      } catch (e) {
        snackbar.value = { show: true, text: e.message || 'Failed to change status.' }
      } finally {
        submitting.value = false
      }
    }

    watch(open, (isOpen) => {
      if (isOpen) {
        selectedCode.value = null
        note.value = ''
        fetchAllowed()
      }
    }),
    watch(
  () => props.complaintId,
  () => {
        // reset lokalnog stanja
        allowed.value = []
        selectedCode.value = null
        note.value = ''
        // ako je dijalog otvoren – odmah refetch
        if (open.value) fetchAllowed()
      }
    )


    return {
      open, allowed, loadingAllowed, selectedCode, note,
      submitting, confirmDlg, snackbar,
      fetchAllowed, applyChange, labelForCode,
    }
  },
}
</script>

<style scoped>
.gap-2 > * + * { margin-left: 8px; }
</style>
