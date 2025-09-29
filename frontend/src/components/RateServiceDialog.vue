<!-- src/components/RateServiceDialog.vue -->
<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="500"
    persistent
  >
    <v-card class="rating-dialog" elevation="16" rounded="xl">
      <!-- Header -->
      <div class="dialog-header">
        <div class="header-content">
          <v-icon size="32" color="white" class="mr-3">mdi-star</v-icon>
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

      <v-card-text class="pa-6">
        <!-- Ticket Info -->
        <div class="ticket-info mb-4">
          <div class="info-row">
            <span class="label">Ticket ID:</span>
            <span class="value">#{{ ticket?.id }}</span>
          </div>
          <div class="info-row">
            <span class="label">Subject:</span>
            <span class="value">{{ ticket?.subject || 'N/A' }}</span>
          </div>
        </div>

        <v-divider class="my-4" />

        <!-- Rating Section -->
        <div class="rating-section">
          <h4 class="section-title mb-3">Overall Satisfaction</h4>
          
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
                size="32"
                :color="n <= rating ? '#FFD700' : '#E0E0E0'"
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
        <div class="comment-section mt-4">
          <h4 class="section-title mb-3">Additional Comments (Optional)</h4>
          <v-textarea
            v-model="comment"
            variant="outlined"
            placeholder="Tell us more about your experience..."
            rows="3"
            auto-grow
            counter="500"
            maxlength="500"
            class="comment-field"
          />
        </div>

        <!-- Error Message -->
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mt-3"
          :text="errorMessage"
        />
      </v-card-text>

      <v-card-actions class="pa-6 pt-0">
        <v-btn 
          variant="outlined" 
          @click="close"
          class="flex-grow-1"
        >
          Cancel
        </v-btn>
        <v-spacer />
        <v-btn 
          color="primary" 
          @click="submit"
          :loading="submitting"
          :disabled="rating === 0"
          class="flex-grow-1"
          prepend-icon="mdi-send"
        >
          Submit Rating
        </v-btn>
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

<style scoped>


/* Header */
.dialog-header {
  padding: 20px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-content {
  display: flex;
  align-items: center;
}

.dialog-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.dialog-subtitle {
  margin: 2px 0 0 0;
  opacity: 0.9;
  font-size: 0.875rem;
}



/* Content */
.ticket-info {
  padding: 16px;
  border-radius: 8px;
  border: 1px solid rgba(100, 181, 246, 0.2);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.info-row:last-child {
  margin-bottom: 0;
}



/* Star Rating */
.star-rating {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.star-btn {
  transition: transform 0.2s ease;
}

.star-btn:hover {
  transform: scale(1.1);
}

.star-btn.active {
  transform: scale(1.1);
}

.rating-text {
  text-align: center;
  font-size: 1rem;
  font-weight: 500;
}

.rating-label {
  color: #64b5f6;
}

/* Comment */
.comment-field :deep(.v-field) {
  background: white;
  border-radius: 8px;
}
</style>