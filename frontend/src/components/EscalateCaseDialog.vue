<!-- src/components/EscalateCaseDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800"
    persistent
    class="escalate-dialog"
  >
    <v-card class="warm-card">
      <v-card-title class="warm-card-title">
        <v-icon class="mr-3 warm-icon">mdi-alert-octagon</v-icon>
        <div>
          <div class="title-text">Escalate Case</div>
          <div class="subtitle-text">Elevate this ticket to higher management</div>
        </div>
      </v-card-title>

      <v-card-text class="warm-card-content">
        <div class="case-summary">
          <h4 class="summary-title">
            <v-icon class="mr-2">mdi-information</v-icon>
            Case Information
          </h4>
          
          <v-row class="case-meta" dense>
            <v-col cols="12" sm="6">
              <div class="meta-item">
                <v-icon class="meta-icon">mdi-identifier</v-icon>
                <div class="meta-content">
                  <span class="meta-label">Case ID</span>
                  <span class="meta-value">{{ ticket?.id ?? '—' }}</span>
                </div>
              </div>
            </v-col>
            
            <v-col cols="12" sm="6">
              <div class="meta-item">
                <v-icon class="meta-icon">mdi-text-subject</v-icon>
                <div class="meta-content">
                  <span class="meta-label">Subject</span>
                  <span class="meta-value">{{ ticket?.subject ?? '—' }}</span>
                </div>
              </div>
            </v-col>
            
            <v-col cols="12" sm="6">
              <div class="meta-item">
                <v-icon class="meta-icon">mdi-account</v-icon>
                <div class="meta-content">
                  <span class="meta-label">Assigned Operator</span>
                  <span class="meta-value">{{ ticket?.assigneeUsername ?? '—' }}</span>
                </div>
              </div>
            </v-col>
            
            <v-col cols="12" sm="6">
              <div class="meta-item">
                <v-icon class="meta-icon">mdi-flag</v-icon>
                <div class="meta-content">
                  <span class="meta-label">Status</span>
                  <span class="meta-value">{{ ticket?.statusName ?? '—' }}</span>
                </div>
              </div>
            </v-col>
            
            <v-col cols="12" sm="6">
              <div class="meta-item">
                <v-icon class="meta-icon">mdi-priority-high</v-icon>
                <div class="meta-content">
                  <span class="meta-label">Priority</span>
                  <span class="meta-value">{{ ticket?.priority ?? '—' }}</span>
                </div>
              </div>
            </v-col>
          </v-row>
        </div>

        <v-divider class="my-6" />

        <div class="escalation-form">
          <h4 class="form-title">
            <v-icon class="mr-2">mdi-comment-text</v-icon>
            Escalation Details
          </h4>
          
          <v-form ref="formRef" v-model="formValid">
            <v-textarea
              v-model="form.reason"
              :rules="[rules.required, rules.min10]"
              label="Reason for Escalation"
              placeholder="Please provide a detailed explanation for why this case needs to be escalated..."
              auto-grow
              rows="4"
              variant="outlined"
              density="comfortable"
              class="warm-textarea"
              clearable
              prepend-inner-icon="mdi-pencil"
            >
              <template v-slot:details>
                <div class="input-help">
                  Minimum 10 characters required. Be specific about the issues and why escalation is necessary.
                </div>
              </template>
            </v-textarea>
          </v-form>
        </div>
      </v-card-text>

      <v-card-actions class="warm-card-actions">
        <v-btn
          variant="outlined"
          :disabled="submitting"
          @click="onCancel"
          class="warm-btn warm-btn-outline"
          prepend-icon="mdi-close"
        >
          Cancel
        </v-btn>
        
        <v-spacer />
        
        <v-btn
          variant="elevated"
          :loading="submitting"
          :disabled="!formValid"
          @click="onSubmit"
          class="warm-btn warm-btn-primary"
          prepend-icon="mdi-send"
        >
          Submit Escalation
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'EscalateCaseDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    ticket: { type: Object, default: () => ({}) },
    accept: { type: String, default: 'image/*,.pdf' },
    submitting: { type: Boolean, default: false }
  },
  emits: ['update:modelValue', 'submit', 'cancel'],
  data() {
    return {
      formValid: false,
      form: { reason: ''},
      rules: {
        required: v => !!v || 'Obavezno polje.',
        min10: v => (v && v.trim().length >= 10) || 'Unesi bar 10 karaktera.',
      }
    }
  },
  watch: {
    modelValue(open) {
      if (open) this.resetForm()
    }
  },
  methods: {
    resetForm() {
      this.form = { reason: ''}
      this.formValid = false
      this.$refs.formRef?.resetValidation?.()
    },
    onCancel() {
      this.$emit('cancel')
      this.$emit('update:modelValue', false)
    },
    async onSubmit() {
      const ok = await this.$refs.formRef?.validate()
      if (!ok) return
      this.$emit('submit', {
        ticketId: this.ticket?.id,
        reason: this.form.reason.trim(),
      })
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/global.scss';

.escalate-dialog {
  .warm-card {
    background: linear-gradient(135deg, #FEF3E8 0%, #FDF7F0 100%);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(212, 115, 10, 0.15);
    overflow: hidden;

    .warm-card-title {
      background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
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
        margin-top: 2px;
      }

      .warm-icon {
        color: white;
        font-size: 1.5rem;
      }
    }

    .warm-card-content {
      padding: 24px;

      .case-summary {
        .summary-title {
          color: var(--warm-primary);
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;

          .v-icon {
            color: var(--warm-primary);
          }
        }

        .case-meta {
          .meta-item {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 12px;
            background: rgba(254, 243, 232, 0.6);
            border-radius: 12px;
            border-left: 4px solid var(--warm-primary);
            margin-bottom: 8px;

            .meta-icon {
              color: var(--warm-primary);
              font-size: 1.2rem;
              margin-top: 2px;
              flex-shrink: 0;
            }

            .meta-content {
              flex-grow: 1;

              .meta-label {
                display: block;
                font-size: 0.85rem;
                color: var(--warm-text-secondary);
                font-weight: 500;
                margin-bottom: 2px;
              }

              .meta-value {
                display: block;
                color: var(--warm-text);
                font-weight: 600;
                font-size: 0.95rem;
              }
            }
          }
        }
      }

      .escalation-form {
        .form-title {
          color: #DC2626;
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;

          .v-icon {
            color: #DC2626;
          }
        }

        .warm-textarea {
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

          .input-help {
            font-size: 0.8rem;
            color: var(--warm-text-secondary);
            margin-top: 4px;
            font-style: italic;
          }
        }
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
          background: linear-gradient(135deg, #DC2626 0%, #EF4444 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(220, 38, 38, 0.3);

          &:hover:not(:disabled) {
            box-shadow: 0 6px 20px rgba(220, 38, 38, 0.4);
          }

          &:disabled {
            background: rgba(220, 38, 38, 0.3);
            color: rgba(255, 255, 255, 0.6);
            box-shadow: none;
          }
        }

        &.warm-btn-outline {
          border: 2px solid #DC2626;
          color: #DC2626;
          background: rgba(254, 243, 232, 0.5);

          &:hover:not(:disabled) {
            background: #DC2626;
            color: white;
          }

          &:disabled {
            border-color: rgba(220, 38, 38, 0.3);
            color: rgba(220, 38, 38, 0.3);
          }
        }

        .v-icon {
          margin-right: 8px;
        }
      }
    }
  }
}

// Form validation messages
:deep(.v-messages__message) {
  color: #DC2626;
  font-weight: 500;
  font-size: 0.8rem;
}

// Divider styling
:deep(.v-divider) {
  border-color: rgba(212, 115, 10, 0.2);
  margin: 0 -8px;
}
</style>
