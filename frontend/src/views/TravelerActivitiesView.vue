<template>
  <v-container class="py-8">
    <!-- Arrangement header -->
    <h2 class="text-h5 mb-4">Arrangement: Paris Summer Trip</h2>
    <div class="d-flex mb-6">
      <v-img
        src="https://via.placeholder.com/180x120.png?text=Paris+Map"
        alt="Map"
        width="180"
        class="mr-6"
      />
      <div>
        <div><strong>City:</strong> Paris</div>
        <div><strong>Country:</strong> France</div>
        <v-card class="mt-4 pa-3" variant="outlined">
          <div><strong>Travel Details:</strong></div>
          <div>2 Adults, 1 child</div>
          <div>32 years old …</div>
        </v-card>
      </div>
    </div>

    <!-- Activities -->
    <h3 class="text-h6 mb-3">Activities</h3>
    <v-row>
      <v-col
        v-for="a in visibleActivities"
        :key="a.id"
        cols="12" sm="6"
      >
        <v-card variant="outlined" class="pa-3">
          <v-img
            src="https://via.placeholder.com/240x120.png?text=Activity"
            alt="Activity"
            height="120"
          />
          <div class="mt-3 text-subtitle-1 font-weight-bold">{{ a.name }}</div>
          <div class="text-body-2 mb-2">{{ a.description }}</div>
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



    <v-snackbar v-model="snackbar.open" :timeout="2500">
      {{ snackbar.msg }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import axios from '@/utils/axiosInstance';
import { store } from '@/utils/store';

const arrangementId = 1; // Hardcoded Paris Summer Trip

const activities = ref([]);
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

async function fetchActivities() {
  try {
    const { data } = await axios.get(`/activities/arrangement/${arrangementId}`);
    activities.value = data;

    for (const a of data) {
      // load schedules
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
  } catch (err) {
    console.error("Failed to load activities", err);
  }
}


async function fetchBookings() {
  try {
    const { data } = await axios.get(`/activities/bookings/user/${store.username}`);
    const mine = data.filter(b => b.arrangement_booking_id === arrangementId);

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

  try {
    const payload = {
      activity_schedule_id: bookingForm.scheduleId,
      numberOfParticipants: bookingForm.participants,
      arrangement_booking_id: arrangementId,
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
      arrangement_booking_id: arrangementId,
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



onMounted(async () => {
  await fetchActivities();
  await fetchBookings();
});
</script>
