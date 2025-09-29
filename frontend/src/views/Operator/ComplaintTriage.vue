<template>
  <v-container class="py-6 complaint-triage-container">
    <v-row>
      <!-- LEFT: Ticket Details + Attachments -->
      <v-col cols="12" md="6">
        <div class="section-header animate-fade-in">
          <v-icon size="28" color="var(--warm-orange)" class="mr-3">mdi-gavel</v-icon>
          <h2 class="section-title">Ticket Triage</h2>
        </div>

        <v-card class="details-card" elevation="0">
          <v-skeleton-loader v-if="loading.details" type="article, actions" class="mb-6" />
          <template v-else>
            <v-card-title class="card-title">
              <v-icon class="mr-2">mdi-ticket-account</v-icon>
              Ticket Details
            </v-card-title>
            
            <v-card-text>
              <div class="details-grid">
                <div class="detail-row">
                  <span class="detail-label">Reservation:</span>
                  <span class="detail-value">{{ ticket.reservation || '—' }}</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Category:</span>
                  <v-chip 
                    size="small" 
                    variant="tonal" 
                    class="category-chip"
                    color="primary"
                  >
                    {{ ticket.category || '—' }}
                  </v-chip>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Status:</span>
                  <v-chip 
                    v-if="ticket.status==='NEW'" 
                    size="small" 
                    color="warning" 
                    variant="flat"
                    class="status-chip"
                  >
                    <v-icon size="16" class="mr-1">mdi-new-box</v-icon>
                    NEW
                  </v-chip>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Date Created:</span>
                  <span class="detail-value">{{ formatDate(ticket.createdAt) }}</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Subject:</span>
                  <span class="detail-value">{{ ticket.subject || '—' }}</span>
                </div>

                <div class="detail-row priority-row">
                  <span class="detail-label">Priority:</span>
                  <div class="priority-section">
                    <v-select
                      v-model="selectedPriority"
                      :items="priorityOptions"
                      label="Select priority"
                      density="comfortable"
                      variant="outlined"
                      hide-details
                      class="priority-select"
                      :loading="saving.priority"
                      :disabled="accepting"
                      @update:model-value="onPriorityChanged"
                    />
                    <div v-if="slaPreview" class="sla-preview">
                      <v-icon size="16" class="mr-1">mdi-clock-outline</v-icon>
                      First response: {{ slaPreview?.targetResponseMins ?? '—' }} min •
                      Resolution: {{
                        slaPreview?.targetResolutionMins
                          ? Math.round((slaPreview.targetResolutionMins/60)*10)/10 + ' h'
                          : '—'
                      }}
                    </div>
                  </div>
                </div>
              </div>
            </v-card-text>
          </template>
        </v-card>

        <!-- Attachments Section -->
        <v-card class="attachments-card mt-4" elevation="0">
          <v-card-title class="card-title">
            <v-icon class="mr-2">mdi-paperclip</v-icon>
            Attachments
          </v-card-title>
          
          <v-card-text>
            <div class="attachments-container">
              <v-btn 
                icon 
                size="small" 
                variant="text" 
                class="nav-btn nav-left" 
                @click="scroll(-1)"
              >
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
              
              <div ref="track" class="attachments-track">
                <v-skeleton-loader 
                  v-if="loading.attachments" 
                  type="image, image, image" 
                  class="w-100" 
                  style="min-width: 360px" 
                />
                <template v-else>
                  <a 
                    v-for="(a, i) in attachments" 
                    :key="i" 
                    class="attachment-item" 
                    :href="a.url || '#'" 
                    target="_blank" 
                    rel="noopener"
                    :title="`Open ${a.name || a.label || ''}`"
                    :style="{ cursor: a.url ? 'pointer' : 'not-allowed', opacity: a.url ? 1 : 0.6 }"
                  >
                    <div class="attachment-thumb">
                      <v-icon v-if="a.type==='image'" size="32" color="var(--warm-orange)">mdi-image</v-icon>
                      <v-icon v-else-if="a.type==='pdf'" size="32" color="error">mdi-file-pdf-box</v-icon>
                      <v-icon v-else size="32" color="grey">mdi-file</v-icon>
                    </div>
                    <div class="attachment-caption">{{ a.label || a.name }}</div>
                  </a>
                  <div v-if="attachments.length===0" class="no-attachments">
                    <v-icon size="48" color="grey lighten-2">mdi-paperclip-off</v-icon>
                    <p class="mt-2">No attachments</p>
                  </div>
                </template>
              </div>
              
              <v-btn 
                icon 
                size="small" 
                variant="text" 
                class="nav-btn nav-right" 
                @click="scroll(1)"
              >
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
            </div>
          </v-card-text>
        </v-card>

        <!-- Action Buttons -->
        <div class="action-buttons mt-6">
          <v-btn 
            color="primary" 
            size="large"
            variant="elevated"
            class="accept-btn"
            :loading="accepting" 
            :disabled="!canAccept" 
            @click="acceptTicket"
            prepend-icon="mdi-check-circle"
          >
            Accept Ticket
          </v-btn>
          <v-btn 
            variant="outlined" 
            size="large"
            class="back-btn"
            @click="goBack"
            prepend-icon="mdi-arrow-left"
          >
            Go Back
          </v-btn>
        </div>
      </v-col>

      <!-- RIGHT: Discussion (read-only) -->
      <v-col cols="12" md="6">
        <v-card class="chat-card" elevation="0">
          <v-card-title class="card-title">
            <v-icon class="mr-2">mdi-chat-processing</v-icon>
            Ticket Discussion
            <v-chip size="small" variant="text" color="warning" class="ml-2">
              Read-only
            </v-chip>
          </v-card-title>
          
          <v-card-text class="pa-0">
            <div class="chat-container">
              <div class="chat-scroll" ref="chatScroll">
                <v-skeleton-loader v-if="loading.messages" type="paragraph, paragraph" />
                <template v-else>
                  <div 
                    v-for="(m, idx) in messages" 
                    :key="idx" 
                    class="message-row" 
                    :class="m.sender==='customer' ? 'customer-message' : 'operator-message'"
                  >
                    <div class="message-bubble" :class="m.sender==='customer' ? 'customer-bubble' : 'operator-bubble'">
                      <div class="message-text">{{ m.text }}</div>
                      <div class="message-time">{{ formatLong(m.time) }}</div>
                    </div>
                  </div>
                  <div v-if="messages.length===0" class="no-messages">
                    <v-icon size="48" color="grey lighten-2">mdi-message-outline</v-icon>
                    <p class="mt-2 text-medium-emphasis">No messages yet</p>
                  </div>
                </template>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import axiosInstance from '@/utils/axiosInstance'
import {store} from '@/utils/store'

export default {
  name: 'ComplaintTriage',
  data() {
    return {
      loading: { details: true, attachments: true, messages: true },
      accepting: false,
      saving: { priority: false },
      ticket: {
        id: null, reservation: null, category: null,
        status: null, statusName: null, createdAt: null, assigneeUsername: null
      },
      attachments: [],
      messages: [],
      selectedPriority: null,  // ← korisnik bira ovde
      priorityOptions: ['LOW','MEDIUM','HIGH','CRITICAL'],
      slaPreview: null,        // ← opciono: preview SLA parametara za izabrani priority
    }
  },
  computed: {
    complaintId() { return Number(this.$route.params.id) },
    canAccept() { return !!this.selectedPriority && !this.accepting && this.ticket.status === 'NEW' },
    store() { return store }, 
  },
  created() { this.fetchAll() },
  methods: {
    async fetchAll() {
        await this.fetchTicket()
    },
    async fetchTicket() {
  this.loading.details = this.loading.attachments = this.loading.messages = true
  try {
    const { data: d } = await axiosInstance.get(`/complaint/operator/${this.complaintId}`)

    // Detalji
    this.ticket = {
      id: d.id,
      reservation: d.reservation?.code ?? d.reservationCode ?? null,
      category: d.category ?? null,
      status: d.status?.code ?? null,
      statusName: d.status?.name ?? null,
      createdAt: d.createdAt ?? null,
      subject: d.subject ?? null,
    }
    this.selectedPriority = d.priority ?? null

    // Attachments (stižu kao d.attachments)
    const atts = Array.isArray(d.attachments) ? d.attachments : []
    this.attachments = atts.map(x => {
      const name =
        x.originalFilename ||
        x.name ||
        (x.storageKey ? String(x.storageKey).split('/').pop() : '') ||
        'file'

      // u tvom JSON-u nema contentType -> odredi po ekstenziji
      const type = this.fileTypeByName(name)
      const url  = x.storageKey ? this.toAbsoluteUrl(String(x.storageKey)) : null

      return {
        id: x.id,
        name,
        label: name.length > 18 ? name.slice(0, 16) + '…' : name,
        url,
        type, // 'image' | 'pdf' | 'file'
      }
    })
    this.loading.attachments = false

    // Messages (ako već stižu iz iste rute, koristi ih)
    const msgs = Array.isArray(d.messages) ? d.messages : []
    this.messages = msgs.map(m => ({
      sender: m.sender || m.authorUsername ? 'customer' : 'operator', // prilagodi ako imaš svoje oznake
      text:   m.text || m.body || '',
      time:   m.time || m.createdAt || new Date().toISOString(),
    }))
    this.loading.messages = false

  } catch (e) {
    console.error('fetchTicket failed', e)
  } finally {
    this.loading.details = false
  }
},
    // (opciono) povuci SLA preview za izabrani priority
   async onPriorityChanged(p) {
  this.slaPreview = null
  if (!p) return
  try {
    const { data } = await axiosInstance.get(`/sla/parameters`, { params: { priority: p }})
    console.log('SLA params for', p, data)
    this.slaPreview = data[0] || null
    console.log('SLA preview set', this.slaPreview)
  } catch (e) {
    console.error('SLA fetch failed', e)
    this.slaPreview = null
  }
},

    // Accept: zakuca priority i prebacuje NEW -> PENDING, pa redirect na operator view
    async acceptTicket() {
      if (!this.canAccept) return
      this.accepting = true
      try {
        // 1) Postavi priority (zakucaj)
        await axiosInstance.post(`/complaint/accept`, { 
            complaintId: this.complaintId,
            assigneeUsername: this.store.username, 
            priority: this.selectedPriority
          })

        // 3) Redirect na operaterski view (gde već imaš chat/status dialog itd.)
        this.$router.replace({ name: 'OperatorTicketDetails', params: { id: this.complaintId } })
      } catch (e) {
        console.error('acceptTicket failed', e)
      } finally {
        this.accepting = false
      }
    },

    // helpers
    toAbsoluteUrl(storageKey = '') {
      if (!storageKey) return null
      if (/^https?:\/\//i.test(storageKey)) return storageKey
      const clean = String(storageKey).replace(/^\/+/, '')
      const base = axiosInstance?.defaults?.baseURL || ''
      let originOnly; try { originOnly = new URL(base, window.location.origin).origin } catch { originOnly = window.location.origin }
      return `${originOnly}/${clean}`
    },
    fileTypeByName(name='') {
      const s = name.toLowerCase()
      if (/\.(png|jpe?g|gif|webp)$/.test(s)) return 'image'
      if (/\.pdf$/.test(s)) return 'pdf'
      return 'file'
    },
    formatDate(iso) {
      if (!iso) return '—'
      const d = new Date(iso); if (isNaN(d)) return '—'
      const yyyy=d.getFullYear(), mm=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0')
      const hh=String(d.getHours()).padStart(2,'0'), mi=String(d.getMinutes()).padStart(2,'0')
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
    },
    formatLong(iso) {
      const d = new Date(iso); if (isNaN(d)) return ''
      return `${d.toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric'})}, ${d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`
    },
    scroll(dir) {
      const el = this.$refs.track; if (!el) return
      el.scrollBy({ left: dir * (el.clientWidth*0.8), behavior: 'smooth' })
    },
    goBack() { this.$router.back() },
  },
}
</script>

<style scoped lang="scss">
.complaint-triage-container {
  min-height: 100vh;
  background: linear-gradient(135deg, 
    rgba(244, 244, 245, 0.95) 0%, 
    rgba(255, 251, 235, 0.95) 100%);
}

.section-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;

  .section-title {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--warm-brown);
    margin: 0;
    background: linear-gradient(135deg, #8B4513, #D2691E);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.details-card,
.attachments-card,
.chat-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(212, 115, 10, 0.1);
  transition: all 0.3s ease;
  animation: slideInUp 0.6s ease-out;

  &:hover {
    box-shadow: 0 8px 25px rgba(212, 115, 10, 0.15);
  }

  .card-title {
    background: linear-gradient(135deg, 
      rgba(212, 115, 10, 0.1) 0%, 
      rgba(245, 158, 11, 0.05) 100%);
    color: var(--warm-brown);
    font-weight: 600;
    font-size: 1.1rem;
    border-radius: 16px 16px 0 0;
    border-bottom: 1px solid rgba(212, 115, 10, 0.1);

    .v-icon {
      color: var(--warm-orange);
    }
  }
}

.details-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  .detail-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid rgba(212, 115, 10, 0.1);

    &:last-child {
      border-bottom: none;
    }

    &.priority-row {
      flex-direction: column;
      align-items: stretch;
      gap: 0.5rem;
    }
  }

  .detail-label {
    font-weight: 600;
    color: var(--warm-brown);
    min-width: 120px;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .detail-value {
    color: var(--warm-text);
    font-weight: 500;
    white-space: pre-wrap;
  }
}

.priority-section {
  width: 100%;

  .priority-select {
    :deep(.v-field) {
      background: rgba(255, 255, 255, 0.9);
      border-radius: 12px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 1);
        
        box-shadow: 0 4px 12px rgba(212, 115, 10, 0.15);
      }
    }

    :deep(.v-field--focused) {
      box-shadow: 0 0 0 2px rgba(212, 115, 10, 0.2);
    }
  }

  .sla-preview {
    display: flex;
    align-items: center;
    font-size: 0.8rem;
    color: var(--warm-text);
    opacity: 0.8;
    background: rgba(212, 115, 10, 0.05);
    padding: 8px 12px;
    border-radius: 8px;
    margin-top: 8px;

    .v-icon {
      color: var(--warm-orange);
    }
  }
}

.category-chip,
.status-chip {
  font-weight: 600;
  border-radius: 8px;
  
  &.v-chip--variant-tonal {
    background: rgba(212, 115, 10, 0.1) !important;
    color: var(--warm-orange) !important;
  }

  &.v-chip--variant-flat {
    background: linear-gradient(135deg, #F59E0B, #FBBF24);
    color: white;
  }

  .v-icon {
    margin-right: 4px;
  }
}

.attachments-container {
  position: relative;
  min-height: 180px;
  border: 2px dashed rgba(212, 115, 10, 0.2);
  border-radius: 12px;
  padding: 20px 50px;

  .nav-btn {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2;
    background: rgba(255, 255, 255, 0.9);
    color: var(--warm-orange);
    border: 1px solid rgba(212, 115, 10, 0.2);

    &:hover {
      background: rgba(212, 115, 10, 0.1);
    }

    &.nav-left {
      left: 10px;
    }

    &.nav-right {
      right: 10px;
    }
  }

  .attachments-track {
    display: flex;
    overflow-x: auto;
    gap: 16px;
    scroll-behavior: smooth;
    padding: 4px;
    min-height: 140px;

    &::-webkit-scrollbar {
      height: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(212, 115, 10, 0.1);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(212, 115, 10, 0.3);
      border-radius: 3px;

      &:hover {
        background: rgba(212, 115, 10, 0.5);
      }
    }
  }

  .attachment-item {
    min-width: 120px;
    max-width: 120px;
    background: rgba(255, 255, 255, 0.9);
    border: 1px solid rgba(212, 115, 10, 0.2);
    border-radius: 12px;
    padding: 12px;
    text-align: center;
    text-decoration: none;
    transition: all 0.3s ease;

    &:hover {
      /* transform: translateY(...) uklonjeno za bolje UX */
      box-shadow: 0 8px 25px rgba(212, 115, 10, 0.15);
      border-color: var(--warm-orange);
    }

    .attachment-thumb {
      height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px dashed rgba(212, 115, 10, 0.3);
      border-radius: 8px;
      margin-bottom: 8px;
      background: rgba(212, 115, 10, 0.05);
    }

    .attachment-caption {
      font-size: 0.75rem;
      color: var(--warm-text);
      font-weight: 500;
      line-height: 1.2;
    }
  }

  .no-attachments {
    text-align: center;
    padding: 2rem;
    color: var(--warm-text);
    opacity: 0.6;

    .v-icon {
      opacity: 0.3;
    }
  }
}

.action-buttons {
  display: flex;
  gap: 1rem;
  justify-content: flex-start;

  .accept-btn {
    background: linear-gradient(135deg, #D4730A, #F59E0B);
    color: white;
    border-radius: 12px;
    font-weight: 600;
    padding: 0 2rem;
    transition: all 0.3s ease;

    &:hover {
      
      box-shadow: 0 8px 25px rgba(212, 115, 10, 0.3);
    }

    &:disabled {
      background: rgba(212, 115, 10, 0.3);
      transform: none;
      box-shadow: none;
    }
  }

  .back-btn {
    border: 2px solid rgba(212, 115, 10, 0.3);
    color: var(--warm-orange);
    border-radius: 12px;
    font-weight: 500;
    padding: 0 2rem;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(212, 115, 10, 0.1);
      border-color: var(--warm-orange);
      
    }
  }

  @media (max-width: 768px) {
    flex-direction: column;

    .accept-btn,
    .back-btn {
      width: 100%;
    }
  }
}

.chat-container {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.95) 0%, 
    rgba(255, 251, 235, 0.95) 100%);
  border-radius: 12px;
  border: 1px solid rgba(212, 115, 10, 0.1);

  .chat-scroll {
    height: 400px;
    overflow-y: auto;
    padding: 1rem;

    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-track {
      background: rgba(212, 115, 10, 0.1);
      border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(212, 115, 10, 0.3);
      border-radius: 3px;

      &:hover {
        background: rgba(212, 115, 10, 0.5);
      }
    }
  }

  .message-row {
    display: flex;
    margin: 1rem 0;

    &.customer-message {
      justify-content: flex-end;
    }

    &.operator-message {
      justify-content: flex-start;
    }
  }

  .message-bubble {
    max-width: 75%;
    padding: 12px 16px;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    animation: messageSlideIn 0.3s ease-out;

    &.customer-bubble {
      background: linear-gradient(135deg, #D4730A, #F59E0B);
      color: white;
      border-bottom-right-radius: 4px;
    }

    &.operator-bubble {
      background: rgba(255, 255, 255, 0.9);
      color: var(--warm-text);
      border: 1px solid rgba(212, 115, 10, 0.2);
      border-bottom-left-radius: 4px;
    }

    .message-text {
      white-space: pre-line;
      line-height: 1.4;
      font-size: 0.95rem;
    }

    .message-time {
      font-size: 0.75rem;
      opacity: 0.8;
      margin-top: 8px;
      text-align: right;
    }
  }

  .no-messages {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--warm-text);
    opacity: 0.6;

    .v-icon {
      opacity: 0.3;
    }
  }
}

// Animation keyframes
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

// Responsive design
@media (max-width: 768px) {
  .complaint-triage-container {
    padding: 1rem;
  }

  .section-header {
    .section-title {
      font-size: 1.5rem;
    }
  }

  .details-grid {
    .detail-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;

      .detail-label {
        min-width: auto;
      }
    }
  }

  .attachments-container {
    padding: 15px 40px;

    .nav-btn {
      &.nav-left {
        left: 5px;
      }

      &.nav-right {
        right: 5px;
      }
    }
  }

  .chat-container {
    .chat-scroll {
      height: 300px;
    }

    .message-bubble {
      max-width: 85%;
    }
  }
}
</style>
