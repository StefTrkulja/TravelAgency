<template>
  <v-dialog v-model="open" max-width="950px" class="status-dialog">
    <v-card class="warm-card">
      <v-card-title class="warm-card-title">
        <div class="d-flex align-center w-100">
          <v-icon class="mr-3 warm-icon">mdi-clipboard-text</v-icon>
          <div class="flex-grow-1">
            <div class="title-text">Complaint #{{ complaintId }}</div>
            <div class="subtitle-text">Status Management</div>
          </div>
          <div class="d-flex align-center">
            <span class="current-label">Current Status:</span>
            <v-chip 
              variant="elevated" 
              class="warm-chip-current ml-2"
              prepend-icon="mdi-information"
            >
              {{ currentStatusName }}
            </v-chip>
          </div>
        </div>
      </v-card-title>

      <v-card-text class="warm-card-content">
        <v-row>
          <v-col cols="12" md="6">
            <v-select
              v-model="selectedCode"
              :items="allowed"
              item-title="toStatusName"
              item-value="toStatusCode"
              label="Select Next Status"
              :loading="loadingAllowed"
              :disabled="loadingAllowed || allowed.length === 0"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
              class="warm-select"
              prepend-inner-icon="mdi-arrow-right-circle"
            >
              <template v-slot:no-data>
                <v-list-item>
                  <v-list-item-title class="text-center text-grey">
                    No status transitions available
                  </v-list-item-title>
                </v-list-item>
              </template>
            </v-select>
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model="note"
              label="Transition Note (Optional)"
              density="comfortable"
              variant="outlined"
              hide-details="auto"
              class="warm-input"
              prepend-inner-icon="mdi-note-text"
              placeholder="Add a note about this status change..."
            />
          </v-col>
        </v-row>

        <v-alert
          v-if="allowed.length === 0 && !loadingAllowed"
          type="warning"
          variant="tonal"
          class="mt-4 warm-alert"
        >
          <v-icon slot="prepend">mdi-alert</v-icon>
          No status transitions are available for this complaint.
        </v-alert>
      </v-card-text>

      <v-card-actions class="warm-card-actions">
        <v-btn
          variant="outlined"
          @click="fetchAllowed"
          class="warm-btn warm-btn-outline"
          prepend-icon="mdi-refresh"
        >
          Refresh
        </v-btn>
        <v-spacer />
        <v-btn
          variant="elevated"
          :disabled="!selectedCode"
          :loading="submitting"
          @click="confirmDlg = true"
          class="warm-btn warm-btn-primary"
          prepend-icon="mdi-check-circle"
        >
          Change Status
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Confirmation Dialog -->
    <v-dialog v-model="confirmDlg" max-width="500px" class="confirm-dialog">
      <v-card class="warm-card">
        <v-card-title class="warm-card-title-small">
          <v-icon class="mr-3">mdi-help-circle</v-icon>
          Confirm Status Change
        </v-card-title>
        
        <v-card-text class="warm-card-content">
          <div class="status-change-preview">
            <div class="change-row">
              <span class="change-label">From:</span>
              <v-chip variant="tonal" class="warm-chip-from">{{ currentStatusName }}</v-chip>
            </div>
            <v-icon class="change-arrow">mdi-arrow-down</v-icon>
            <div class="change-row">
              <span class="change-label">To:</span>
              <v-chip variant="elevated" class="warm-chip-to">{{ labelForCode(selectedCode) }}</v-chip>
            </div>
          </div>
          
          <div v-if="note" class="note-preview mt-3">
            <strong>Note:</strong> {{ note }}
          </div>
        </v-card-text>
        
        <v-card-actions class="warm-card-actions">
          <v-btn
            variant="outlined"
            @click="confirmDlg = false"
            class="warm-btn warm-btn-outline"
          >
            Cancel
          </v-btn>
          <v-spacer />
          <v-btn
            variant="elevated"
            :loading="submitting"
            @click="applyChange"
            class="warm-btn warm-btn-primary"
            prepend-icon="mdi-check"
          >
            Confirm
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar 
      v-model="snackbar.show" 
      :timeout="3000"
      location="top"
      class="warm-snackbar"
    >
      {{ snackbar.text }}
      <template #actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
          class="warm-snackbar-btn"
        >
          Close
        </v-btn>
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

<style scoped lang="scss">
@import '@/assets/styles/global.scss';

.status-dialog {
  .warm-card {
    background: linear-gradient(135deg, #FEF3E8 0%, #FDF7F0 100%);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(212, 115, 10, 0.15);
    overflow: hidden;

    .warm-card-title {
      background: linear-gradient(135deg, var(--warm-primary) 0%, var(--warm-secondary) 100%);
      color: white;
      padding: 20px 24px;

      .title-text {
        font-size: 1.3rem;
        font-weight: 700;
        line-height: 1.2;
      }

      .subtitle-text {
        font-size: 0.9rem;
        opacity: 0.9;
        font-weight: 400;
      }

      .current-label {
        font-size: 0.85rem;
        opacity: 0.9;
        font-weight: 500;
      }

      .warm-chip-current {
        background: rgba(255, 255, 255, 0.2);
        color: white;
        font-weight: 600;
        border: 1px solid rgba(255, 255, 255, 0.3);

        :deep(.v-chip__prepend) {
          .v-icon {
            color: white;
          }
        }
      }

      .warm-icon {
        color: white;
        font-size: 1.5rem;
      }
    }

    .warm-card-title-small {
      background: linear-gradient(135deg, var(--warm-primary) 0%, var(--warm-secondary) 100%);
      color: white;
      padding: 16px 24px;
      font-size: 1.1rem;
      font-weight: 600;

      .v-icon {
        color: white;
      }
    }

    .warm-card-content {
      padding: 24px;

      .warm-select,
      .warm-input {
        :deep(.v-field) {
          background: rgba(254, 243, 232, 0.8);
          border-radius: 12px;
          border: 1px solid rgba(212, 115, 10, 0.2);

          &:hover {
            border-color: var(--warm-primary);
            box-shadow: 0 0 0 2px rgba(212, 115, 10, 0.1);
          }

          &.v-field--focused {
            border-color: var(--warm-primary);
            box-shadow: 0 0 0 2px rgba(212, 115, 10, 0.15);
          }
        }

        :deep(.v-field__input) {
          color: var(--warm-text);
          font-weight: 500;
        }

        :deep(.v-field__prepend-inner) {
          .v-icon {
            color: var(--warm-primary);
          }
        }

        :deep(.v-label) {
          color: var(--warm-text-secondary);
          font-weight: 500;

          &.v-field-label--floating {
            color: var(--warm-primary);
          }
        }
      }

      .warm-alert {
        background: rgba(255, 193, 7, 0.1);
        border: 1px solid rgba(255, 193, 7, 0.3);
        border-radius: 12px;

        :deep(.v-alert__content) {
          color: var(--warm-text);
          font-weight: 500;
        }

        :deep(.v-icon) {
          color: #FF8F00;
        }
      }

      .status-change-preview {
        text-align: center;
        padding: 16px;

        .change-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 8px 0;

          .change-label {
            font-weight: 600;
            color: var(--warm-text);
            min-width: 50px;
          }

          .warm-chip-from {
            background: rgba(108, 117, 125, 0.1);
            color: var(--warm-text);
            border: 1px solid rgba(108, 117, 125, 0.3);
          }

          .warm-chip-to {
            background: linear-gradient(135deg, var(--warm-primary) 0%, var(--warm-secondary) 100%);
            color: white;
            font-weight: 600;
          }
        }

        .change-arrow {
          color: var(--warm-primary);
          font-size: 1.5rem;
          margin: 8px 0;
        }
      }

      .note-preview {
        background: rgba(254, 243, 232, 0.8);
        padding: 12px 16px;
        border-radius: 12px;
        border-left: 4px solid var(--warm-primary);
        font-style: italic;
        color: var(--warm-text);
      }
    }

    .warm-card-actions {
      padding: 16px 24px 24px;
      background: linear-gradient(180deg, transparent 0%, rgba(254, 243, 232, 0.3) 100%);

      .warm-btn {
        border-radius: 12px;
        font-weight: 600;
        text-transform: none;
        padding: 0 24px;
        height: 44px;

        &.warm-btn-primary {
          background: linear-gradient(135deg, var(--warm-primary) 0%, var(--warm-secondary) 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(212, 115, 10, 0.3);

          &:hover:not(:disabled) {
            box-shadow: 0 6px 20px rgba(212, 115, 10, 0.4);
          }

          &:disabled {
            background: rgba(212, 115, 10, 0.3);
            color: rgba(255, 255, 255, 0.6);
            box-shadow: none;
          }
        }

        &.warm-btn-outline {
          border: 2px solid var(--warm-primary);
          color: var(--warm-primary);
          background: rgba(254, 243, 232, 0.5);

          &:hover {
            background: var(--warm-primary);
            color: white;
          }
        }

        .v-icon {
          margin-right: 8px;
        }
      }
    }
  }
}

.confirm-dialog {
  .warm-card {
    .warm-card-content {
      padding: 20px 24px;
    }

    .warm-card-actions {
      padding: 12px 24px 20px;
    }
  }
}

.warm-snackbar {
  :deep(.v-snackbar__wrapper) {
    background: linear-gradient(135deg, var(--warm-primary) 0%, var(--warm-secondary) 100%);
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 16px rgba(212, 115, 10, 0.3);

    .warm-snackbar-btn {
      color: white;
      font-weight: 600;

      &:hover {
        background: rgba(255, 255, 255, 0.1);
      }
    }
  }
}

// Vuetify menu overrides for select
:deep(.v-overlay__content) {
  .v-list {
    background: #FEF3E8;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(212, 115, 10, 0.15);

    .v-list-item {
      color: var(--warm-text);

      &:hover {
        background: rgba(212, 115, 10, 0.1);
      }

      &.v-list-item--active {
        background: linear-gradient(135deg, var(--warm-primary) 0%, var(--warm-secondary) 100%);
        color: white;
      }
    }
  }
}
</style>
