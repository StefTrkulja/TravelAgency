<!-- src/components/RateServiceDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
    persistent
    class="rating-dialog-wrapper"
  >
    <v-card class="rating-dialog" elevation="0" rounded="xl">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-content">
          <v-icon size="32" color="white" class="mr-3 header-icon">mdi-star</v-icon>
          <div>
            <h3 class="dialog-title">Rate Our Service</h3>
            <p class="dialog-subtitle">How satisfied are you with our resolution?</p>
          </div>
        </div>
        <v-btn
          icon
          variant="text"
          size="small"
          @click="close"
          class="close-btn"
        >
          <v-icon color="white">mdi-close</v-icon>
        </v-btn>
      </div>

      <v-card-text class="pa-8">
        <!-- Ticket Info -->
        <div class="ticket-info mb-6">
          <div class="info-row">
            <span class="label">Ticket ID:</span>
            <span class="value">#{{ ticket?.id }}</span>
          </div>
          <div class="info-row">
            <span class="label">Subject:</span>
            <span class="value">{{ ticket?.subject || 'N/A' }}</span>
          </div>
        </div>

        <v-divider class="my-6 custom-divider" />

        <!-- Rating Section -->
        <div class="rating-section">
          <h4 class="section-title mb-4">Overall Satisfaction</h4>
          
          <div class="star-rating">
            <v-btn
              v-for="n in 5"
              :key="n"
              icon
              size="large"
              variant="text"
              @click="setRating(n)"
              class="star-btn"
              :class="{ active: n <= rating }"
            >
              <v-icon 
                size="36"
                :color="n <= rating ? '#F59E0B' : '#E5E7EB'"
              >
                {{ n <= rating ? 'mdi-star' : 'mdi-star-outline' }}
              </v-icon>
            </v-btn>
          </div>
          
          <div class="rating-text">
            <span v-if="rating === 0" class="text-medium-emphasis">Click stars to rate</span>
            <span v-else class="rating-label">{{ getRatingLabel() }}</span>
          </div>
        </div>

        <!-- Comment Section -->
        <div class="comment-section mt-6">
          <h4 class="section-title mb-4">Additional Comments (Optional)</h4>
          <v-textarea
            v-model="comment"
            variant="outlined"
            placeholder="Tell us more about your experience..."
            rows="3"
            auto-grow
            counter="500"
            maxlength="500"
            class="comment-field"
            color="primary"
          />
        </div>

        <!-- Error Message -->
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mt-4 error-alert"
          closable
          @click:close="errorMessage = ''"
        >
          {{ errorMessage }}
        </v-alert>
      </v-card-text>

      <v-card-actions class="pa-8 pt-0">
        <div class="actions-container">
          <v-btn 
            variant="outlined" 
            @click="close"
            class="cancel-btn"
            size="large"
          >
            Cancel
          </v-btn>
          <v-btn 
            color="primary" 
            @click="submit"
            :loading="submitting"
            :disabled="rating === 0"
            class="submit-btn"
            prepend-icon="mdi-send"
            size="large"
          >
            Submit Rating
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import axiosInstance from '@/utils/axiosInstance'

export default {
  name: 'RateServiceDialog',
  props: {
    modelValue: { type: Boolean, default: false },
    ticket: { type: Object, default: () => ({}) }
  },
  emits: ['update:modelValue', 'rated'],
  
  data() {
    return {
      rating: 0,
      comment: '',
      submitting: false,
      errorMessage: ''
    }
  },

  watch: {
    modelValue(open) {
      if (open) {
        this.resetForm()
      }
    }
  },

  methods: {
    setRating(value) {
      this.rating = value
      this.errorMessage = ''
    },

    getRatingLabel() {
      const labels = {
        1: 'Very Dissatisfied',
        2: 'Dissatisfied', 
        3: 'Neutral',
        4: 'Satisfied',
        5: 'Very Satisfied'
      }
      return labels[this.rating] || ''
    },

    resetForm() {
      this.rating = 0
      this.comment = ''
      this.errorMessage = ''
      this.submitting = false
    },

    close() {
      this.$emit('update:modelValue', false)
    },

    async submit() {
      if (this.rating === 0) {
        this.errorMessage = 'Please select a rating'
        return
      }

      this.submitting = true
      this.errorMessage = ''

      try {
        const payload = {
          complaintId: this.ticket.id,
          rating: this.rating,
          comment: this.comment.trim() || null
        }

        await axiosInstance.post('/satisfaction', payload)
        
        this.$emit('rated', {
          ticketId: this.ticket.id,
          rating: this.rating,
          comment: this.comment
        })
        
        this.close()
        
      } catch (error) {
        console.error('Rating submission error:', error)
        
        if (error.response?.data?.errors) {
          this.errorMessage = error.response.data.errors[0]?.message || 'Failed to submit rating'
        } else {
          this.errorMessage = 'Failed to submit rating. Please try again.'
        }
      } finally {
        this.submitting = false
      }
    }
  }
}
</script>

<style scoped lang="scss">
@import '@/assets/styles/warm-theme.scss';

.rating-dialog-wrapper {
  :deep(.v-overlay__content) {
    margin: 24px;
  }
}

.rating-dialog {
  background: var(--warm-surface) !important;
  box-shadow: var(--warm-shadow-lg) !important;
  border: 1px solid rgba(245, 158, 11, 0.1) !important;
  overflow: hidden;
}

/* Header */
.dialog-header {
  padding: 24px 32px;
  background: var(--warm-gradient);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><g fill="rgba(255,255,255,0.05)"><circle cx="20" cy="20" r="1.5"/></g></svg>') repeat;
    opacity: 0.3;
  }
}

.header-content {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
}

.header-icon {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  padding: 8px;
  transition: all 0.3s ease !important;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
}

.dialog-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0.3px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.dialog-subtitle {
  margin: 4px 0 0 0;
  opacity: 0.9;
  font-size: 0.95rem;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.close-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  position: relative;
  z-index: 1;
  transition: all 0.2s ease !important;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2) !important;
  }
}

/* Content */
.ticket-info {
  padding: 20px;
  border-radius: var(--border-radius-md);
  background: rgba(245, 158, 11, 0.05);
  border: 1px solid rgba(245, 158, 11, 0.2);
  backdrop-filter: blur(10px);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.label {
  font-weight: 600;
  color: var(--warm-brown);
  font-size: 0.9rem;
}

.value {
  font-weight: 500;
  color: var(--warm-text);
  font-size: 0.9rem;
}

.custom-divider {
  border-color: rgba(245, 158, 11, 0.2) !important;
  margin: 24px 0 !important;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--warm-brown);
  letter-spacing: 0.3px;
  text-align: center;
}

/* Star Rating */
.star-rating {
  display: flex;
  justify-content: center;
  gap: 4px;
  margin-bottom: 20px;
}

.star-btn {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  border-radius: 50% !important;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: var(--warm-gradient);
    border-radius: 50%;
    transition: all 0.3s ease;
    transform: translate(-50%, -50%);
    z-index: -1;
  }
  
  // Removed hover and scaling effects for better UX
}

.rating-text {
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  min-height: 1.5rem;
}

.rating-label {
  color: var(--warm-orange);
  text-shadow: 0 1px 2px rgba(212, 115, 10, 0.1);
}

.text-medium-emphasis {
  color: rgba(28, 25, 23, 0.6);
  font-style: italic;
}

/* Comment */
.comment-field {
  :deep(.v-field) {
    background: rgba(255, 255, 255, 0.8) !important;
    border-radius: var(--border-radius-md) !important;
    box-shadow: var(--warm-shadow-sm) !important;
    transition: all 0.3s ease !important;
    
    &:hover {
      box-shadow: var(--warm-shadow-md) !important;
      
    }
    
    &.v-field--focused {
      box-shadow: var(--warm-glow) !important;
    }
  }
  
  :deep(.v-field__outline) {
    --v-field-border-opacity: 0.3;
  }
  
  :deep(.v-field--focused .v-field__outline) {
    --v-field-border-opacity: 1;
  }
  
  :deep(.v-field__input) {
    font-weight: 500;
    letter-spacing: 0.3px;
    color: var(--warm-text) !important;
  }
}

.error-alert {
  border-radius: var(--border-radius-md) !important;
  box-shadow: var(--warm-shadow-sm) !important;
  
  :deep(.v-alert__content) {
    font-weight: 500;
  }
}

/* Actions */
.actions-container {
  display: flex;
  gap: 16px;
  width: 100%;
}

.cancel-btn, .submit-btn {
  flex: 1;
  border-radius: var(--border-radius-md) !important;
  font-weight: 600 !important;
  text-transform: none !important;
  letter-spacing: 0.3px !important;
  height: 48px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

.cancel-btn {
  border-width: 2px !important;
  border-color: rgba(212, 115, 10, 0.4) !important;
  color: var(--warm-orange) !important;
  
  &:hover {
    background: rgba(212, 115, 10, 0.05) !important;
    border-color: var(--warm-orange) !important;
    box-shadow: var(--warm-shadow-sm) !important;
  }
}

.submit-btn {
  box-shadow: var(--warm-shadow-sm) !important;
  
  &:hover:not(:disabled) {
    box-shadow: var(--warm-shadow-md) !important;
  }
  
  &:disabled {
    opacity: 0.6 !important;
    transform: none !important;
    box-shadow: none !important;
  }
  
  :deep(.v-btn__loader) {
    color: white !important;
  }
}

/* Media queries */
@media (max-width: 600px) {
  .rating-dialog-wrapper {
    :deep(.v-overlay__content) {
      margin: 16px;
    }
  }
  
  .dialog-header {
    padding: 20px 24px;
  }
  
  .dialog-title {
    font-size: 1.2rem;
  }
  
  .dialog-subtitle {
    font-size: 0.85rem;
  }
  
  :deep(.v-card-text) {
    padding: 24px !important;
  }
  
  :deep(.v-card-actions) {
    padding: 24px !important;
    padding-top: 0 !important;
  }
  
  .star-rating {
    gap: 2px;
  }
  
  .star-btn .v-icon {
    font-size: 28px !important;
  }
  
  .actions-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .cancel-btn, .submit-btn {
    height: 44px !important;
  }
}

/* Focus states */
.cancel-btn:focus-visible,
.submit-btn:focus-visible {
  outline: 2px solid var(--warm-amber) !important;
  outline-offset: 2px !important;
}
</style>
