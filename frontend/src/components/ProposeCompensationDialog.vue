<!-- src/components/ProposeCompensationDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="800"
    persistent
    class="compensation-dialog"
  >
    <v-card class="warm-card">
      <v-card-title class="warm-card-title">
        <v-icon class="mr-3 warm-icon">mdi-cash-multiple</v-icon>
        <div>
          <div class="title-text">Propose Compensation</div>
          <div class="subtitle-text">Create compensation offer for customer</div>
        </div>
      </v-card-title>

      <v-card-text class="warm-card-content">
        <div class="case-info">
          <h4 class="info-title">
            <v-icon class="mr-2">mdi-ticket</v-icon>
            Case Details
          </h4>
          
          <v-row class="case-details" dense>
            <v-col cols="12" sm="4">
              <div class="detail-item">
                <v-icon class="detail-icon">mdi-identifier</v-icon>
                <div class="detail-content">
                  <span class="detail-label">Case ID</span>
                  <span class="detail-value">{{ ticket?.id ?? '—' }}</span>
                </div>
              </div>
            </v-col>
            
            <v-col cols="12" sm="4">
              <div class="detail-item">
                <v-icon class="detail-icon">mdi-text-subject</v-icon>
                <div class="detail-content">
                  <span class="detail-label">Subject</span>
                  <span class="detail-value">{{ ticket?.subject ?? '—' }}</span>
                </div>
              </div>
            </v-col>
            
            <v-col cols="12" sm="4">
              <div class="detail-item">
                <v-icon class="detail-icon">mdi-account</v-icon>
                <div class="detail-content">
                  <span class="detail-label">Passenger</span>
                  <span class="detail-value">{{ ticket?.passenger ?? '—' }}</span>
                </div>
              </div>
            </v-col>
          </v-row>
        </div>

        <v-divider class="my-6" />

        <div class="compensation-form">
          <h4 class="form-title">
            <v-icon class="mr-2">mdi-gift</v-icon>
            Compensation Type
          </h4>
          
          <v-btn-toggle 
            v-model="form.type" 
            class="compensation-toggle mb-6" 
            mandatory
            variant="outlined"
            divided
          >
            <v-btn value="REFUND" class="toggle-btn">
              <v-icon class="mr-2">mdi-cash-refund</v-icon>
              Refund
            </v-btn>
            <v-btn value="VOUCHER" class="toggle-btn">
              <v-icon class="mr-2">mdi-ticket-percent</v-icon>
              Voucher
            </v-btn>
            <v-btn value="DISCOUNT" class="toggle-btn">
              <v-icon class="mr-2">mdi-percent</v-icon>
              Discount
            </v-btn>
          </v-btn-toggle>

          <h4 class="form-title">
            <v-icon class="mr-2">mdi-cog</v-icon>
            Compensation Details
          </h4>
          
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field 
                v-model="form.value" 
                label="Compensation Value" 
                type="number"
                variant="outlined" 
                density="comfortable"
                class="warm-input"
                prepend-inner-icon="mdi-currency-usd"
                placeholder="Enter amount..."
              />
            </v-col>
            
            <v-col cols="12" sm="6">
              <v-select 
                v-model="form.currency" 
                :items="[
                  { title: 'US Dollar', value: 'USD' },
                  { title: 'Euro', value: 'EUR' },
                  { title: 'Serbian Dinar', value: 'RSD' },
                  { title: 'Percentage', value: '%' }
                ]"
                label="Currency/Unit" 
                variant="outlined" 
                density="comfortable"
                class="warm-select"
                prepend-inner-icon="mdi-currency-sign"
              />
            </v-col>
            
            <v-col cols="12" sm="6" v-if="form.type !== 'REFUND'">
              <v-text-field 
                v-model="form.validUntil" 
                label="Valid Until" 
                type="date"
                variant="outlined" 
                density="comfortable"
                class="warm-input"
                prepend-inner-icon="mdi-calendar"
              />
            </v-col>
            
            <v-col cols="12">
              <v-textarea 
                v-model="form.note" 
                label="Additional Notes" 
                variant="outlined" 
                auto-grow 
                rows="3"
                class="warm-textarea"
                prepend-inner-icon="mdi-note-text"
                placeholder="Add any additional information about this compensation..."
              />
            </v-col>
          </v-row>

          <v-alert
            v-if="summary"
            type="success"
            variant="tonal"
            class="mt-4 summary-alert"
          >
            <v-icon slot="prepend">mdi-check-circle</v-icon>
            <strong>Compensation Summary:</strong> {{ summary }}
          </v-alert>
        </div>
      </v-card-text>

      <v-card-actions class="warm-card-actions">
        <v-btn
          variant="outlined"
          @click="close"
          class="warm-btn warm-btn-outline"
          prepend-icon="mdi-close"
        >
          Cancel
        </v-btn>
        
        <v-spacer />
        
        <v-btn
          variant="elevated"
          @click="submit"
          class="warm-btn warm-btn-primary"
          prepend-icon="mdi-send"
          :disabled="!form.value"
        >
          Submit Proposal
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ProposeCompensationDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    ticket: { type: Object, default: () => ({}) },
    defaultCurrency: { type: String, default: 'USD' },
    defaultType: { type: String, default: 'VOUCHER' }
  },
  emits: ['update:modelValue','submit'],
  data() {
    return {
      form: {
        type: this.defaultType,
        value: null,
        currency: this.defaultCurrency,
        validUntil: '',
        note: ''
      }
    }
  },
  computed: {
    summary() {
      if (!this.form.value) return ''
      const money = `${this.form.currency} ${this.form.value}`
      if (this.form.type === 'REFUND') return `Refund of ${money}`
      return `${this.form.type} of ${money} valid until ${this.form.validUntil || '—'}`
    }
  },
  watch: {
    // Resetuj formu pri otvaranju dijaloga (opciono, ali korisno)
    modelValue(open) {
      if (open) {
        this.form = {
          type: this.defaultType,
          value: null,
          currency: this.defaultCurrency,
          validUntil: '',
          note: ''
        }
      }
    }
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false)
    },
    submit() {
      this.$emit('submit', {
        caseId: this.ticket?.id,
        ...this.form
      })
      this.close()
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/warm-theme.scss';

.compensation-dialog {
  .warm-card {
    background: linear-gradient(135deg, #FEF3E8 0%, #FDF7F0 100%);
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(212, 115, 10, 0.15);
    overflow: hidden;

    .warm-card-title {
      background: linear-gradient(135deg, #059669 0%, #10B981 100%);
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

      .case-info {
        .info-title {
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

        .case-details {
          .detail-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            background: rgba(254, 243, 232, 0.6);
            border-radius: 12px;
            border-left: 4px solid var(--warm-primary);

            .detail-icon {
              color: var(--warm-primary);
              font-size: 1.2rem;
              flex-shrink: 0;
            }

            .detail-content {
              flex-grow: 1;

              .detail-label {
                display: block;
                font-size: 0.8rem;
                color: var(--warm-text-secondary);
                font-weight: 500;
                margin-bottom: 2px;
              }

              .detail-value {
                display: block;
                color: var(--warm-text);
                font-weight: 600;
                font-size: 0.9rem;
              }
            }
          }
        }
      }

      .compensation-form {
        .form-title {
          color: #059669;
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 16px;
          display: flex;
          align-items: center;

          .v-icon {
            color: #059669;
          }
        }

        .compensation-toggle {
          width: 100%;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(212, 115, 10, 0.1);

          .toggle-btn {
            flex: 1;
            border-radius: 0;
            height: 56px;
            font-weight: 600;
            text-transform: none;
            font-size: 0.95rem;

            &.v-btn--active {
              background: linear-gradient(135deg, #059669 0%, #10B981 100%);
              color: white;
            }

            &:not(.v-btn--active) {
              background: rgba(254, 243, 232, 0.8);
              color: var(--warm-text);
              border: 1px solid rgba(212, 115, 10, 0.2);

              &:hover {
                background: rgba(212, 115, 10, 0.1);
              }
            }

            .v-icon {
              font-size: 1.2rem;
            }
          }
        }

        .warm-input,
        .warm-select,
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
        }

        .summary-alert {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 12px;

          :deep(.v-alert__content) {
            color: var(--warm-text);
            font-weight: 500;
          }

          :deep(.v-icon) {
            color: #10B981;
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
          background: linear-gradient(135deg, #059669 0%, #10B981 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);

          &:hover:not(:disabled) {
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
          }

          &:disabled {
            background: rgba(16, 185, 129, 0.3);
            color: rgba(255, 255, 255, 0.6);
            box-shadow: none;
          }
        }

        &.warm-btn-outline {
          border: 2px solid #059669;
          color: #059669;
          background: rgba(254, 243, 232, 0.5);

          &:hover:not(:disabled) {
            background: #059669;
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

// Vuetify select menu override
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

// Divider styling
:deep(.v-divider) {
  border-color: rgba(212, 115, 10, 0.2);
  margin: 0 -8px;
}
</style>
