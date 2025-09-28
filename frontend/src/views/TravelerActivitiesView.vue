<template>
  <v-container class="py-8">
    <!-- Arrangement header -->
<h2 class="text-h5 mb-4">
  Arrangement: {{ arrangement?.title || 'Loading...' }}
</h2>


    <!-- New: Arrangement Booking Info -->
    <div v-if="arrangement" class="mb-6">
      <h3 class="text-h6">{{ arrangement.title }}</h3>
      <p class="text-body-2">{{ arrangement.summary }}</p>

      <v-card class="pa-4 my-4" variant="outlined">
        <div><strong>Departure:</strong> {{ departure?.startDate }} → {{ departure?.endDate }}</div>
        <div><strong>Destination:</strong> {{ arrangement.destination?.name }}</div>
        <div><strong>Transport:</strong> {{ arrangement.transportType }}</div>
        <div><strong>Accommodation:</strong> {{ arrangement.accommodationType }}</div>
      </v-card>

      <v-card class="pa-4 my-4" variant="outlined">
        <div><strong>Booking Date:</strong> {{ booking.bookingDate }}</div>
        <div><strong>Travelers:</strong> {{ booking.travelersCount }}</div>
        <div><strong>Status:</strong> {{ booking.status }}</div>
        <div><strong>Total Price:</strong> €{{ booking.grandTotal }}</div>
      </v-card>
    </div>

    <!-- Recommended Activities Section -->
    <div v-if="recommendedActivities.length > 0" class="mb-6">
      <h3 class="text-h6 mb-3 d-flex align-center">
        <v-icon class="mr-2" color="orange">mdi-star</v-icon>
        Recommended for You
      </h3>
      <v-row>
        <v-col
          v-for="activity in recommendedActivities"
          :key="`rec-${activity.id}`"
          cols="12" sm="6"
        >
          <v-card 
            variant="outlined" 
            class="pa-3 recommendation-card"
            :style="{ border: '2px solid orange', backgroundColor: '#fff9c4' }"
          >
            <!-- Recommendation badge -->
            <v-chip
              color="orange"
              variant="flat"
              size="small"
              class="mb-2"
              prepend-icon="mdi-star"
            >
              Recommended ({{ activity.recommendationScore }}/100)
            </v-chip>

            <!-- Activity image -->
            <v-img
              v-if="activity.imagePath"
              :src="`http://localhost:3000/${activity.imagePath}`"
              alt="Activity image"
              height="160"
              class="rounded mb-3"
              cover
            />
            <v-img
              v-else
              src="https://via.placeholder.com/240x120.png?text=No+Image"
              alt="No image available"
              height="160"
              class="rounded mb-3"
              cover
            />

            <!-- Info -->
            <div class="text-subtitle-1 font-weight-bold">{{ activity.name }}</div>
            <div class="text-body-2 mb-2">{{ activity.description }}</div>

            <!-- Recommendation reasons -->
            <div v-if="activity.recommendationReasons?.length" class="mb-3">
              <div class="text-caption font-weight-medium mb-1">Why we recommend this:</div>
              <v-chip
                v-for="reason in activity.recommendationReasons"
                :key="reason"
                size="x-small"
                variant="outlined"
                color="orange"
                class="mr-1 mb-1"
              >
                {{ reason }}
              </v-chip>
            </div>

            <!-- Timeslot dropdown -->
            <v-select
              v-model="selectedSchedule[activity.id]"
              :items="schedules[activity.id] || []"
              item-title="label"
              item-value="id"
              label="Timeslot"
            />

            <!-- Show remaining only if a schedule is selected -->
            <div v-if="selectedSchedule[activity.id]" class="text-caption mb-2">
              Remaining spots:
              {{
                (schedules[activity.id].find(s => s.id === selectedSchedule[activity.id])?.remaining) ?? 'N/A'
              }}
            </div>

            <!-- Book button -->
            <v-btn color="orange" class="mt-2" type="button" @click="openBookingDialog(activity)">
              Book Recommended Activity
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Activities -->
    <h3 class="text-h6 mb-3">All Activities</h3>
    <v-row>
<v-col
  v-for="a in visibleActivities"
  :key="a.id"
  cols="12" sm="6"
>
  <v-card variant="outlined" class="pa-3">
    <!-- Activity image -->
    <v-img
      v-if="a.imagePath"
      :src="`http://localhost:3000/${a.imagePath}`"
      alt="Activity image"
      height="160"
      class="rounded mb-3"
      cover
    />
    <v-img
      v-else
      src="https://via.placeholder.com/240x120.png?text=No+Image"
      alt="No image available"
      height="160"
      class="rounded mb-3"
      cover
    />

    <!-- Info -->
    <div class="text-subtitle-1 font-weight-bold">{{ a.name }}</div>
    <div class="text-body-2 mb-2">{{ a.description }}</div>

    <!-- Timeslot dropdown -->
    <v-select
      v-model="selectedSchedule[a.id]"
      :items="schedules[a.id] || []"
      item-title="label"
      item-value="id"
      label="Timeslot"
    />

    <!-- Show remaining only if a schedule is selected -->
    <div v-if="selectedSchedule[a.id]" class="text-caption mb-2">
      Remaining spots:
      {{
        (schedules[a.id].find(s => s.id === selectedSchedule[a.id])?.remaining) ?? 'N/A'
      }}
    </div>

    <!-- Book button -->
    <v-btn color="primary" class="mt-2" type="button" @click="openBookingDialog(a)">
      Book now
    </v-btn>
  </v-card>
</v-col>

    </v-row>
    <div v-if="activities.length > 2" class="text-center mb-6">
      <v-btn variant="tonal" @click="showAll = !showAll">
        {{ showAll ? 'Show Less' : 'Show All' }}
      </v-btn>
    </div>

    <!-- Booked Activities -->
    <h3 class="text-h6 mb-3">Booked Activities</h3>
    <v-alert v-if="bookings.length === 0" type="info" variant="tonal">
      No booked activities yet.
    </v-alert>
   <v-card
  v-for="b in bookings"
  :key="b.id"
  class="mb-3 pa-4"
  variant="outlined"
>
  <!-- Top row: activity name + actions -->
  <div class="d-flex align-center justify-space-between mb-2">
    <div>
      <div class="text-subtitle-2 font-weight-bold">
        {{ b.activitySchedule?.activity?.name }}
      </div>
      <div class="text-caption">
        {{ formatDate(b.activitySchedule?.startTime) }} → {{ formatDate(b.activitySchedule?.endTime) }}
      </div>
    </div>

    <div class="d-flex ga-2">
      <v-btn size="small" variant="outlined" color="error" @click="openCancelDialog(b)">Cancel</v-btn>
      <v-btn size="small" variant="outlined" @click="editBooking(b)">Edit</v-btn>
      <v-btn
        v-if="new Date(b.activitySchedule?.endTime) < new Date() && !b.review"
        size="small"
        variant="outlined"
        color="primary"
        @click="openReviewDialog(b)"
      >
        Review
      </v-btn>
    </div>
  </div>

  <!-- Booking details -->
  <div class="text-caption mb-2">
    Participants: <strong>{{ b.numberOfParticipants }}</strong> |
    Price: <strong>{{ b.totalPrice }}</strong>
  </div>

  <!-- Cancelled status -->
  <div v-if="b.isCancelled" class="text-caption text-error mb-2">
    Cancelled ({{ b.cancellationReason }})
  </div>

  <!-- User's Review -->
  <v-divider v-if="b.review" class="my-2" />
<!-- User's review box -->
<div v-if="b.review" class="mt-3 pa-3 rounded bg-grey-lighten-4">
  <div class="d-flex align-center justify-space-between mb-2">
    <div>
      <div class="text-caption">Your review</div>
      <div class="d-flex align-center">
        <v-rating
          :model-value="b.review.overallRating"
          readonly
          density="compact"
          size="20"
        />
        <span class="ml-2 text-caption">{{ b.review.overallRating }}/5</span>
      </div>
    </div>
    <div class="d-flex ga-1">
      <v-btn size="small" variant="text" @click="openReviewDialog(b, 'edit')">Edit</v-btn>
      <v-btn size="small" variant="text" color="error" @click="deleteReview(b)">Delete</v-btn>
    </div>
  </div>

  <!-- Ratings in grid -->
  <div class="mt-2" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
    <div class="d-flex align-center ga-1">
      <span class="text-caption font-weight-medium">Org:</span>
      <v-rating :model-value="b.review.organizationRating" readonly density="compact" size="16" />
    </div>
    <div class="d-flex align-center ga-1">
      <span class="text-caption font-weight-medium">Guide:</span>
      <v-rating :model-value="b.review.guideRating" readonly density="compact" size="16" />
    </div>
    <div class="d-flex align-center ga-1">
      <span class="text-caption font-weight-medium">Value:</span>
      <v-rating :model-value="b.review.valueForMoneyRating" readonly density="compact" size="16" />
    </div>
    <div class="d-flex align-center ga-1">
      <span class="text-caption font-weight-medium">Safety:</span>
      <v-rating :model-value="b.review.safetyRating" readonly density="compact" size="16" />
    </div>
    <div class="d-flex align-center ga-1">
      <span class="text-caption font-weight-medium">Fun:</span>
      <v-rating :model-value="b.review.funRating" readonly density="compact" size="16" />
    </div>
    <div class="d-flex align-center ga-1">
      <span class="text-caption font-weight-medium">Revisit:</span>
      <span>{{ b.review.wouldRevisit ? 'Yes' : 'No' }}</span>
    </div>
  </div>

  <!-- Comment -->
  <div v-if="b.review.comment" class="mt-3 text-body-2 fst-italic">
    "{{ b.review.comment }}"
  </div>
</div>

</v-card>
    <!-- End Booked Activities -->


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

function formatDate(dt) {
  if (!dt) return '';
  return new Date(dt).toLocaleString();
}

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
            const bookingsRes = await axios.get(`/activities/bookings/schedule/${s.id}`);
            const totalBooked = bookingsRes.data.reduce((sum, b) => sum + b.numberOfParticipants, 0);
            const remaining = activity.maxCapacity - totalBooked;

            scheduleItems.push({
              id: s.id,
              label: `${formatDate(s.startTime)} → ${formatDate(s.endTime)}`,
              remaining
            });
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
          const bookingsRes = await axios.get(`/activities/bookings/schedule/${s.id}`);
          const totalBooked = bookingsRes.data.reduce((sum, b) => sum + b.numberOfParticipants, 0);
          const remaining = a.maxCapacity - totalBooked;

          scheduleItems.push({
            id: s.id,
            label: `${formatDate(s.startTime)} → ${formatDate(s.endTime)}`,
            remaining
          });
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
    const mine = data.filter(b => b.arrangement_booking_id === arrangement.value.id);

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
      arrangement_booking_id: arrangement.value?.id || booking.value?.id,
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
      arrangement_booking_id: arrangement.value?.id || booking.value?.id,
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
  // Check if user dismissed the reminder recently (within 24 hours)
  const dismissedTime = localStorage.getItem('dismissedReviewReminder');
  if (dismissedTime) {
    const dismissedDate = new Date(dismissedTime);
    const now = new Date();
    const hoursSinceDismissed = (now - dismissedDate) / (1000 * 60 * 60);
    if (hoursSinceDismissed < 24) {
      return; // Don't show popup if dismissed within last 24 hours
    }
  }

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
  // Store dismissal timestamp to avoid showing again for 24 hours
  localStorage.setItem('dismissedReviewReminder', new Date().toISOString());
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
.recommendation-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
}

.recommendation-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 152, 0, 0.3);
}

.recommendation-card .v-chip {
  font-weight: 500;
}
</style>
