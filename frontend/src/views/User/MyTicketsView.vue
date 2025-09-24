<template>
  <v-container class="py-6">
    <!-- Header -->
    <div class="tickets-header">
      <h1 class="page-title">My Tickets</h1>
      <v-btn
        variant="outlined"
        class="btn-outline"
        prepend-icon="mdi-plus"
        @click="createNew"
      >
        New Ticket
      </v-btn>
    </div>

    <!-- Loading / Empty states -->
    <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />
    <v-alert
      v-else-if="tickets.length === 0"
      type="info"
      variant="tonal"
      class="mt-6"
      title="No tickets yet"
      text="Click New Ticket to create your first support request."
    />

    <!-- Grid -->
    <v-row v-else dense>
      <v-col v-for="t in tickets" :key="t.id" cols="12" sm="6" md="4">
        <v-card class="ticket-card" elevation="1">
          <v-card-text>
            <div class="ticket-title">{{ t.subject }}</div>

            <div class="kv">
              <span class="kv-label">Type:</span>
              <span class="pill">{{ t.category }}</span>
            </div>

            <div class="kv">
              <span class="kv-label">Status:</span>
              <span class="pill">{{ t.status.name }}</span>
            </div>

            <div class="actions-centered">
              <v-btn v-if="isClosed(t.status)" variant="outlined" class="btn-outline" @click="rate(t)">
                Rate Our Service
              </v-btn>
              <v-btn v-else variant="outlined" class="btn-outline" @click="viewDetails(t)">
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
                :rules="[rules.required]"
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
                    :rules="[rules.required]"
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
                :rules="[rules.required]"
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
                accept="image/*,.pdf,.doc,.docx"
                hide-details
                show-size
                density="comfortable"
                variant="outlined"
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
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
import axiosInstance from '@/utils/axiosInstance';

export default {
  name: 'MyTickets',
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
      },     // [{key,name,url,isImage,file}]
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
      // validate step 1
      this.validatingStep1 = true;
      const okSubject = this.form.subject && this.form.subject.trim().length > 0 && this.form.subject.length <= 255;
      const okReservation = !!this.form.reservationId;
      const okCategory =
        this.form.category === 'Other'
          ? this.form.customCategory && this.form.customCategory.trim().length > 0 && this.form.customCategory.length <= 128
          : !!this.form.category;
      const okDesc = this.form.description && this.form.description.trim().length > 0;

      if (okSubject && okReservation && okCategory && okDesc) {
        this.step = 2;
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
      try {
        const categoryName =
          this.form.category === 'Other'
            ? this.form.customCategory.trim()
            : this.form.category;

        const fd = new FormData();
        fd.append('subject', this.form.subject);
        fd.append('reservationId', this.form.reservationId);
        fd.append('categoryName', categoryName);
        fd.append('description', this.form.description);
        this.attachments.forEach((a, idx) => {
          fd.append('attachments', a.file, a.file.name || `file_${idx}`);
        });
				console.log("Saljem zahtev:", fd);
        await axiosInstance.post('/complaint/newcomplaint', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        await this.fetchTickets();
        this.cancel();
      } catch (e) {
        console.error('Submit ticket failed', e);
      } finally {
        this.submitting = false;
      }
    },

    // ===== Existing cards actions =====
    isClosed(s) {
      return String(s).trim().toLowerCase() === 'closed';
    },
    viewDetails(t) {
      this.$router.push({ name: 'TicketDetails', params: { id: t.id } });
    },
    rate(t) {
      console.log('Rate ticket', t.id);
    },

    shortName(name) {
      if (!name) return '';
      return name.length > 16 ? name.slice(0, 13) + '…' : name;
    },
  },
};
</script>

<style scoped>
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
  margin-bottom: 16px;
}
.page-title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 800;
}
.tickets-header .v-btn {
  margin-left: auto;
}

/* Card */
.ticket-card { border-radius: 12px; }
.ticket-title { font-weight: 700; margin-bottom: 12px; }

/* Type & Status */
.kv { display: flex; align-items: center; gap: 10px; margin: 6px 0; }
.kv-label { font-weight: 600; }
.pill {
  display: inline-flex; align-items: center;
  padding: 4px 10px; border: 1.5px solid #cfcfcf;
  border-radius: 9999px; font-size: 0.85rem; background: #fafafa; white-space: nowrap;
}

/* Centered buttons on cards */
.actions-centered { display: flex; justify-content: center; margin-top: 16px; }
.btn-outline {
  border-radius: 10px !important;
  border: 1.5px solid rgba(0,0,0,0.38) !important;
  text-transform: none; font-weight: 600;
}

/* Step 2: attachments carousel */
.attachments-frame {
  display: grid; grid-template-columns: auto 1fr auto; align-items: center;
  border: 2px solid #c9c9c9; border-radius: 8px; padding: 10px; gap: 8px;
}
.nav-arrow { align-self: center; }
.attachments-strip {
  display: flex; gap: 16px; overflow-x: auto; scroll-behavior: smooth; padding: 6px 4px;
}
.att-card {
  min-width: 180px; max-width: 180px;
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.thumb {
  width: 160px; height: 120px; border: 2px solid #c9c9c9; border-radius: 8px; position: relative;
  display: flex; align-items: center; justify-content: center; overflow: hidden; background: #fafafa;
}
.thumb img { max-width: 100%; max-height: 100%; object-fit: cover; }
.doc-icon { display:flex; align-items:center; justify-content:center; width:100%; height:100%; }
.remove-dot {
  position: absolute; top: 4px; right: 4px; background: #fff;
  border: 1px solid rgba(0,0,0,0.25);
}
.att-name { font-size: 0.85rem; text-align: center; max-width: 160px; }
</style>
