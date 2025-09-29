<template>
  <v-container class="py-6 tickets-container">
    <!-- Header -->
    <div class="tickets-header animate-fade-in">
      <h1 class="page-title font-heading">My Support Tickets</h1>
      <v-btn
        variant="outlined"
        class="btn-outline create-ticket-btn"
        prepend-icon="mdi-plus"
        @click="createNew"
      >
        New Ticket
      </v-btn>
    </div>

    <!-- Loading / Empty states -->
    <v-progress-linear 
      v-if="loading" 
      indeterminate 
      color="primary" 
      class="mb-4 loading-bar" 
    />
    <v-alert
      v-else-if="tickets.length === 0"
      type="info"
      variant="tonal"
      class="mt-6 empty-state"
      title="No tickets yet"
      text="Click New Ticket to create your first support request."
    >
      <template #prepend>
        <v-icon size="40">mdi-ticket-outline</v-icon>
      </template>
    </v-alert>

    <!-- Grid -->
    <v-row v-else dense class="tickets-grid">
      <v-col v-for="(t, index) in tickets" :key="t.id" cols="12" sm="6" md="4">
        <v-card class="ticket-card animate-fade-in" elevation="0" :style="{ animationDelay: `${index * 0.1}s` }">
          <v-card-text class="pa-6">
            <div class="ticket-title">{{ t.subject }}</div>

            <div class="kv">
              <span class="kv-label">Type:</span>
              <span class="pill">{{ t.category }}</span>
            </div>

            <div class="kv">
              <span class="kv-label">Status:</span>
              <span class="pill status-pill" :class="`status-${t.status.name.toLowerCase()}`">
                {{ t.status.name }}
              </span>
            </div>

            <div class="actions-centered">
              <v-btn 
                v-if="isClosed(t.status)" 
                variant="outlined" 
                class="btn-outline rate-btn" 
                @click="rate(t)"
                prepend-icon="mdi-star-outline"
              >
                Rate Service
              </v-btn>
              <v-btn 
                v-else 
                variant="outlined" 
                class="btn-outline view-btn" 
                @click="viewDetails(t)"
                prepend-icon="mdi-eye-outline"
              >
                View Details
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- NEW TICKET DIALOG (2-step wizard) -->
    <v-dialog v-model="dialog" max-width="900px" persistent>
      <v-card>
        <v-toolbar flat>
          <v-toolbar-title>New Ticket</v-toolbar-title>
          <v-spacer />
          <v-btn icon="mdi-close" @click="cancel" />
        </v-toolbar>

        <v-card-text>
          <!-- STEP 1 -->
          <div v-if="step === 1">
            <v-form ref="step1Form">
          <v-row class="subject-row" align="stretch">
  <v-col cols="8">
    <v-text-field
      v-model="form.subject"
      label="Subject"
      outlined
      :rules="[rules.required, rules.max255]"
      class="subject-field"
    />
  </v-col>

  <v-col cols="4" class="d-flex">
    <v-btn
      color="primary"
      class="next-btn"
      size="large"
      
      @click="nextStep"
      :loading="validatingStep1"
    >
      Next
    </v-btn>
  </v-col>
</v-row>

              <v-autocomplete
                v-model="form.reservationId"
                :items="reservations"
                label="Reservation"
                outlined
                clearable
                item-title="label"
                item-value="id"
                :loading="loadingReservations"
                :rules="[rules.required, rules.validReservation]"
                hide-no-data
                hide-details="auto"
                class="mb-3"
              />

              <v-row>
                <v-col cols="6">
                  <v-select
                    v-model="form.category"
                    :items="categories"
                    label="Choose category"
                    outlined
                    :rules="[rules.required, rules.validCategory]"
                    @update:model-value="onCategoryChange"
                  />
                </v-col>
                <v-col cols="6" v-if="form.category === 'Other'">
                  <v-text-field
                    v-model="form.customCategory"
                    label="Kako biste definisali vašu kategoriju"
                    outlined
                    :rules="[rules.required, rules.max128]"
                  />
                </v-col>
              </v-row>

              <v-textarea
                v-model="form.description"
                label="Description"
                outlined
                rows="5"
                counter="5000"
                maxlength="5000"
                :rules="[rules.required, rules.max5000]"
              />

              <div class="d-flex justify-end mt-4">
                <v-btn color="error" variant="outlined" @click="cancel">Cancel</v-btn>
              </div>
            </v-form>
          </div>

          <!-- STEP 2 (attachments carousel) -->
          <div v-else-if="step === 2">
            <div class="d-flex align-center gap-3 mb-4">
              <div class="font-weight-700">Attachment(s):</div>
              <v-file-input
                v-model="filesInput"
                multiple
                prepend-icon="mdi-paperclip"
                accept="image/*,.pdf,.doc,.docx,.txt"
                hide-details="auto"
                show-size
                density="comfortable"
                variant="outlined"
                :rules="[rules.fileCount, rules.fileSize, rules.fileType]"
                @update:model-value="onFilesPicked"
              >
                <template #label>
                  <span>Add File</span>
                </template>
              </v-file-input>
            </div>

            <div class="attachments-frame">
              <v-btn icon="mdi-chevron-left" variant="text" class="nav-arrow" @click="scrollStrip(-1)" />

              <div class="attachments-strip" ref="strip">
                <div v-for="(item, idx) in attachments" :key="item.key" class="att-card">
                  <div class="thumb">
                    <img v-if="item.isImage" :src="item.url" alt="" />
                    <div v-else class="doc-icon">
                      <v-icon size="48">mdi-file-document-outline</v-icon>
                    </div>

                    <v-btn
                      size="small"
                      icon="mdi-close"
                      class="remove-dot"
                      @click="removeAttachment(idx)"
                    />
                  </div>
                  <div class="att-name" :title="item.name">{{ shortName(item.name) }}</div>
                  <v-btn size="small" class="btn-outline" variant="outlined" @click="preview(item)">
                    Preview
                  </v-btn>
                </div>
              </div>

              <v-btn icon="mdi-chevron-right" variant="text" class="nav-arrow" @click="scrollStrip(1)" />
            </div>

            <div class="d-flex justify-space-between mt-6">
              <v-btn variant="outlined" @click="prevStep">Previous</v-btn>
              <div>
                <v-btn color="error" variant="outlined" class="mr-2" @click="cancel">Cancel</v-btn>
                <v-btn color="primary" :loading="submitting" @click="submit">Submit</v-btn>
              </div>
            </div>

            <!-- Error Message -->
            <v-alert
              v-if="errorMessage"
              type="error"
              variant="tonal"
              class="mt-4"
              closable
              @click:close="errorMessage = ''"
            >
              {{ errorMessage }}
            </v-alert>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- RATE SERVICE DIALOG -->
    <RateServiceDialog
      v-model="rateDialog"
      :ticket="selectedTicket"
      @rated="onTicketRated"
    />
  </v-container>
</template>

<script>
import axiosInstance from '@/utils/axiosInstance';
import RateServiceDialog from '@/components/RateServiceDialog.vue';

export default {
  name: 'MyTickets',
  components: {
    RateServiceDialog
  },
  data() {
    return {
      loading: true,
      tickets: [],

      // dialog wizard
      dialog: false,
      step: 1,
      validatingStep1: false,
      submitting: false,

      // lists
      categories: ['Accommodation', 'Transport', 'Finance', 'Support', 'Other'],
      reservations: [],
      loadingReservations: false,

      // form
      form: {
        subject: '',
        reservationId: null,
        category: null,
        customCategory: '',
        description: '',
      },

      // attachments
      filesInput: [],        // raw v-file-input (File[])
      attachments: [],  
			rules: {
        required: v =>
          (v !== null && v !== undefined && String(v).trim().length > 0) || 'This field is required',
        max128: v => (!v || String(v).length <= 128) || 'Max 128 characters',
        max255: v => (!v || String(v).length <= 255) || 'Max 255 characters',
        max5000: v => (!v || String(v).length <= 5000) || 'Max 5000 characters',
        validCategory: v => !v || ['Accommodation', 'Transport', 'Finance', 'Support', 'Other'].includes(v) || 'Invalid category',
        validReservation: v => !v || Number.isInteger(Number(v)) || 'Invalid reservation ID',
        fileCount: files => !files || files.length <= 10 || 'Maximum 10 files allowed',
        fileSize: files => {
          if (!files) return true;
          const maxSize = 10 * 1024 * 1024; // 10MB
          const oversized = files.find(f => f.size > maxSize);
          return !oversized || `File "${oversized.name}" exceeds 10MB limit`;
        },
        fileType: files => {
          if (!files) return true;
          const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 
                               'application/pdf', 'application/msword', 
                               'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                               'text/plain'];
          const invalidFile = files.find(f => !allowedTypes.includes(f.type));
          return !invalidFile || `File type "${invalidFile.type}" not allowed`;
        }
      },     // [{key,name,url,isImage,file}]

      // rating dialog
      rateDialog: false,
      selectedTicket: null,
      
      // error handling
      errorMessage: ''
    };
  },
  created() {
    this.fetchTickets();
  },
  beforeUnmount() {
    this.attachments.forEach(a => a.url && URL.revokeObjectURL(a.url));
  },
  methods: {
    async fetchTickets() {
      try {
        const { data } = await axiosInstance.get('/complaint/mycomplaints');
        this.tickets = data;
        console.log('Loaded tickets:', this.tickets);
      } catch (err) {
        console.error('Failed to load tickets', err);
        this.tickets = [];
      } finally {
        this.loading = false;
      }
    },

    // ===== New Ticket flow =====
    async loadReservations() {
      this.loadingReservations = true;
      try {
        const { data } = await axiosInstance.get('/reservation/myreservations');
        this.reservations = (data || []).map(r => ({
          id: r.id,
          label: r.code ? `#${r.code} — ${r.destination}` : r.name || `Reservation ${r.id}`,
        }));
      } catch (e) {
        console.error('Failed to load reservations', e);
        this.reservations = [];
      } finally {
        this.loadingReservations = false;
      }
    },

    createNew() {
      this.resetForm();
      this.dialog = true;
      this.step = 1;
      this.loadReservations();
    },
    onCategoryChange(val) {
      if (val !== 'Other') this.form.customCategory = '';
    },
    async nextStep() {
      // Validate step 1 using form ref
      this.validatingStep1 = true;
      
      // Check form validity using Vuetify validation
      const { valid } = await this.$refs.step1Form.validate();
      
      if (valid) {
        // Additional custom validations
        const okSubject = this.form.subject && this.form.subject.trim().length > 0 && this.form.subject.length <= 255;
        const okReservation = !!this.form.reservationId;
        const okCategory = this.categories.includes(this.form.category) || 
          (this.form.category === 'Other' && this.form.customCategory && this.form.customCategory.trim().length > 0);
        const okDesc = this.form.description && this.form.description.trim().length > 0 && this.form.description.length <= 5000;

        if (okSubject && okReservation && okCategory && okDesc) {
          this.step = 2;
        } else {
          console.warn('Form validation failed on custom checks');
        }
      }
      
      this.validatingStep1 = false;
    },
    prevStep() {
      this.step = 1;
    },
    cancel() {
      this.resetForm();
      this.dialog = false;
    },
    resetForm() {
      this.form = {
        subject: '',
        reservationId: null,
        category: null,
        customCategory: '',
        description: '',
      };
      this.filesInput = [];
      this.attachments.forEach(a => a.url && URL.revokeObjectURL(a.url));
      this.attachments = [];
      this.step = 1;
      this.submitting = false;
      this.validatingStep1 = false;
    },

    // ===== Attachments UI =====
    onFilesPicked(files) {
      // merge starih + novih (bez duplikata po name+size+type)
      const incoming = Array.from(files || []);
      const existingSig = new Set(this.attachments.map(a => `${a.name}|${a.file?.size}|${a.file?.type}`));
      incoming.forEach(file => {
        const sig = `${file.name}|${file.size}|${file.type}`;
        if (existingSig.has(sig)) return;
        const isImage = /^image\//.test(file.type);
        const url = URL.createObjectURL(file);
        this.attachments.push({
          key: `${sig}|${Date.now()}|${Math.random()}`,
          name: file.name,
          url,
          isImage,
          file,
        });
      });
      // isprazni input (da bi isti fajl mogao opet da se doda posle brisanja)
      this.filesInput = [];
    },
    removeAttachment(idx) {
      const a = this.attachments[idx];
      if (a?.url) URL.revokeObjectURL(a.url);
      this.attachments.splice(idx, 1);
    },
    scrollStrip(dir) {
      const el = this.$refs.strip;
      if (!el) return;
      const step = 220; // px po kliku
      el.scrollBy({ left: dir * step, behavior: 'smooth' });
    },
    preview(item) {
      // jednostavno: otvori blob URL u novom tabu (slike/pdf se prikažu; docx najčešće preuzme browser)
      window.open(item.url, '_blank', 'noopener');
    },

    // ===== Submit =====
    async submit() {
      this.submitting = true;
      this.errorMessage = '';
      
      try {
        // Final validation before submit
        if (!this.form.subject || this.form.subject.trim().length === 0) {
          throw new Error('Subject is required');
        }
        if (!this.form.reservationId) {
          throw new Error('Reservation is required');
        }
        if (!this.form.category) {
          throw new Error('Category is required');
        }
        if (this.form.category === 'Other' && (!this.form.customCategory || this.form.customCategory.trim().length === 0)) {
          throw new Error('Custom category is required when "Other" is selected');
        }
        if (!this.form.description || this.form.description.trim().length === 0) {
          throw new Error('Description is required');
        }
        if (this.attachments.length > 10) {
          throw new Error('Maximum 10 files allowed');
        }

        const categoryName =
          this.form.category === 'Other'
            ? this.form.customCategory.trim()
            : this.form.category;

        const fd = new FormData();
        fd.append('subject', this.form.subject.trim());
        fd.append('reservationId', this.form.reservationId);
        fd.append('category', categoryName);
        fd.append('description', this.form.description.trim());
        
        this.attachments.forEach((a, idx) => {
          if (a.file) {
            fd.append('attachments', a.file, a.file.name || `file_${idx}`);
          }
        });

        const response = await axiosInstance.post('/complaint/newcomplaint', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        console.log('Ticket created successfully:', response.data);
        await this.fetchTickets();
        this.cancel();
        
        // Show success message (if you have snackbar)
        // this.showSnackbar('Ticket created successfully!', 'success');

      } catch (error) {
        console.error('Submit ticket failed', error);
        
        // Handle backend validation errors
        if (error.response?.data?.errors) {
          const errors = error.response.data.errors;
          this.errorMessage = errors.map(e => e.message || e.field || 'Unknown error').join('; ');
        } else if (error.message) {
          this.errorMessage = error.message;
        } else {
          this.errorMessage = 'Failed to create ticket. Please try again.';
        }
        
      } finally {
        this.submitting = false;
      }
    },

    // ===== Existing cards actions =====
    isClosed(status) {
      if (!status) return false;
      const statusName = status.name || status;
      return String(statusName).trim().toLowerCase() === 'closed';
    },
    viewDetails(t) {
      this.$router.push({ name: 'TicketDetails', params: { id: t.id } });
    },
    rate(t) {
      this.selectedTicket = t;
      this.rateDialog = true;
    },

    onTicketRated(ratingData) {
      console.log('Ticket rated:', ratingData);
      // Možete dodati snackbar obaveštenje
      // this.showSnackbar('Thank you for your feedback!', 'success');
      
      // Opciono: Osvežiti listu tiketa da se sakrije dugme
      this.fetchTickets();
    },

    shortName(name) {
      if (!name) return '';
      return name.length > 16 ? name.slice(0, 13) + '…' : name;
    },
  },
};
</script>

<style scoped>
/* Container */
.tickets-container {
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--border-radius-xl);
  backdrop-filter: blur(10px);
  min-height: calc(100vh - 120px);
}

/* Create ticket button */
.create-ticket-btn {
  background: rgba(255, 255, 255, 0.1) !important;
  backdrop-filter: blur(10px) !important;
  border: 2px solid rgba(255, 255, 255, 0.3) !important;
  color: var(--warm-brown) !important;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2) !important;
    border-color: rgba(255, 255, 255, 0.5) !important;
  }
}

/* Loading */
.loading-bar {
  border-radius: 10px !important;
  overflow: hidden;
  box-shadow: var(--warm-shadow-sm);
}

/* Empty state */
.empty-state {
  border-radius: var(--border-radius-lg) !important;
  background: rgba(245, 158, 11, 0.05) !important;
  border: 1px solid rgba(245, 158, 11, 0.2) !important;
  box-shadow: var(--warm-shadow-sm);
  
  :deep(.v-alert__prepend) {
    .v-icon {
      color: var(--warm-orange) !important;
    }
  }
}

/* Tickets grid */
.tickets-grid {
  margin-top: 8px;
}

/* Status specific colors */
.status-pill {
  &.status-open {
    background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%) !important;
    color: white !important;
    border-color: #3B82F6 !important;
  }
  
  &.status-in-progress, &.status-pending {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%) !important;
    color: white !important;
    border-color: #F59E0B !important;
  }
  
  &.status-closed {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%) !important;
    color: white !important;
    border-color: #10B981 !important;
  }
  
  &.status-escalated {
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%) !important;
    color: white !important;
    border-color: #EF4444 !important;
  }
}

/* Action buttons specific styling */
.rate-btn {
  border-color: #10B981 !important;
  color: #10B981 !important;
  
  &:hover {
    background: #10B981 !important;
    color: white !important;
  }
}

.view-btn {
  border-color: #3B82F6 !important;
  color: #3B82F6 !important;
  
  &:hover {
    background: #3B82F6 !important;
    color: white !important;
  }
}

/* poravnavanje visine i veće dugme */
.subject-row { align-items: stretch; }
.subject-field :deep(.v-field) { height: 56px; } /* standardna visina inputa */
.next-btn {
  height: 56px;         /* ostaje kao što je */
  min-width: 120px;     /* dovoljno za tekst "Next" */
  width: auto;          /* neka se prilagodi sadržaju */
  font-weight: 700;
  margin-left: auto;    /* gurne dugme desno u koloni */
}

/* Header */
.tickets-header {
  display: flex;
  align-items: center;
  margin-bottom: 32px;
  padding: 24px;
  background: var(--soft-gradient);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--warm-shadow-sm);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"><g fill="rgba(212,115,10,0.03)"><circle cx="20" cy="20" r="2"/></g></svg>') repeat;
    opacity: 0.5;
  }
}

.page-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
  color: var(--warm-brown);
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
}

.tickets-header .v-btn {
  margin-left: auto;
  position: relative;
  z-index: 1;
  border-radius: var(--border-radius-md) !important;
  padding: 0 24px !important;
  height: 48px !important;
  font-weight: 700 !important;
  letter-spacing: 0.5px !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  
  &:hover {
    
    box-shadow: var(--warm-shadow-md) !important;
  }
}

/* Card */
.ticket-card { 
  border-radius: var(--border-radius-lg) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(245, 158, 11, 0.1) !important;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: var(--warm-gradient);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 0.3s ease;
  }
  
  &:hover {
    /* transform: translateY(...) uklonjeno za bolje UX */
    box-shadow: var(--warm-shadow-lg) !important;
    border-color: rgba(245, 158, 11, 0.3) !important;
    
    &::before {
      transform: scaleX(1);
    }
  }
}

.ticket-title { 
  font-weight: 700; 
  margin-bottom: 16px; 
  font-size: 1.1rem;
  color: var(--warm-brown);
  line-height: 1.4;
}

/* Type & Status */
.kv { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
  margin: 10px 0; 
}

.kv-label { 
  font-weight: 600; 
  color: var(--warm-text);
  font-size: 0.9rem;
  min-width: 60px;
}

.pill {
  display: inline-flex; 
  align-items: center;
  padding: 6px 14px; 
  border: 1.5px solid rgba(245, 158, 11, 0.4);
  border-radius: 20px; 
  font-size: 0.85rem; 
  font-weight: 600;
  background: linear-gradient(135deg, var(--light-orange) 0%, rgba(245, 158, 11, 0.1) 100%);
  color: var(--warm-brown);
  white-space: nowrap;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
    transition: left 0.3s ease;
  }
  
  &:hover {
    background: var(--warm-gradient);
    color: white;
    border-color: var(--warm-orange);
    /* transform: scale(1.05); - uklonjeno za bolje UX */
    
    &::before {
      left: 100%;
    }
  }
}

/* Centered buttons on cards */
.actions-centered { 
  display: flex; 
  justify-content: center; 
  margin-top: 20px; 
  padding-top: 16px;
  border-top: 1px solid rgba(245, 158, 11, 0.1);
}

.btn-outline {
  border-radius: var(--border-radius-md) !important;
  border: 2px solid var(--warm-orange) !important;
  color: var(--warm-orange) !important;
  text-transform: none !important;
  font-weight: 600 !important;
  letter-spacing: 0.3px !important;
  padding: 0 20px !important;
  height: 40px !important;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: var(--warm-gradient);
    transition: left 0.3s ease;
    z-index: 0;
  }
  
  .v-btn__content {
    position: relative;
    z-index: 1;
    transition: color 0.3s ease;
  }
  
  &:hover {
    color: white !important;
    border-color: var(--warm-orange) !important;
    
    box-shadow: var(--warm-shadow-md) !important;
    
    &::before {
      left: 0;
    }
  }
}

/* Step 2: attachments carousel */
.attachments-frame {
  display: grid; 
  grid-template-columns: auto 1fr auto; 
  align-items: center;
  border: 2px solid rgba(245, 158, 11, 0.3); 
  border-radius: var(--border-radius-lg); 
  padding: 16px; 
  gap: 12px;
  background: var(--soft-orange);
  backdrop-filter: blur(10px);
  box-shadow: var(--warm-shadow-sm);
}

.nav-arrow { 
  align-self: center;
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.8) !important;
  color: var(--warm-orange) !important;
  transition: all 0.2s ease !important;
  
  &:hover {
    background: white !important;
    /* transform: scale(1.1); - uklonjeno za bolje UX */
    box-shadow: var(--warm-shadow-sm) !important;
  }
}

.attachments-strip {
  display: flex; 
  gap: 20px; 
  overflow-x: auto; 
  scroll-behavior: smooth; 
  padding: 8px 6px;
  scrollbar-width: thin;
  scrollbar-color: var(--warm-orange) var(--light-orange);
  
  &::-webkit-scrollbar {
    height: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: var(--light-orange);
    border-radius: 10px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: var(--warm-orange);
    border-radius: 10px;
  }
}

.att-card {
  min-width: 200px; 
  max-width: 200px;
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px;
  border-radius: var(--border-radius-md);
  border: 1px solid rgba(245, 158, 11, 0.2);
  transition: all 0.3s ease;
  
  &:hover {
    
    box-shadow: var(--warm-shadow-md);
    background: white;
  }
}

.thumb {
  width: 176px; 
  height: 132px; 
  border: 2px solid rgba(245, 158, 11, 0.3); 
  border-radius: var(--border-radius-sm); 
  position: relative;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  overflow: hidden; 
  background: var(--warm-surface);
  transition: all 0.3s ease;
  
  &:hover {
    border-color: var(--warm-orange);
    box-shadow: var(--warm-shadow-sm);
  }
}

.thumb img { 
  max-width: 100%; 
  max-height: 100%; 
  object-fit: cover;
  transition: transform 0.3s ease;
}

/* .att-card:hover .thumb img { transform: scale(1.05); } - uklonjeno za bolje UX */

.doc-icon { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  width: 100%; 
  height: 100%;
  
  .v-icon {
    color: var(--warm-orange) !important;
    opacity: 0.7;
    transition: all 0.3s ease;
  }
}

.att-card:hover .doc-icon .v-icon {
  opacity: 1;
  /* transform: scale(1.1); - uklonjeno za bolje UX */
}

.remove-dot {
  position: absolute; 
  top: 6px; 
  right: 6px; 
  background: rgba(255, 255, 255, 0.95) !important;
  border: 1px solid rgba(220, 38, 38, 0.3) !important;
  color: var(--warm-red) !important;
  transition: all 0.2s ease !important;
  
  &:hover {
    background: var(--warm-red) !important;
    color: white !important;
    /* transform: scale(1.1); - uklonjeno za bolje UX */
  }
}

.att-name { 
  font-size: 0.85rem; 
  text-align: center; 
  max-width: 176px;
  font-weight: 500;
  color: var(--warm-text);
  line-height: 1.3;
}
</style>
