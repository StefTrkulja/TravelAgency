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
            <h1 class="activities-title font-heading">Travel Activities</h1>
            <h2 class="activities-subtitle">{{ arrangement?.title || 'Loading arrangement...' }}</h2>
          </div>
        </div>
        
        <div class="header-stats">
          <v-chip 
            color="white" 
            variant="flat" 
            prepend-icon="mdi-counter"
            class="stats-chip"
          >
            {{ activities.length }} Available
          </v-chip>
          
          <v-chip 
            v-if="bookings.length > 0"
            color="white" 
            variant="flat" 
            prepend-icon="mdi-bookmark-check"
            class="stats-chip"
          >
            {{ bookings.length }} Booked
          </v-chip>
        </div>
      </div>
    </div>

    <!-- Arrangement Overview -->
    <div v-if="arrangement" class="section-container">
      <v-card class="modern-card arrangement-card" elevation="0">
        <v-card-text class="pa-8">
          <div class="section-header">
            <v-icon color="primary" size="32">mdi-airplane</v-icon>
            <h3 class="section-title">{{ arrangement.title }}</h3>
          </div>
          
          <p class="section-description">{{ arrangement.summary }}</p>

          <v-row class="details-grid">
            <v-col cols="12" md="6">
              <v-card class="detail-card travel-details" elevation="0">
                <v-card-text class="pa-6">
                  <div class="detail-header">
                    <v-icon color="primary">mdi-calendar-range</v-icon>
                    <h4 class="detail-title">Travel Details</h4>
                  </div>
                  
                  <div class="detail-items">
                    <div class="detail-item">
                      <v-icon size="18" color="primary">mdi-calendar-start</v-icon>
                      <span><strong>Departure:</strong> {{ formatDate(departure?.startDate) }}</span>
                    </div>
                    <div class="detail-item">
                      <v-icon size="18" color="primary">mdi-calendar-end</v-icon>
                      <span><strong>Return:</strong> {{ formatDate(departure?.endDate) }}</span>
                    </div>
                    <div class="detail-item">
                      <v-icon size="18" color="primary">mdi-map-marker</v-icon>
                      <span><strong>Destination:</strong> {{ arrangement.destination?.name }}</span>
                    </div>
                    <div class="detail-item">
                      <v-icon size="18" color="primary">mdi-car</v-icon>
                      <span><strong>Transport:</strong> {{ arrangement.transportType }}</span>
                    </div>
                    <div class="detail-item">
                      <v-icon size="18" color="primary">mdi-bed</v-icon>
                      <span><strong>Accommodation:</strong> {{ arrangement.accommodationType }}</span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            
            <v-col cols="12" md="6">
              <v-card class="detail-card booking-details" elevation="0">
                <v-card-text class="pa-6">
                  <div class="detail-header">
                    <v-icon color="success">mdi-bookmark-check</v-icon>
                    <h4 class="detail-title">Booking Information</h4>
                  </div>
                  
                  <div class="detail-items">
                    <div class="detail-item">
                      <v-icon size="18" color="success">mdi-calendar-clock</v-icon>
                      <span><strong>Booked:</strong> {{ formatDate(booking.bookingDate) }}</span>
                    </div>
                    <div class="detail-item">
                      <v-icon size="18" color="success">mdi-account-group</v-icon>
                      <span><strong>Travelers:</strong> {{ booking.travelersCount }}</span>
                    </div>
                    <div class="detail-item">
                      <v-icon size="18" color="success">mdi-check-circle</v-icon>
                      <span><strong>Status:</strong></span>
                      <v-chip size="small" :color="getBookingStatusColor(booking.status)" variant="flat" class="ml-2">
                        {{ booking.status }}
                      </v-chip>
                    </div>
                    <div class="detail-item">
                      <v-icon size="18" color="success">mdi-currency-eur</v-icon>
                      <span><strong>Total:</strong></span>
                      <span class="price-highlight">€{{ booking.grandTotal }}</span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </div>

    <!-- Recommended Activities Section -->
    <div v-if="recommendedActivities.length > 0" class="section-container">
      <div class="section-header-large">
        <v-icon color="orange" size="36">mdi-star-circle</v-icon>
        <div>
          <h3 class="section-title-large">Recommended for You</h3>
          <p class="section-description">Personalized activity suggestions based on your preferences</p>
        </div>
      </div>
      
      <v-row class="activities-grid">
        <v-col
          v-for="activity in recommendedActivities"
          :key="`rec-${activity.id}`"
          cols="12" sm="6" lg="4" xl="3"
        >
          <v-card 
            class="modern-card activity-card recommended-card"
            elevation="0"
            hover
          >
            <div class="activity-image-container">
              <v-img
                v-if="activity.imagePath"
                :src="`http://localhost:3000/${activity.imagePath}`"
                alt="Activity image"
                height="240"
                cover
                class="activity-image"
              />
              <div
                v-else
                class="activity-placeholder"
              >
                <v-icon size="64" color="orange-lighten-1">mdi-image-outline</v-icon>
              </div>

              <div class="activity-badges">
                <v-chip
                  color="orange"
                  variant="flat"
                  class="recommendation-badge"
                  prepend-icon="mdi-star"
                >
                  {{ activity.recommendationScore }}/100
                </v-chip>

                <v-chip
                  color="primary"
                  variant="flat"
                  class="price-badge"
                >
                  ${{ activity.price }}
                </v-chip>
              </div>
            </div>

            <v-card-text class="pa-6">
              <h4 class="activity-title">{{ activity.name }}</h4>
              <p class="activity-description">{{ activity.description }}</p>

              <div v-if="activity.recommendationReasons?.length" class="recommendation-reasons">
                <div class="reasons-label">Why we recommend this:</div>
                <div class="reasons-chips">
                  <v-chip
                    v-for="reason in activity.recommendationReasons"
                    :key="reason"
                    size="small"
                    variant="tonal"
                    color="orange"
                    class="reason-chip"
                  >
                    {{ reason }}
                  </v-chip>
                </div>
              </div>

              <v-select
                v-model="selectedSchedule[activity.id]"
                :items="schedules[activity.id] || []"
                item-title="label"
                item-value="id"
                label="Select Timeslot"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-clock-outline"
                class="schedule-select"
              />

              <div v-if="selectedSchedule[activity.id]" class="remaining-spots">
                <v-icon size="16" color="success">mdi-account-group</v-icon>
                {{ (schedules[activity.id].find(s => s.id === selectedSchedule[activity.id])?.remaining) ?? 'N/A' }} spots remaining
              </div>
            </v-card-text>

            <v-card-actions class="pa-6 pt-0">
              <v-btn
                color="orange"
                variant="elevated"
                block
                size="large"
                prepend-icon="mdi-star-plus"
                class="action-btn recommended-btn"
                @click="openBookingDialog(activity)"
              >
                Book Recommended
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- All Activities Section -->
    <div class="section-container">
      <div class="section-header-large">
        <v-icon color="primary" size="36">mdi-map-marker-multiple</v-icon>
        <div class="flex-grow-1">
          <h3 class="section-title-large">All Activities</h3>
          <p class="section-description">Discover all available activities for your destination</p>
        </div>
        
        <v-btn
          :variant="showAll ? 'flat' : 'tonal'"
          :color="showAll ? 'primary' : 'grey'"
          @click="showAll = !showAll"
          prepend-icon="mdi-eye"
          class="toggle-btn"
        >
          {{ showAll ? 'Show Less' : 'Show All' }}
        </v-btn>
      </div>
      
      <v-row class="activities-grid">
        <v-col
          v-for="a in visibleActivities"
          :key="a.id"
          cols="12" sm="6" lg="4" xl="3"
        >
          <v-card
            class="modern-card activity-card"
            elevation="0"
            hover
          >
            <div class="activity-image-container">
              <v-img
                v-if="a.imagePath"
                :src="`http://localhost:3000/${a.imagePath}`"
                alt="Activity image"
                height="240"
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
                class="activity-placeholder"
              >
                <v-icon size="64" color="grey-lighten-1">mdi-image-outline</v-icon>
              </div>

              <div class="activity-badges">
                <v-chip
                  :color="a.status === 'ACTIVE' ? 'success' : 'warning'"
                  variant="flat"
                  size="small"
                  class="status-badge"
                >
                  {{ a.status }}
                </v-chip>

                <v-chip
                  color="primary"
                  variant="flat"
                  class="price-badge"
                >
                  ${{ a.price }}
                </v-chip>
              </div>
            </div>

            <v-card-text class="pa-6">
              <h4 class="activity-title">{{ a.name }}</h4>
              <p class="activity-description">{{ a.description }}</p>

              <div class="activity-details">
                <div class="detail-row">
                  <div class="detail-item-inline">
                    <v-icon size="16" color="grey-darken-1">mdi-account-group</v-icon>
                    <span>Max: {{ a.maxCapacity }}</span>
                  </div>
                  <div class="detail-item-inline">
                    <v-icon size="16" color="grey-darken-1">mdi-clock-outline</v-icon>
                    <span>{{ a.lengthInMin || 60 }}min</span>
                  </div>
                </div>
                <div class="detail-row" v-if="a.difficulty">
                  <div class="detail-item-inline">
                    <v-icon size="16" color="grey-darken-1">mdi-speedometer</v-icon>
                    <span>Level {{ a.difficulty }}/5</span>
                  </div>
                </div>
              </div>

              <div class="feature-tags">
                <v-chip
                  v-if="a.isPetFriendly"
                  size="small"
                  color="green"
                  variant="tonal"
                  class="feature-chip"
                >
                  Pet Friendly
                </v-chip>
                <v-chip
                  v-if="a.isAdventurous"
                  size="small"
                  color="orange"
                  variant="tonal"
                  class="feature-chip"
                >
                  Adventure
                </v-chip>
                <v-chip
                  v-if="a.isBusiness"
                  size="small"
                  color="blue"
                  variant="tonal"
                  class="feature-chip"
                >
                  Business
                </v-chip>
              </div>

              <v-select
                v-model="selectedSchedule[a.id]"
                :items="schedules[a.id] || []"
                item-title="label"
                item-value="id"
                label="Select Timeslot"
                variant="outlined"
                density="comfortable"
                prepend-inner-icon="mdi-clock-outline"
                class="schedule-select"
              />

              <div v-if="selectedSchedule[a.id]" class="remaining-spots">
                <v-icon size="16" color="success">mdi-account-group</v-icon>
                {{ (schedules[a.id].find(s => s.id === selectedSchedule[a.id])?.remaining) ?? 'N/A' }} spots remaining
              </div>
            </v-card-text>

            <v-card-actions class="pa-6 pt-0">
              <v-btn
                color="primary"
                variant="elevated"
                block
                size="large"
                prepend-icon="mdi-calendar-plus"
                class="action-btn"
                @click="openBookingDialog(a)"
              >
                Book Activity
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Show/Hide toggle for large lists -->
    <div v-if="activities.length > 6" class="text-center mb-8">
      <v-btn 
        variant="tonal" 
        color="primary"
        size="large"
        @click="showAll = !showAll"
        class="toggle-btn-large"
      >
        {{ showAll ? 'Show Less Activities' : `Show All ${activities.length} Activities` }}
      </v-btn>
    </div>

    <!-- Booked Activities Section -->
    <div class="section-container">
      <div class="section-header-large">
        <v-icon color="success" size="36">mdi-bookmark-check</v-icon>
        <div>
          <h3 class="section-title-large">Your Booked Activities</h3>
          <p class="section-description">Manage your activity bookings and share your experiences</p>
        </div>
      </div>
      
      <v-alert v-if="bookings.length === 0" type="info" variant="tonal" class="modern-alert" prominent>
        <template v-slot:prepend>
          <v-icon>mdi-information</v-icon>
        </template>
        <strong>No booked activities yet.</strong> Start exploring the activities above to book your first adventure!
      </v-alert>
      
      <v-row class="bookings-grid">
        <v-col
          v-for="b in bookings"
          :key="b.id"
          cols="12"
        >
          <v-card
            class="modern-card booking-card"
            elevation="0"
            hover
          >
            <v-card-text class="pa-8">
              <div class="booking-header">
                <div class="booking-main-info">
                  <div class="booking-title-row">
                    <v-icon color="primary" size="24">mdi-calendar-check</v-icon>
                    <h4 class="booking-activity-title">
                      {{ b.activitySchedule?.activity?.name }}
                    </h4>
                  </div>
                  
                  <div class="booking-time">
                    <v-icon size="16" color="grey-darken-1">mdi-clock-outline</v-icon>
                    <span>
                      {{ formatDate(b.activitySchedule?.startTime) }} → {{ formatDate(b.activitySchedule?.endTime) }}
                    </span>
                  </div>
                  
                  <div class="booking-details-row">
                    <div class="booking-detail">
                      <v-icon size="16" color="grey-darken-1">mdi-account-group</v-icon>
                      <strong>{{ b.numberOfParticipants }}</strong> participants
                    </div>
                    <div class="booking-detail">
                      <v-icon size="16" color="grey-darken-1">mdi-currency-eur</v-icon>
                      <strong>${{ b.totalPrice }}</strong>
                    </div>
                  </div>
                  
                  <v-alert
                    v-if="b.isCancelled"
                    type="error"
                    variant="tonal"
                    density="compact"
                    class="mt-4 cancellation-alert"
                  >
                    <template v-slot:prepend>
                      <v-icon>mdi-cancel</v-icon>
                    </template>
                    <strong>Cancelled:</strong> {{ b.cancellationReason }}
                  </v-alert>
                </div>
                
                <div class="booking-actions">
                  <v-btn 
                    v-if="new Date(b.activitySchedule?.endTime) >= new Date()"
                    size="small" 
                    variant="outlined" 
                    color="primary"
                    prepend-icon="mdi-pencil"
                    class="action-btn-small"
                    @click="editBooking(b)"
                  >
                    Edit
                  </v-btn>
                  <v-btn 
                    v-if="new Date(b.activitySchedule?.endTime) >= new Date()"
                    size="small" 
                    variant="outlined" 
                    color="error"
                    prepend-icon="mdi-cancel"
                    class="action-btn-small"
                    @click="openCancelDialog(b)"
                  >
                    Cancel
                  </v-btn>
                  <v-btn
                    v-if="new Date(b.activitySchedule?.endTime) < new Date() && !b.review"
                    size="small"
                    variant="elevated"
                    color="primary"
                    prepend-icon="mdi-star-plus"
                    class="action-btn-small"
                    @click="openReviewDialog(b)"
                  >
                    Add Review
                  </v-btn>
                </div>
              </div>

              <!-- User's Review Section -->
              <div v-if="b.review" class="review-section">
                <v-divider class="my-6" />
                <v-card class="review-card" elevation="0">
                  <v-card-text class="pa-6">
                    <div class="review-header">
                      <div class="review-header-left">
                        <v-icon color="success" size="24">mdi-star-circle</v-icon>
                        <h5 class="review-title">Your Review</h5>
                      </div>
                      
                      <div class="review-actions">
                        <v-btn 
                          size="small" 
                          variant="text" 
                          color="success"
                          prepend-icon="mdi-pencil"
                          class="action-btn-small"
                          @click="openReviewDialog(b, 'edit')"
                        >
                          Edit
                        </v-btn>
                        <v-btn 
                          size="small" 
                          variant="text" 
                          color="error"
                          prepend-icon="mdi-delete"
                          class="action-btn-small"
                          @click="deleteReview(b)"
                        >
                          Delete
                        </v-btn>
                      </div>
                    </div>

                    <div class="overall-rating">
                      <v-rating
                        :model-value="b.review.overallRating"
                        readonly
                        color="success"
                        size="28"
                        class="rating-stars"
                      />
                      <div class="rating-score">
                        <div class="score-number">{{ b.review.overallRating }}/5</div>
                        <div class="score-label">Overall Rating</div>
                      </div>
                    </div>

                    <div class="detailed-ratings">
                      <div class="rating-item">
                        <div class="rating-label">Organization</div>
                        <v-rating 
                          :model-value="b.review.organizationRating" 
                          readonly 
                          color="success"
                          size="20" 
                        />
                        <div class="rating-value">{{ b.review.organizationRating }}/5</div>
                      </div>
                      
                      <div class="rating-item">
                        <div class="rating-label">Guide</div>
                        <v-rating 
                          :model-value="b.review.guideRating" 
                          readonly 
                          color="success"
                          size="20"
                        />
                        <div class="rating-value">{{ b.review.guideRating }}/5</div>
                      </div>
                      
                      <div class="rating-item">
                        <div class="rating-label">Value</div>
                        <v-rating 
                          :model-value="b.review.valueForMoneyRating" 
                          readonly 
                          color="success"
                          size="20"
                        />
                        <div class="rating-value">{{ b.review.valueForMoneyRating }}/5</div>
                      </div>
                      
                      <div class="rating-item">
                        <div class="rating-label">Safety</div>
                        <v-rating 
                          :model-value="b.review.safetyRating" 
                          readonly 
                          color="success"
                          size="20"
                        />
                        <div class="rating-value">{{ b.review.safetyRating }}/5</div>
                      </div>
                      
                      <div class="rating-item">
                        <div class="rating-label">Fun Factor</div>
                        <v-rating 
                          :model-value="b.review.funRating" 
                          readonly 
                          color="success"
                          size="20"
                        />
                        <div class="rating-value">{{ b.review.funRating }}/5</div>
                      </div>
                      
                      <div class="rating-item">
                        <div class="rating-label">Would Revisit</div>
                        <v-chip 
                          :color="b.review.wouldRevisit ? 'success' : 'warning'"
                          variant="flat"
                          size="small"
                          :prepend-icon="b.review.wouldRevisit ? 'mdi-check' : 'mdi-close'"
                          class="revisit-chip"
                        >
                          {{ b.review.wouldRevisit ? 'Yes' : 'No' }}
                        </v-chip>
                      </div>
                    </div>

                    <div v-if="b.review.comment" class="review-comment">
                      <v-divider class="mb-4" />
                      <div class="comment-content">
                        <v-icon color="success" size="20">mdi-comment-quote</v-icon>
                        <div class="comment-text">
                          <div class="comment-label">Your Comment</div>
                          <p class="comment-body">
                            "{{ b.review.comment }}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </v-card-text>
                </v-card>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>


    <!-- Review Dialog -->
<v-dialog v-model="reviewDialog.open" max-width="500">
  <v-card>
    <v-card-title>{{ reviewDialog.mode === 'edit' ? 'Edit Review' : 'Leave a Review' }}</v-card-title>
    <v-card-text>
      <div class="mb-3">
        <div class="text-subtitle-2">Overall</div>
        <v-rating v-model="reviewDialog.form.overallRating" />
      </div>

      <div class="mb-3">
        <div class="text-subtitle-2">Organization</div>
        <v-rating v-model="reviewDialog.form.organizationRating" />
      </div>

      <div class="mb-3">
        <div class="text-subtitle-2">Guide</div>
        <v-rating v-model="reviewDialog.form.guideRating" />
      </div>

      <div class="mb-3">
        <div class="text-subtitle-2">Value for Money</div>
        <v-rating v-model="reviewDialog.form.valueForMoneyRating" />
      </div>

      <div class="mb-3">
        <div class="text-subtitle-2">Safety</div>
        <v-rating v-model="reviewDialog.form.safetyRating" />
      </div>

      <div class="mb-3">
        <div class="text-subtitle-2">Fun</div>
        <v-rating v-model="reviewDialog.form.funRating" />
      </div>

      <v-switch v-model="reviewDialog.form.wouldRevisit" label="Would revisit?" />
      <v-textarea v-model="reviewDialog.form.comment" label="Comment" />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="reviewDialog.open = false">Cancel</v-btn>
      <v-btn color="primary" type="button" @click.prevent="saveReview">
        {{ reviewDialog.mode === 'edit' ? 'Update Review' : 'Save Review' }}
        </v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>





    <!-- Edit Participants Dialog -->
<v-dialog v-model="editDialog.open" max-width="600">
  <v-card>
    <v-card-title>Edit Participants</v-card-title>
    <v-card-text>
      <div v-for="(p, idx) in editDialog.participants" :key="p.id" class="mb-4">
        <h4 class="text-subtitle-2">Passenger {{ idx+1 }}</h4>
        <v-text-field v-model="p.firstName" label="First Name" />
        <v-text-field v-model="p.lastName" label="Last Name" />
        <v-text-field v-model="p.email" label="Email" />
        <v-text-field v-model="p.dateOfBirth" label="Date of Birth" type="date" />
        <v-select v-model="p.allergy" :items="['NONE','NUTS','GLUTEN','DAIRY','OTHER']" label="Allergy" />
        <v-select v-model="p.medicalCondition" :items="['NONE','ASTHMA','DIABETES','HEART','OTHER']" label="Medical Condition" />
        <v-text-field v-model="p.preferences" label="Preferences" />
        <v-text-field v-model="p.specialRequirements" label="Special Note" />
        <v-btn color="error" variant="text" @click="deleteParticipant(p)">Delete</v-btn>
      </div>

      <v-btn
        v-if="canAddParticipant(editDialog.booking)"
        variant="outlined"
        color="primary"
        @click="addParticipantForm"
      >
        + Add Participant
      </v-btn>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="editDialog.open = false">Cancel</v-btn>
      <v-btn color="primary" @click="saveEditedParticipants">Save</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>



    <!-- Cancel Booking Dialog -->
<v-dialog v-model="cancelDialog.open" max-width="400">
  <v-card>
    <v-card-title>Cancel Booking</v-card-title>
    <v-card-text>
      <v-text-field
        v-model="cancelDialog.reason"
        label="Reason for cancellation"
        required
      />
    </v-card-text>
    <v-card-actions>
      <v-spacer />
      <v-btn variant="text" @click="cancelDialog.open = false">Back</v-btn>
      <v-btn color="error" @click="confirmCancel">Confirm Cancel</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>



    <!-- Booking Dialog -->
  <v-dialog v-model="bookingDialog.open" max-width="600">
  <v-card>
    <form @submit.prevent="bookingStep === 1 ? nextStep() : saveParticipants()">
      <v-card-title>
        {{ bookingStep === 1 ? 'Book Activity' : 'Participants Info' }}
      </v-card-title>

      <v-card-text v-if="bookingStep === 1">
        <div v-if="bookingDialog.activity">
          <div class="text-subtitle-1 mb-2">{{ bookingDialog.activity.name }}</div>
          <v-select
            v-model="bookingForm.scheduleId"
            :items="schedules[bookingDialog.activity.id] || []"
            item-title="label"
            item-value="id"
            label="Select Schedule"
          />
          <v-text-field
            v-model.number="bookingForm.participants"
            label="Number of Participants"
            type="number"
            min="1"
          />
        </div>
      </v-card-text>

      <!-- STEP 2: Participant Info -->
      <v-card-text v-else>
        <div v-for="(p, idx) in participantForms" :key="idx" class="mb-4">
          <h4 class="text-subtitle-2">Passenger {{ idx+1 }}</h4>
          <v-text-field v-model="p.firstName" label="First Name" />
          <v-text-field v-model="p.lastName" label="Last Name" />
          <v-text-field v-model="p.email" label="Email" />
          <v-text-field v-model="p.dateOfBirth" label="Date of Birth" type="date" />
          <v-select v-model="p.allergy" :items="['NONE','NUTS','GLUTEN','DAIRY','OTHER']" label="Allergy" />
          <v-select v-model="p.medicalCondition" :items="['NONE','ASTHMA','DIABETES','HEART','OTHER']" label="Medical Condition" />
          <v-text-field v-model="p.preferences" label="Preferences" />
          <v-text-field v-model="p.specialRequirements" label="Special Note" />
        </div>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" type="button" @click="bookingDialog.open = false">Cancel</v-btn>
        <v-btn v-if="bookingStep === 1" color="primary" type="submit">Next</v-btn>
        <v-btn v-else color="primary" type="submit">Confirm & Pay</v-btn>
      </v-card-actions>
    </form>
  </v-card>
</v-dialog>



    <!-- Review Reminder Dialog -->
    <v-dialog v-model="reviewReminderDialog.open" max-width="500">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="mr-2" color="primary">mdi-star-outline</v-icon>
          Review Your Activities
        </v-card-title>
        <v-card-text>
          <p class="mb-3">You have completed activities that haven't been reviewed yet. Your feedback helps other travelers!</p>
          
          <div v-for="booking in unreviewedBookings" :key="booking.id" class="mb-3">
            <v-card variant="outlined" class="pa-3">
              <div class="font-weight-bold">{{ booking.activitySchedule?.activity?.name }}</div>
              <div class="text-caption">{{ formatDate(booking.activitySchedule?.endTime) }}</div>
              <v-btn 
                size="small" 
                color="primary" 
                class="mt-2"
                @click="goToReviewActivity(booking)"
              >
                Review Now
              </v-btn>
            </v-card>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dismissReviewReminder">
            Maybe Later
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.open" :timeout="2500">
      {{ snackbar.msg }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import axios from '@/utils/axiosInstance';
import { store } from '@/utils/store';
import { useRoute } from 'vue-router'
const route = useRoute();
const error = ref('')

// Get arrangementId from the booking data, not hardcoded
const activities = ref([]);
const recommendedActivities = ref([]);
const schedules = reactive({});
const bookings = ref([]);

const bookingStep = ref(1); // 1 = booking, 2 = participants
const createdBookingId = ref(null); // store booking id after creation

const participantForms = ref([]); // dynamic forms for participants

const editDialog = reactive({
  open: false,
  booking: null,
  participants: []
});

const reviewDialog = reactive({
  open: false,
  booking: null,
  mode: 'create',         // 'create' | 'edit'
  reviewId: null,
  form: {
    overallRating: 0,
    organizationRating: 0,
    guideRating: 0,
    valueForMoneyRating: 0,
    safetyRating: 0,
    funRating: 0,
    wouldRevisit: false,
    comment: ''
  }
});


const showAll = ref(false);
const selectedSchedule = reactive({});
const snackbar = reactive({ open: false, msg: '' });

// Review reminder dialog
const reviewReminderDialog = reactive({ open: false });
const unreviewedBookings = ref([]);

const bookingDialog = reactive({ open: false, activity: null });
const cancelDialog = reactive({
  open: false,
  booking: null,
  reason: ''
});
const bookingForm = reactive({ scheduleId: null, participants: 1 });

const visibleActivities = computed(() =>
  showAll.value ? activities.value : activities.value.slice(0, 2)
);

function isScheduleWithinArrangementPeriod(schedule) {
  if (!departure.value || !schedule) return true; // Default to allow if no departure info
  
  const scheduleDate = new Date(schedule.startTime || schedule.label.split(' → ')[0]);
  const departureStart = new Date(departure.value.startDate);
  const departureEnd = new Date(departure.value.endDate || departure.value.startDate);
  
  return scheduleDate >= departureStart && scheduleDate <= departureEnd;
}

async function fetchRecommendations() {
  try {
    if (!booking.value?.id || !arrangement.value?.id) {
      console.log("Missing booking or arrangement data for recommendations");
      return;
    }
    
    console.log(`Fetching recommendations for booking ${booking.value.id} and arrangement ${arrangement.value.id}`);
    const { data } = await axios.get(`/activities/recommendations/${booking.value.id}/${arrangement.value.id}`);
    
    // Backend returns { success: true, data: [...] } or just the data array
    const recommendationsData = data.success ? data.data : data;
    
    if (recommendationsData && Array.isArray(recommendationsData)) {
      recommendedActivities.value = recommendationsData;
      console.log(`Found ${recommendedActivities.value.length} recommended activities:`, recommendedActivities.value);
      
      // Load schedules for recommended activities
      for (const activity of recommendedActivities.value) {
        if (!schedules[activity.id]) {
          const res = await axios.get(`/activities/schedules/activity/${activity.id}`);
          const scheduleItems = [];
          for (const s of res.data) {
            // Only include schedules within the arrangement period
            if (isScheduleWithinArrangementPeriod(s)) {
              const bookingsRes = await axios.get(`/activities/bookings/schedule/${s.id}`);
              const totalBooked = bookingsRes.data.reduce((sum, b) => sum + b.numberOfParticipants, 0);
              const remaining = activity.maxCapacity - totalBooked;

              scheduleItems.push({
                id: s.id,
                label: `${formatDate(s.startTime)} → ${formatDate(s.endTime)}`,
                remaining
              });
            }
          }
          schedules[activity.id] = scheduleItems;
        }
      }
    } else {
      console.log("No recommendations received or invalid format");
    }
  } catch (err) {
    console.error("Failed to load recommendations", err);
    // Fallback: try to show high-value activities
    try {
      if (!arrangement.value?.id) return;
      
      const { data } = await axios.get(`/activities/arrangement/${arrangement.value.id}`);
      const highValueActivities = data
        .filter(a => a.value > 5)
        .sort((a, b) => b.value - a.value)
        .slice(0, 2);
      
      if (highValueActivities.length > 0) {
        recommendedActivities.value = highValueActivities.map(activity => ({
          ...activity,
          recommendationScore: Math.round(activity.value * 10),
          recommendationReasons: [`Highly rated (${activity.value}/10)`]
        }));
        console.log(`Using fallback: ${recommendedActivities.value.length} high-value activities`);
      }
    } catch (fallbackErr) {
      console.error("Fallback recommendation failed", fallbackErr);
    }
  }
}

async function fetchActivities() {
  try {
    if (!arrangement.value?.id) {
      console.log("Missing arrangement data for activities");
      return;
    }
    
    const { data } = await axios.get(`/activities/arrangement/${arrangement.value.id}`);
    
    // Filter out recommended activities from the main list to avoid duplicates
    const recommendedIds = new Set(recommendedActivities.value.map(a => a.id));
    activities.value = data.filter(a => !recommendedIds.has(a.id));

    for (const a of data) {
      // load schedules for all activities (including recommended ones not yet processed)
      if (!schedules[a.id]) {
        const res = await axios.get(`/activities/schedules/activity/${a.id}`);

        // for each schedule, load bookings to calculate remaining spots
        const scheduleItems = [];
        for (const s of res.data) {
          // Only include schedules within the arrangement period
          if (isScheduleWithinArrangementPeriod(s)) {
            const bookingsRes = await axios.get(`/activities/bookings/schedule/${s.id}`);
            const totalBooked = bookingsRes.data.reduce((sum, b) => sum + b.numberOfParticipants, 0);
            const remaining = a.maxCapacity - totalBooked;

            scheduleItems.push({
              id: s.id,
              label: `${formatDate(s.startTime)} → ${formatDate(s.endTime)}`,
              remaining
            });
          }
        }

        schedules[a.id] = scheduleItems;
      }
    }
  } catch (err) {
    console.error("Failed to load activities", err);
  }
}


async function fetchBookings() {
  try {
    if (!arrangement.value?.id) {
      console.log("Missing arrangement data for bookings");
      return;
    }
    
    const { data } = await axios.get(`/activities/bookings/user/${store.username}`);
    const mine = data.filter(b => b.arrangement_booking_id === booking.value.id);

    // attach my review (if any) to each booking
    const withReviews = await Promise.all(
      mine.map(async (b) => {
        try {
          const { data: reviews } = await axios.get(`/activities/reviews/booking/${b.id}`);
          const my = Array.isArray(reviews)
            ? reviews.find(r => r.userUsername === store.username)
            : null;
          return { ...b, review: my || null };
        } catch {
          return { ...b, review: null };
        }
      })
    );

    bookings.value = withReviews;
  } catch (err) {
    console.error("Failed to load bookings", err);
  }
}


function openBookingDialog(activity) {
  bookingDialog.activity = activity;
  bookingForm.scheduleId = selectedSchedule[activity.id] || null;
  bookingForm.participants = 1;
  bookingDialog.open = true;
}

async function saveBooking(e) {
  e?.preventDefault();

  // Find the chosen schedule
  const schedule = (schedules[bookingDialog.activity.id] || [])
    .find(s => s.id === bookingForm.scheduleId);

  if (!schedule) {
    snackbar.msg = 'Please select a valid schedule';
    snackbar.open = true;
    return;
  }

  if (bookingForm.participants > schedule.remaining) {
    snackbar.msg = `Only ${schedule.remaining} spots left for this timeslot`;
    snackbar.open = true;
    return;
  }

  // Check for arrangement booking conflicts
  if (!isScheduleWithinArrangementPeriod(schedule)) {
    snackbar.msg = 'This activity is scheduled outside your travel dates. Please contact support.';
    snackbar.open = true;
    return;
  }

  try {
    const payload = {
      activity_schedule_id: bookingForm.scheduleId,
      numberOfParticipants: bookingForm.participants,
      arrangement_booking_id: booking.value?.id,
      petsIncluded: false,
      bookingDate: new Date().toISOString(),
      totalPrice: 50 * bookingForm.participants,
    };
    await axios.post('/activities/bookings/create-booking', payload);
    snackbar.msg = 'Booking created';
    snackbar.open = true;
    bookingDialog.open = false;
    await fetchBookings();
    await fetchActivities(); // refresh capacities
  } catch (err) {
    snackbar.msg = 'Failed to create booking';
    snackbar.open = true;
  }
}


async function cancelBooking(b) {
  try {
    await axios.put(`/activities/bookings/update/${b.id}`, { isCancelled: true });
    snackbar.msg = 'Booking cancelled';
    snackbar.open = true;
    await fetchBookings();
  } catch (err) {
    snackbar.msg = 'Failed to cancel booking';
    snackbar.open = true;
  }
}

function openCancelDialog(booking) {
  cancelDialog.booking = booking;
  cancelDialog.reason = '';
  cancelDialog.open = true;
}

async function confirmCancel() {
  if (!cancelDialog.reason.trim()) {
    snackbar.msg = 'Please enter a reason';
    snackbar.open = true;
    return;
  }
  try {
    await axios.put(`/activities/bookings/update/${cancelDialog.booking.id}`, {
      isCancelled: true,
      cancellationReason: cancelDialog.reason,
      cancelledAt: new Date().toISOString()
    });
    snackbar.msg = 'Booking cancelled';
    snackbar.open = true;
    cancelDialog.open = false;
    await fetchBookings();
  } catch (err) {
    snackbar.msg = 'Failed to cancel booking';
    snackbar.open = true;
  }
}


function addParticipantForm() {
  editDialog.participants.push({
    id: null,
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    allergy: 'NONE',
    medicalCondition: 'NONE',
    preferences: '',
    specialRequirements: ''
  });
}

function canAddParticipant(booking) {
  // Find schedule capacity and remaining spots
  const schedule = (schedules[booking.activitySchedule.activity_id] || [])
    .find(s => s.id === booking.activity_schedule_id);
  if (!schedule) return false;

  const currentCount = editDialog.participants.length;
  return currentCount < booking.numberOfParticipants + schedule.remaining;
}

async function deleteParticipant(p) {
  if (p.id) {
    await axios.delete(`/activities/participants/${p.id}`);
  }
  editDialog.participants = editDialog.participants.filter(x => x !== p);
}


async function saveEditedParticipants() {
  try {
    for (const p of editDialog.participants) {
      if (p.id) {
        // update existing
        await axios.put(`/activities/participants/${p.id}`, p);
      } else {
        // new participant
        await axios.post('/activities/participants/create', {
          ...p,
          activity_booking_id: editDialog.booking.id
        });
      }
    }
    const finalCount = editDialog.participants.length;
    await axios.put(`/activities/bookings/update/${editDialog.booking.id}`, {
      numberOfParticipants: finalCount
    });

    snackbar.msg = 'Participants updated';
    snackbar.open = true;
    editDialog.open = false;
    await fetchBookings();
    await fetchActivities();
  } catch (err) {
    snackbar.msg = 'Failed to update participants';
    snackbar.open = true;
  }
}



async function editBooking(b) {
  try {
    const { data } = await axios.get(`/activities/participants/booking/${b.id}`);
    editDialog.booking = b;
    editDialog.participants = data;
    editDialog.open = true;
  } catch (err) {
    snackbar.msg = 'Failed to load participants';
    snackbar.open = true;
  }
}


async function nextStep() {
  // create booking first
  try {
    const payload = {
      activity_schedule_id: bookingForm.scheduleId,
      numberOfParticipants: bookingForm.participants,
      arrangement_booking_id: booking.value?.id,
      petsIncluded: false,
      bookingDate: new Date().toISOString(),
      totalPrice: 50 * bookingForm.participants,
    };
    const { data } = await axios.post('/activities/bookings/create-booking', payload);

    createdBookingId.value = data.id; // save ID for participants

    // prepare participant forms
    participantForms.value = Array.from({ length: bookingForm.participants }, (_, idx) => ({
      firstName: idx === 0 ? store.user?.name || '' : '',
      lastName: idx === 0 ? store.user?.surname || '' : '',
      email: idx === 0 ? store.user?.email || '' : '',
      dateOfBirth: '',
      allergy: 'NONE',
      medicalCondition: 'NONE',
      preferences: '',
      specialRequirements: ''
    }));

    bookingStep.value = 2;
  } catch (err) {
    snackbar.msg = 'Failed to create booking';
    snackbar.open = true;
  }
}

async function saveParticipants() {
  try {
    for (const p of participantForms.value) {
      await axios.post('/activities/participants/create', {
        ...p,
        activity_booking_id: createdBookingId.value
      });
    }
    snackbar.msg = 'Booking and participants saved';
    snackbar.open = true;
    bookingDialog.open = false;
    bookingStep.value = 1;
    await fetchBookings();
    await fetchActivities();
  } catch (err) {
    snackbar.msg = 'Failed to save participants';
    snackbar.open = true;
  }
}

function openReviewDialog(booking, mode = 'create') {
  reviewDialog.booking = booking;
  reviewDialog.mode = mode;
  reviewDialog.reviewId = mode === 'edit' ? booking.review?.id : null;

  reviewDialog.form = mode === 'edit' && booking.review
    ? {
        overallRating: booking.review.overallRating ?? 0,
        organizationRating: booking.review.organizationRating ?? 0,
        guideRating: booking.review.guideRating ?? 0,
        valueForMoneyRating: booking.review.valueForMoneyRating ?? 0,
        safetyRating: booking.review.safetyRating ?? 0,
        funRating: booking.review.funRating ?? 0,
        wouldRevisit: !!booking.review.wouldRevisit,
        comment: booking.review.comment ?? ''
      }
    : {
        overallRating: 0,
        organizationRating: 0,
        guideRating: 0,
        valueForMoneyRating: 0,
        safetyRating: 0,
        funRating: 0,
        wouldRevisit: false,
        comment: ''
      };

  reviewDialog.open = true;
}

const booking = ref(null)
const departure = ref(null)
const arrangement = ref(null)

// --- Helper functions ---
function formatDate(dateString) {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return 'Invalid Date'
  }
}

function getBookingStatusColor(status) {
  const colors = {
    'CONFIRMED': 'success',
    'INITIATED': 'warning',
    'CANCELLED': 'error',
    'REFUNDED': 'info'
  }
  return colors[status] || 'grey'
}

async function fetchBookingDetails() {
  try {
    const { data } = await axios.get(`/bookings/${route.params.bookingId}/details`)
    booking.value = data
    departure.value = data.departure
    arrangement.value = data.departure?.arrangement
    console.log('Booking details loaded:', {
      bookingId: data.id,
      arrangementId: arrangement.value?.id,
      arrangementTitle: arrangement.value?.title
    });
  } catch (e) {
    error.value = e?.response?.data?.message || 'Failed to load booking details'
    console.error('Error fetching booking details:', e);
  }
}

async function saveReview(e) {
  if (e?.preventDefault) e.preventDefault();
  try {
    const base = {
      overallRating: reviewDialog.form.overallRating,
      organizationRating: reviewDialog.form.organizationRating,
      guideRating: reviewDialog.form.guideRating,
      valueForMoneyRating: reviewDialog.form.valueForMoneyRating,
      safetyRating: reviewDialog.form.safetyRating,
      funRating: reviewDialog.form.funRating,
      wouldRevisit: reviewDialog.form.wouldRevisit,
      comment: reviewDialog.form.comment
    };

    if (reviewDialog.mode === 'edit' && reviewDialog.reviewId) {
      await axios.put(`/activities/reviews/${reviewDialog.reviewId}`, base);
    } else {
      const createPayload = {
        ...base,
        activity_booking_id: reviewDialog.booking.id,
        userUsername: store.username,                 // backend can also infer
        createdAt: new Date().toISOString()
      };
      await axios.post('/activities/reviews/create-review', createPayload);
    }

    snackbar.msg = reviewDialog.mode === 'edit' ? 'Review updated' : 'Review submitted';
    snackbar.open = true;
    reviewDialog.open = false;

    // refresh bookings -> refresh attached reviews
    await fetchBookings();
  } catch (err) {
    snackbar.msg = 'Failed to save review';
    snackbar.open = true;
  }
}

async function deleteReview(booking) {
  if (!booking.review?.id) return;
  try {
    await axios.delete(`/activities/reviews/${booking.review.id}`);
    snackbar.msg = 'Review deleted';
    snackbar.open = true;
    await fetchBookings();
  } catch (err) {
    snackbar.msg = 'Failed to delete review';
    snackbar.open = true;
  }
}

function checkForUnreviewedBookings() {
  // Find bookings that are finished but not reviewed
  const unreviewed = bookings.value.filter(b => 
    new Date(b.activitySchedule?.endTime) < new Date() && !b.review && !b.isCancelled
  );

  if (unreviewed.length > 0) {
    unreviewedBookings.value = unreviewed;
    reviewReminderDialog.open = true;
  }
}

function dismissReviewReminder() {
  reviewReminderDialog.open = false;
}

function goToReviewActivity(booking) {
  // Close the reminder dialog and open the review dialog for this booking
  reviewReminderDialog.open = false;
  openReviewDialog(booking);
}



onMounted(async () => {
  await fetchBookingDetails()
  // Only fetch recommendations after we have booking and arrangement data
  await fetchRecommendations()
  await fetchActivities()
  await fetchBookings()
  // Check for unreviewed bookings after all data is loaded
  checkForUnreviewedBookings()
})

</script>

<style scoped>
.activities-container {
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
.activities-header {
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

.activities-header-content {
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

.activities-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.5px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.activities-subtitle {
  font-size: 1.2rem;
  opacity: 0.9;
  margin: 8px 0 0 0;
  font-weight: 400;
}

.header-stats {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.stats-chip {
  background: rgba(255, 255, 255, 0.15) !important;
  color: white !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  font-weight: 600 !important;
}

/* Section Containers */
.section-container {
  max-width: 1200px;
  margin: 0 auto 48px auto;
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
  }
}

/* Section Headers */
.section-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.section-header-large {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
}

.section-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--warm-orange);
  margin: 0;
  letter-spacing: 0.3px;
}

.section-title-large {
  font-size: 2rem;
  font-weight: 700;
  color: var(--warm-orange);
  margin: 0;
  letter-spacing: 0.3px;
}

.section-description {
  color: rgba(28, 25, 23, 0.7);
  font-size: 1rem;
  margin: 8px 0 0 0;
  font-weight: 400;
}

/* Arrangement Card Styling */
.arrangement-card {
  margin-bottom: 0 !important;
}

.details-grid {
  margin-top: 32px;
}

.detail-card {
  background: rgba(245, 158, 11, 0.03) !important;
  border: 1px solid rgba(245, 158, 11, 0.1) !important;
  border-radius: 16px !important;
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(245, 158, 11, 0.06) !important;
  }
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.detail-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--warm-orange);
  margin: 0;
}

.detail-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.95rem;
  
  strong {
    color: var(--warm-orange);
  }
}

.price-highlight {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--warm-orange);
  margin-left: 8px;
}

/* Activity Cards */
.activities-grid {
  gap: 24px;
  margin: 0 !important;
}

.activities-grid .v-col {
  display: flex;
  padding: 0 12px !important;
}

.activity-card {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  flex: 1;
}

/* Override Vuetify's default card margins */
.activities-grid .v-card {
  width: 100% !important;
  max-width: none !important;
  margin: 0 !important;
}

.activity-card .v-card {
  height: 100%;
  width: 100%;
  flex: 1;
  margin: 0 !important;
}

.recommended-card {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.02) 0%, rgba(245, 158, 11, 0.02) 100%) !important;
  border: 2px solid rgba(255, 152, 0, 0.2) !important;
  
  &:hover {
    border-color: rgba(255, 152, 0, 0.4) !important;
  }
}

.activity-image-container {
  position: relative;
  overflow: hidden;
  border-radius: 20px 20px 0 0;
}

.activity-image {
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.activity-card:hover .activity-image {
  transform: scale(1.05);
}

.activity-placeholder {
  height: 240px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-badges {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.recommendation-badge,
.price-badge,
.status-badge {
  font-weight: 700 !important;
  letter-spacing: 0.3px !important;
  backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.activity-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--warm-orange);
  margin: 0 0 12px 0;
  letter-spacing: 0.3px;
}

.activity-description {
  color: rgba(28, 25, 23, 0.7);
  margin-bottom: 20px;
  line-height: 1.6;
}

/* Recommendation Reasons */
.recommendation-reasons {
  margin-bottom: 20px;
}

.reasons-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--warm-orange);
  margin-bottom: 8px;
}

.reasons-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.reason-chip {
  font-size: 0.8rem !important;
}

/* Activity Details */
.activity-details {
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  gap: 24px;
  margin-bottom: 8px;
}

.detail-item-inline {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: rgba(28, 25, 23, 0.7);
}

/* Feature Tags */
.feature-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.feature-chip {
  font-size: 0.8rem !important;
}

/* Form Elements */
.schedule-select {
  margin-bottom: 12px;
  
  :deep(.v-field) {
    border-radius: 12px !important;
    box-shadow: 0 2px 8px rgba(212, 115, 10, 0.06) !important;
  }
  
  :deep(.v-field--focused) {
    box-shadow: 0 4px 16px rgba(212, 115, 10, 0.12) !important;
  }
}

.remaining-spots {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
  color: var(--warm-orange);
  font-weight: 500;
}

/* Action Buttons */
.action-btn {
  border-radius: 16px !important;
  height: 48px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  text-transform: none !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  box-shadow: 0 4px 16px rgba(212, 115, 10, 0.15) !important;
  
  &:hover:not(:disabled) {
    box-shadow: 0 8px 24px rgba(212, 115, 10, 0.25) !important;
    transform: translateY(-2px);
  }
}

.recommended-btn {
  background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%) !important;
}

.action-btn-small {
  border-radius: 12px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0.3px !important;
}

.toggle-btn,
.toggle-btn-large {
  border-radius: 16px !important;
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0.3px !important;
  transition: all 0.3s ease !important;
}

/* Booking Cards */
.bookings-grid {
  gap: 24px;
}

.booking-card {
  border-left: 4px solid var(--warm-orange) !important;
}

.booking-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.booking-main-info {
  flex: 1;
}

.booking-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.booking-activity-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--warm-orange);
  margin: 0;
}

.booking-time {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(28, 25, 23, 0.7);
  margin-bottom: 16px;
}

.booking-details-row {
  display: flex;
  gap: 32px;
  margin-bottom: 16px;
}

.booking-detail {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.95rem;
  color: rgba(28, 25, 23, 0.7);
}

.booking-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 120px;
}

.cancellation-alert {
  border-radius: 12px !important;
}

/* Review Section */
.review-section {
  margin-top: 32px;
}

.review-card {
  background: rgba(16, 185, 129, 0.03) !important;
  border: 1px solid rgba(16, 185, 129, 0.1) !important;
  border-radius: 16px !important;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.review-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: #10B981;
  margin: 0;
}

.review-actions {
  display: flex;
  gap: 8px;
}

.overall-rating {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 32px;
  padding: 20px;
  background: rgba(16, 185, 129, 0.05);
  border-radius: 16px;
  border: 1px solid rgba(16, 185, 129, 0.1);
}

.rating-stars {
  margin: 0;
}

.rating-score {
  text-align: center;
}

.score-number {
  font-size: 2rem;
  font-weight: 800;
  color: #10B981;
  line-height: 1;
}

.score-label {
  font-size: 0.9rem;
  color: rgba(28, 25, 23, 0.7);
  margin-top: 4px;
}

.detailed-ratings {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.rating-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: rgba(16, 185, 129, 0.03);
  border-radius: 12px;
  border: 1px solid rgba(16, 185, 129, 0.08);
}

.rating-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(28, 25, 23, 0.8);
  min-width: 80px;
}

.rating-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #10B981;
  margin-left: 12px;
}

.revisit-chip {
  margin-left: 12px !important;
}

.review-comment {
  margin-top: 24px;
}

.comment-content {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.comment-text {
  flex: 1;
}

.comment-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(28, 25, 23, 0.8);
  margin-bottom: 8px;
}

.comment-body {
  font-style: italic;
  color: rgba(28, 25, 23, 0.7);
  line-height: 1.6;
  margin: 0;
}

/* Modern Alert */
.modern-alert {
  border-radius: 16px !important;
  box-shadow: 0 4px 16px rgba(33, 150, 243, 0.1) !important;
  margin-bottom: 32px;
}

/* Responsive Design */
@media (max-width: 960px) {
  .activities-header {
    padding: 32px 16px;
  }
  
  .activities-header-content {
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
  
  .activities-title {
    font-size: 2rem;
  }
  
  .activities-subtitle {
    font-size: 1.1rem;
  }
  
  .section-container {
    padding: 0 16px;
  }
  
  .section-header-large {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .booking-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .booking-actions {
    flex-direction: row;
    justify-content: flex-start;
    flex-wrap: wrap;
    min-width: auto;
  }
  
  .booking-details-row {
    flex-direction: column;
    gap: 12px;
  }
  
  .detailed-ratings {
    grid-template-columns: 1fr;
    gap: 12px;
  }
  
  .overall-rating {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }
}

@media (max-width: 600px) {
  .activities-title {
    font-size: 1.8rem;
  }
  
  .section-title-large {
    font-size: 1.6rem;
  }
  
  .activity-title {
    font-size: 1.2rem;
  }
  
  .booking-activity-title {
    font-size: 1.3rem;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .header-stats {
    justify-content: center;
  }
}
</style>
