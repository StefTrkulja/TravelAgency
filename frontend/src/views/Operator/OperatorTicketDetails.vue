<template>
  <v-container class="py-6 operator-ticket-details-container">
    <v-row>
      <v-col cols="12" md="6">
        <div class="section-header animate-fade-in">
          <v-icon size="28" color="var(--warm-orange)" class="mr-3">mdi-ticket-detailed</v-icon>
          <h2 class="section-title">Ticket Details</h2>
        </div>

        <v-card class="details-card" elevation="0">
          <v-skeleton-loader v-if="loading.details" type="article, actions" class="mt-2 mb-4" />

          <template v-else>
            <v-card-title class="card-title">
              <v-icon class="mr-2">mdi-information</v-icon>
              Case Information
            </v-card-title>
            
            <v-card-text>
              <div class="details-grid">
                <div class="detail-row">
                  <span class="detail-label">Case ID:</span>
                  <v-chip size="small" variant="text" class="case-id-chip">
                    #{{ ticket.caseId }}
                  </v-chip>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Reservation:</span>
                  <span class="detail-value">{{ ticket.reservation ?? '—' }}</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Passenger:</span>
                  <span class="detail-value">{{ ticket.passenger ?? '—' }}</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Category:</span>
                  <v-chip 
                    size="small" 
                    variant="tonal" 
                    class="category-chip"
                    color="primary"
                  >
                    {{ ticket.category ?? '—' }}
                  </v-chip>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Status:</span>
                  <v-chip 
                    variant="tonal" 
                    color="primary" 
                    class="status-chip"
                    :class="{ 'disabled-chip': isEscalated }"
                    :title="isEscalated ? 'Ticket je eskaliran – status menja viši nivo' : 'Promeni status'"
                    @click="onStatusChipClick"
                  >
                    <v-icon size="16" class="mr-1">mdi-flag-outline</v-icon>
                    {{ ticket.statusName || ticket.status || '—' }}
                  </v-chip>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Date Created:</span>
                  <span class="detail-value">{{ formatDate(ticket.createdAt) }}</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Priority:</span>
                  <v-chip 
                    class="priority-chip" 
                    :color="priorityColor(ticket.priority)" 
                    variant="flat"
                  >
                    <v-icon size="16" class="mr-1">{{ getPriorityIcon(ticket.priority) }}</v-icon>
                    {{ (ticket.priority || '—').toUpperCase() }}
                  </v-chip>
                </div>
              </div>
            </v-card-text>
          </template>

          <!-- Status Dialog -->
          <ComplaintStatusDialog 
            :key="ticket.caseId" 
            v-model="statusDialog" 
            :complaint-id="ticket.caseId"
            :status-id="ticket.statusId" 
            :current-status-code="ticket.status"
            :current-status-name="ticket.statusName || ticket.status" 
            @updated="onStatusUpdated" 
          />
        </v-card>

        <!-- Activity Status Section -->
        <v-card class="activity-card mt-4" elevation="0">
          <v-card-title class="card-title">
            <v-icon class="mr-2">mdi-history</v-icon>
            Activity History
          </v-card-title>
          
          <v-card-text>
            <v-skeleton-loader v-if="loading.history" type="table" class="mt-2 mb-3" />
            <template v-else>
              <div class="activity-grid" v-if="activityRows.length">
                <div class="activity-header">
                  <span>Status</span>
                  <span>Valid From</span>
                  <span>Note</span>
                  <span>Changed By</span>
                </div>
                <div v-for="(r, i) in activityRows" :key="i" class="activity-row">
                  <span class="status-cell">{{ r.statusName }}</span>
                  <span class="date-cell">{{ r.validFrom }}</span>
                  <span class="note-cell">{{ r.note || '—' }}</span>
                  <span class="user-cell">{{ r.changedBy || '—' }}</span>
                </div>
              </div>
              <div v-else class="no-activity">
                <v-icon size="48" color="grey lighten-2">mdi-history</v-icon>
                <p class="mt-2 text-medium-emphasis">No activity history</p>
              </div>
            </template>
          </v-card-text>
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
                      <v-icon v-if="a.type === 'image'" size="32" color="var(--warm-orange)">mdi-image</v-icon>
                      <v-icon v-else-if="a.type === 'pdf'" size="32" color="error">mdi-file-pdf-box</v-icon>
                      <v-icon v-else size="32" color="grey">mdi-file</v-icon>
                    </div>
                    <div class="attachment-caption">{{ a.label || a.name }}</div>
                  </a>

                  <div v-if="attachments.length === 0" class="no-attachments">
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
      </v-col>

      <!-- RIGHT: Chat -->
      <v-col cols="12" md="6">
        <v-card class="chat-card" elevation="0">
          <div class="chat-header">
            <v-tabs v-model="activeTab" density="comfortable" class="w-100" color="primary">
              <v-tab value="customer" class="chat-tab">
                <v-icon class="mr-2">mdi-account</v-icon>
                {{ ticket.passenger || 'Customer' }}
              </v-tab>
              <v-tab value="manager" class="chat-tab">
                <v-icon class="mr-2">mdi-account-tie</v-icon>
                Manager
              </v-tab>
            </v-tabs>
          </div>

          <div class="chat-body">
            <v-skeleton-loader v-if="loading.messages" type="paragraph, paragraph" />
            <template v-else>
              <div 
                v-for="(m, idx) in viewMessages" 
                :key="idx" 
                class="message-row"
                :class="m.sender === 'customer' ? 'customer-message' : 'operator-message'"
              >
                <template v-if="m.sender !== 'customer'">
                  <v-avatar size="32" class="message-avatar operator-avatar">
                    <v-icon>mdi-account</v-icon>
                  </v-avatar>
                </template>

                <div class="message-content">
                  <div class="sender-label">{{ m.sender }}</div>
                  <div class="message-bubble" :class="m.sender === 'customer' ? 'customer-bubble' : 'operator-bubble'">
                    <div class="message-text">{{ m.text }}</div>
                    <div class="message-timestamp">{{ formatTime(m.time) }}</div>
                  </div>
                </div>

                <template v-if="m.sender === 'customer'">
                  <v-avatar size="32" class="message-avatar customer-avatar">
                    <v-icon>mdi-account</v-icon>
                  </v-avatar>
                </template>
              </div>

              <div v-if="viewMessages.length === 0" class="no-messages">
                <v-icon size="48" color="grey lighten-2">mdi-message-outline</v-icon>
                <p v-if="activeTab === 'customer'" class="mt-2 text-medium-emphasis">No messages yet</p>
                <p v-else-if="activeTab === 'manager' && !escalationId" class="mt-2 text-medium-emphasis">
                  This ticket hasn't been escalated yet. Escalate the ticket to communicate with the manager.
                </p>
                <p v-else class="mt-2 text-medium-emphasis">No internal messages yet</p>
              </div>
            </template>
          </div>

          <div class="chat-composer">
            <v-text-field 
              v-model="draft" 
              density="comfortable" 
              variant="outlined" 
              hide-details
              :placeholder="activeTab === 'manager' && !escalationId ? 'Escalate ticket first to send messages' : 'Type your message...'" 
              class="composer-input" 
              :disabled="sending || (activeTab === 'manager' && !escalationId)" 
              @keydown.enter.prevent="send"
            />
            <v-btn 
              color="primary"
              variant="elevated"
              class="send-btn" 
              :loading="sending" 
              :disabled="!draft?.trim() || (activeTab === 'manager' && !escalationId)" 
              @click="send"
            >
              <v-icon>mdi-send</v-icon>
            </v-btn>
          </div>

          <div class="chat-actions">
            <v-btn 
              variant="outlined" 
              class="action-btn" 
              @click="onEscalateClick"
              prepend-icon="mdi-arrow-up-bold"
            >
              Escalate
            </v-btn>
            <v-btn 
              variant="outlined" 
              class="action-btn" 
              @click="compDialog = true"
              prepend-icon="mdi-gift"
            >
              Propose Compensation
            </v-btn>
          </div>

          <div class="chat-footer">
            <v-btn 
              variant="outlined" 
              class="footer-btn"
              prepend-icon="mdi-check-circle"
            >
              Close Ticket
            </v-btn>
            <v-btn 
              variant="outlined" 
              class="footer-btn" 
              @click="$router.back()"
              prepend-icon="mdi-arrow-left"
            >
              Go Back
            </v-btn>
          </div>
        </v-card>
      </v-col>

      <!-- Dialogs -->
      <EscalateCaseDialog 
        v-model="escalateDialog" 
        :ticket="{
          id: ticket.caseId,
          subject: ticket.category || '—',
          assigneeUsername: store?.username || '—',
          statusName: ticket.statusName || ticket.status,
          priority: ticket.priority
        }" 
        :submitting="escalating" 
        @submit="handleEscalate" 
        @cancel="() => (escalateDialog = false)" 
      />
      
      <ProposeCompensationDialog 
        v-model="compDialog" 
        :ticket="{
          id: ticket.caseId,
          subject: ticket.category || '—',
          passenger: ticket.passenger || '—'
        }" 
        default-currency="USD" 
        default-type="VOUCHER" 
        @submit="handleCompSubmit" 
        @pdf="handleCompPdf" 
      />
    </v-row>
  </v-container>
  
  <v-snackbar 
    v-model="snackbar.show" 
    :timeout="snackbar.timeout" 
    :color="snackbar.color" 
    location="bottom right"
    rounded="lg"
  >
    {{ snackbar.text }}
  </v-snackbar>
</template>

<script>
import axiosInstance from '@/utils/axiosInstance'
import ComplaintStatusDialog from '@/components/ComplaintStatusDialog.vue'
import EscalateCaseDialog from '@/components/EscalateCaseDialog.vue'
import ProposeCompensationDialog from '@/components/ProposeCompensationDialog.vue'

import { store } from '@/utils/store'
export default {
  name: 'OperatorTicketDetails',
  components: { ComplaintStatusDialog, EscalateCaseDialog, ProposeCompensationDialog },
  data() {
    return {
      // ticket data
      ticket: {
        caseId: null,
        reservation: null,
        passenger: null,
        category: null,
        status: null,
        statusId: null,
        statusName: null,
        createdAt: null,
        priority: 'Low',
      },
      // activity/history rows that prikazujemo u tabeli
      activityRows: [],
      attachments: [],

      // poruke
      customerMessages: [],
      managerMessages: [],
      escalateDialog: false,
      escalating: false,
      escalationId: null,  // dodano za čuvanje escalation ID
      // UI state
      activeTab: 'customer',
      draft: '',
      sending: false,
      statusDialog: false,
      loading: {
        details: true,
        history: true,
        messages: true,
        attachments: true,
      },
      saving: {
        priority: false,
      },
      compDialog: false,
      snackbar: { show: false, text: '', color: 'warning', timeout: 3500 },

      // static options
      priorityOptions: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    }
  },
  computed: {
    viewMessages() {
      return this.activeTab === 'manager' ? this.managerMessages : this.customerMessages
    },
    complaintId() {
      // očekujem /operator/tickets/:id ili slično
      return Number(this.$route.params.id)
    },
    store() {
      console.log(store);
      return store;
    },
    isPending() { return this.ticket.status === 'PENDING' },
    isInProgress() { return this.ticket.status === 'IN_PROGRESS' },
    isWaitingInfo() { return this.ticket.status === 'WAITING_INFO' },
    isTerminal() { return this.ticket.status === 'CLOSED' || this.ticket.status === 'REJECTED' },
  },
  watch: {
    activeTab() {
      // resetuj draft kada se promeni tab
      this.draft = ''
    }
  },
  methods: {
    isEscalated() { return this.ticket.status === 'ESCALATED' },
  },
  created() {
    this.bootstrap()
  },
  methods: {
    async bootstrap() {
      await Promise.all([
        this.fetchTicket(),
        this.fetchHistory(),
        this.fetchMessages(),
        this.fetchManagerMessages(),
      ])
    },

    priorityColor(p) {
      const key = (p || '').toString().toUpperCase()
      switch (key) {
        case 'CRITICAL': return 'red'
        case 'HIGH': return 'deep-orange'
        case 'MEDIUM': return 'amber'
        case 'LOW': return 'green'
        default: return 'grey'
      }
    },
    getPriorityIcon(priority) {
      if (!priority) return 'mdi-flag-outline';
      const p = String(priority).toLowerCase();
      switch(p) {
        case 'critical': return 'mdi-fire';
        case 'high': return 'mdi-flag';
        case 'medium': return 'mdi-flag-outline';
        case 'low': return 'mdi-flag-variant-outline';
        default: return 'mdi-flag-outline';
      }
    },
    /* ============== API ============== */

    // 1) Detalji tiketa (za operatora)
    async fetchTicket() {
      this.loading.details = true
      try {
        // Ako koristiš drugi endpoint, samo zameni url:
        // const { data } = await axiosInstance.get(`/complaint/mycomplaints/${this.complaintId}`)
        const { data } = await axiosInstance.get(`/complaint/operator/${this.complaintId}`)
        // mapiranje na UI polja
        this.ticket.caseId = data.id
        this.ticket.reservation = data.reservation?.code ?? data.reservationCode ?? null
        this.ticket.passenger = (data.passengerName ?? ([data.user?.name, data.user?.surname].filter(Boolean).join(' ') || null))
        this.ticket.category = data.category ?? null
        this.ticket.status = data.status?.code ?? null
        this.ticket.statusName = data.status?.name ?? null
        this.ticket.createdAt = data.createdAt ?? null
        this.ticket.statusId = data.statusId ?? data.status?.id ?? null
        // (opciono) priority iz BE ako postoji
        this.ticket.priority = data.priority ?? this.ticket.priority
        this.loading.attachments = true
        try {
          const atts = Array.isArray(data.attachments) ? data.attachments : []
          this.attachments = atts.map(x => {
            const name =
              x.originalFilename ||
              x.name ||
              (x.storageKey ? String(x.storageKey).split('/').pop() : '') ||
              'file'
            const url = x.storageKey ? this.toAbsoluteUrl(String(x.storageKey)) : null
            const type = this.fileTypeByName(name)
            return { id: x.id, name, label: name.length > 18 ? name.slice(0, 16) + '…' : name, url, type }
          })
        } finally {
          this.loading.attachments = false
        }
      } catch (e) {
        console.error('fetchTicket failed:', e)
      } finally {
        this.loading.details = false
      }
    },
    async handleEscalate({ ticketId, reason, files }) {
      this.escalating = true
      try {

        await axiosInstance.post(`/escalation/${ticketId}/escalate`, { reason })

        // po tvojoj napomeni: "Kada se eskalira, ticket status ce automatski preci na escalated"
        // odmah reflektuj u UI i osveži istoriju
        this.ticket.status = 'ESCALATED'
        this.ticket.statusName = 'Escalated'

        await this.fetchHistory()
        this.escalateDialog = false
      } catch (e) {
        console.error('Escalate failed:', e)
      } finally {
        this.escalating = false
      }
    },

    async handleCompSubmit(payload) {
      try {
        await axiosInstance.post(`/compensation/${payload.caseId}/propose`, payload)
        await this.fetchHistory()
      } catch (e) {
        console.error('Compensation submit failed:', e)
      }
    },
    onStatusChipClick() {
      if (this.isEscalated) {
        this.showWarn('Ticket je već eskaliran. Promenu statusa radi viši nivo.')
        return
      }
      this.statusDialog = true
    },

    onEscalateClick() {
      if (this.isEscalated) {
        this.showWarn('Ticket je već eskaliran – nije moguće ponovo eskalirati.')
        return
      }
      this.escalateDialog = true
    },

    showWarn(msg) {
      this.snackbar.text = msg
      this.snackbar.color = 'warning'
      this.snackbar.show = true
    },

    async handleEscalate({ ticketId, reason, files }) {
      if (this.isEscalated) {
        this.showWarn('Ticket je već eskaliran – nije moguće ponovo eskalirati.')
        return
      }
      this.escalating = true
      try {
        await axiosInstance.post(`/escalation/${ticketId}/escalate`, { reason })

        // odmah reflektuj promenу
        this.ticket.status = 'ESCALATED'
        this.ticket.statusName = 'Escalated'

        await this.fetchHistory()
        this.escalateDialog = false
      } catch (e) {
        console.error('Escalate failed:', e)
      } finally {
        this.escalating = false
      }
    },
    scroll(dir) {
      const el = this.$refs.track; if (!el) return
      el.scrollBy({ left: dir * (el.clientWidth * 0.8), behavior: 'smooth' })
    },
    toAbsoluteUrl(storageKey = '') {
      if (!storageKey) return null
      if (/^https?:\/\//i.test(storageKey)) return storageKey
      const clean = String(storageKey).replace(/^\/+/, '')
      const base = axiosInstance?.defaults?.baseURL || ''
      let originOnly; try { originOnly = new URL(base, window.location.origin).origin } catch { originOnly = window.location.origin }
      return `${originOnly}/${clean}`
    },
    fileTypeByName(name = '') {
      const s = name.toLowerCase()
      if (/\.(png|jpe?g|gif|webp)$/.test(s)) return 'image'
      if (/\.pdf$/.test(s)) return 'pdf'
      return 'file'
    },
    // 2) Activity / History
    async fetchHistory() {
      this.loading.history = true
      try {
        // Ako si rutu nazvao drugačije, zameni:
        const { data: rows } = await axiosInstance.get(`/complaint/${this.complaintId}/history`)
        // mapiraj na grid:
        this.activityRows = (rows || []).map(h => ({
          statusName: h.toStatusName || h.toStatus?.code || '—',
          validFrom: this.toYMD(h.changedAt),
          note: h.note || '',
          changedBy: h.changedBy?.username || h.changedByUsername || '',
        }))
      } catch (e) {
        console.error('fetchHistory failed:', e)
        this.activityRows = []
      } finally {
        this.loading.history = false
      }
    },


    async onPriorityChange(nextPriority) {
      const prev = this.ticket.priority
      this.saving.priority = true

      try {
        // ✅ Pokušaj 1: generički PATCH (preporučeno)
        await axiosInstance.patch(`/complaint/${this.complaintId}/priority`, { priority: nextPriority })

        // Ako koristiš poseban endpoint, umesto gornjeg koristi:
        // await axiosInstance.patch(`/complaint/${this.complaintId}/priority`, { priority: nextPriority })

        // (opciono) refetch da osvežiš sve iz BE:
        // await this.fetchTicket()
      } catch (e) {
        console.error('update priority failed:', e)
        // vrati staru vrednost ako BE odbije
        this.ticket.priority = prev
      } finally {
        this.saving.priority = false
      }
    },

    // 3) Poruke
    async fetchMessages() {
      this.loading.messages = true
      try {
        // Ako trenutno imaš samo /complaint/mycomplaints/:id/messages, zameni ovde url
        const { data: msgs } = await axiosInstance.get(`/complaint/${this.complaintId}/messages`)
        // očekujem [{ sender, text, time }] ili mapiraj prema BE strukturi:
        const mapped = (msgs || []).map(m => ({
          sender: m.authorUsername || m.author || 'manager',
          text: m.text || m.body || '',
          time: m.time || m.createdAt,
        }))
        // Jednostavno: sve poruke stavi u “customer” thread (dok ne uvedemo niti)
        this.customerMessages = mapped
      } catch (e) {
        console.error('fetchMessages failed:', e)
        this.customerMessages = []
      } finally {
        this.loading.messages = false
      }
    },

    // 3.1) Manager messages (escalation poruke)
    async fetchManagerMessages() {
      this.loading.messages = true
      try {
        const { data } = await axiosInstance.get(`/escalation/by-complaint/${this.complaintId}`)
        
        if (data.escalation && data.messages) {
          // mapiramo escalation poruke na UI format
          this.managerMessages = (data.messages || []).map(m => ({
            sender: m.authorUsername || m.author || 'manager',
            text: m.content || m.text || '',
            time: m.createdAt || m.time,
          }))
          
          // čuvamo escalation ID za slanje poruka
          this.escalationId = data.escalation.id
        } else {
          this.managerMessages = []
          this.escalationId = null
        }
      } catch (e) {
        console.error('fetchManagerMessages failed:', e)
        this.managerMessages = []
        this.escalationId = null
      } finally {
        this.loading.messages = false
      }
    },

    // 4) Slanje poruke
    async send() {
      const text = (this.draft || '').trim()
      if (!text || this.sending) return
      this.sending = true
      try {
        // optimistic UI
        const temp = { sender: this.store.username, text, time: new Date().toISOString(), _optimistic: true }
        this.viewMessages.push(temp)
        this.draft = ''

        if (this.activeTab === 'manager') {
          // Slanje poruke manageru preko escalation sistema
          if (this.escalationId) {
            await axiosInstance.post(`/escalation/${this.escalationId}/messages`, { text })
          } else {
            throw new Error('No escalation found for this ticket')
          }
        } else {
          // Slanje poruke customeru preko complaint sistema
          await axiosInstance.post(`/complaint/${this.complaintId}/messages`, { text })
        }

        // (opciono) refetch za tačan timestamp/ID
        // await this.fetchMessages()
        // await this.fetchManagerMessages()
      } catch (e) {
        console.error('send failed:', e)
        // ukloni optimistic message u slučaju greške
        this.viewMessages.pop()
      } finally {
        this.sending = false
      }
    },

    // 5) Iz dijaloga — osveži prikaz
    async onStatusUpdated(updated) {
      // očekujemo { code, name } ili payload iz backenda
      if (updated?.code) this.ticket.status = updated.code
      if (updated?.name) this.ticket.statusName = updated.name

      // refetch detalja + istorije da sve bude sveže
      await Promise.all([this.fetchTicket(), this.fetchHistory()])
    },

    /* ============== Helpers ============== */
    toYMD(iso) {
      if (!iso) return '—'
      const d = new Date(iso); if (Number.isNaN(d)) return '—'
      const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, '0'); const dd = String(d.getDate()).padStart(2, '0')
      return `${y}-${m}-${dd}`
    },
    formatDate(iso) {
      if (!iso) return '—'
      const d = new Date(iso); if (Number.isNaN(d)) return '—'
      const yyyy = d.getFullYear(), mm = String(d.getMonth() + 1).padStart(2, '0'),
        dd = String(d.getDate()).padStart(2, '0'), hh = String(d.getHours()).padStart(2, '0'),
        mi = String(d.getMinutes()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
    },
    formatTime(iso) {
      const d = new Date(iso)
      return `${d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    },
  },
}
</script>

<style scoped>
/* titles */
/* Attachments */
.attachments {
  position: relative;
  border: 1px solid rgba(0, 0, 0, .2);
  border-radius: 16px;
  padding: 12px 40px;
  min-height: 150px
}

.attachments .nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 2
}

.attachments .nav.left {
  left: 6px
}

.attachments .nav.right {
  right: 6px
}

.track {
  display: flex;
  overflow-x: auto;
  gap: 16px;
  scroll-behavior: smooth;
  padding: 4px
}

.item {
  min-width: 120px;
  max-width: 120px;
  border: 1px solid rgba(0, 0, 0, .2);
  border-radius: 12px;
  padding: 8px;
  text-align: center;
  background: #fff
}

.thumb {
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(0, 0, 0, .3);
  border-radius: 8px
}

.caption {
  font-size: 12px;
  opacity: .8;
  margin-top: 6px
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 6px;
}

/* left column rows */
.label {
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.7)
}

.value {
  white-space: pre-wrap
}

.select-compact :deep(.v-field) {
  height: 34px;
}

/* activity grid (vizuelno nalik tabeli iz skice) */
.grid {
  border: 1px solid rgba(0, 0, 0, .25);
  border-radius: 6px;
  overflow: hidden;
  font-size: 13px;
}

.grid-header,
.grid-row {
  display: grid;
  grid-template-columns: 120px 110px 110px 1fr 110px;
  align-items: center;
}

.grid-header {
  background: rgba(0, 0, 0, .04);
  font-weight: 600;
}

.grid-header>span,
.grid-row>span {
  padding: 6px 8px;
  border-bottom: 1px solid rgba(0, 0, 0, .12);
}

.grid-row:last-child>span {
  border-bottom: none;
}

.ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* chat container */
.chat-wrap {
  border: 1px solid rgba(0, 0, 0, .4);
}

.chat-header {
  border-bottom: 1px solid rgba(0, 0, 0, .25);
  padding: 2px 6px;
}

.chat-body {
  height: 360px;
  overflow: auto;
  padding: 12px;
  background: #fff;
}

.msg-row {
  display: flex;
  align-items: flex-end;
  margin: 12px 0;
  gap: 8px;
}

.msg-row.right {
  justify-content: flex-end;
}

.avatar {
  opacity: .7;
}

.bubble {
  max-width: 78%;
  border-radius: 12px;
  padding: 10px 12px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, .08);
  white-space: pre-line;
}

.bubble.blue {
  background: #1976d2;
  color: #fff;
}

.bubble.gray {
  background: #e9e9eb;
  color: #333;
}

.timestamp {
  font-size: 11px;
  opacity: .8;
  margin-top: 6px;
  text-align: right;
}

/* composer i dugmad */
.composer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid rgba(0, 0, 0, .12);
}

.composer-input :deep(.v-field) {
  height: 32px;
}

.btn-small {
  min-height: 32px;
  height: 32px;
  padding: 0 12px;
}

.bubble-wrap {
  max-width: 78%;
  display: flex;
  flex-direction: column;
}

.msg-row.right .bubble-wrap {
  align-items: flex-end;
}

.msg-row.left .bubble-wrap {
  align-items: flex-start;
}

.sender-label {
  font-size: 11px;
  opacity: .7;
  margin-bottom: 4px;
}

.actions-row {
  display: flex;
  gap: 8px;
  padding: 8px 12px;
}

.footer-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px 12px;
}

.sub-title {
  font-weight: 600;
}

.priority-chip {
  height: 28px;
  font-weight: 600;
  letter-spacing: .3px;
}

.disabled-chip {
  opacity: .6;
}
</style>

<style scoped lang="scss">
.operator-ticket-details-container {
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
.activity-card,
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
  }
}

.case-id-chip {
  background: linear-gradient(135deg, 
    rgba(212, 115, 10, 0.1), 
    rgba(245, 158, 11, 0.1));
  color: var(--warm-orange);
  font-weight: 700;
  font-family: 'Courier New', monospace;
}

.category-chip,
.status-chip {
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(.disabled-chip) {
    
    box-shadow: 0 4px 12px rgba(212, 115, 10, 0.2);
  }
  
  &.v-chip--variant-tonal {
    background: rgba(212, 115, 10, 0.1) !important;
    color: var(--warm-orange) !important;
  }

  &.disabled-chip {
    opacity: 0.6;
    cursor: not-allowed !important;
  }

  .v-icon {
    margin-right: 4px;
  }
}

.priority-chip {
  font-weight: 600;
  border-radius: 8px;
  letter-spacing: 0.5px;

  .v-icon {
    margin-right: 4px;
  }
}

.activity-grid {
  .activity-header {
    display: grid;
    grid-template-columns: 1fr 1fr 2fr 1fr;
    gap: 1rem;
    padding: 1rem;
    background: linear-gradient(135deg, 
      rgba(212, 115, 10, 0.1) 0%, 
      rgba(245, 158, 11, 0.05) 100%);
    border-radius: 8px;
    font-weight: 600;
    color: var(--warm-brown);
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 0.5rem;
  }

  .activity-row {
    display: grid;
    grid-template-columns: 1fr 1fr 2fr 1fr;
    gap: 1rem;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(212, 115, 10, 0.1);
    transition: all 0.3s ease;

    &:hover {
      background: rgba(212, 115, 10, 0.05);
    }

    &:last-child {
      border-bottom: none;
    }

    .status-cell {
      font-weight: 500;
      color: var(--warm-brown);
    }

    .date-cell {
      font-size: 0.875rem;
      color: var(--warm-text);
    }

    .note-cell {
      font-size: 0.875rem;
      color: var(--warm-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .user-cell {
      font-weight: 500;
      color: var(--warm-brown);
    }
  }
}

.no-activity {
  text-align: center;
  padding: 2rem;
  color: var(--warm-text);
  opacity: 0.6;

  .v-icon {
    opacity: 0.3;
  }
}

.attachments-container {
  position: relative;
  min-height: 150px;
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
    min-height: 110px;

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
    min-width: 100px;
    max-width: 100px;
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
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px dashed rgba(212, 115, 10, 0.3);
      border-radius: 8px;
      margin-bottom: 8px;
      background: rgba(212, 115, 10, 0.05);
    }

    .attachment-caption {
      font-size: 0.7rem;
      color: var(--warm-text);
      font-weight: 500;
      line-height: 1.2;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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

.chat-card {
  height: fit-content;

  .chat-header {
    background: linear-gradient(135deg, 
      rgba(212, 115, 10, 0.1) 0%, 
      rgba(245, 158, 11, 0.05) 100%);
    border-radius: 16px 16px 0 0;
    border-bottom: 1px solid rgba(212, 115, 10, 0.1);

    .chat-tab {
      color: var(--warm-brown);
      font-weight: 500;

      .v-icon {
        color: var(--warm-orange);
      }
    }
  }

  .chat-body {
    height: 400px;
    overflow-y: auto;
    padding: 1rem;
    background: linear-gradient(135deg, 
      rgba(255, 255, 255, 0.95) 0%, 
      rgba(255, 251, 235, 0.95) 100%);

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

    .message-row {
      display: flex;
      align-items: flex-end;
      margin: 1rem 0;
      gap: 0.5rem;

      &.customer-message {
        justify-content: flex-end;
      }

      &.operator-message {
        justify-content: flex-start;
      }
    }

    .message-avatar {
      flex-shrink: 0;

      &.customer-avatar {
        background: linear-gradient(135deg, #D4730A, #F59E0B);
        color: white;
      }

      &.operator-avatar {
        background: rgba(212, 115, 10, 0.1);
        color: var(--warm-orange);
      }
    }

    .message-content {
      max-width: 70%;
      display: flex;
      flex-direction: column;

      .sender-label {
        font-size: 0.75rem;
        color: var(--warm-text);
        opacity: 0.8;
        margin-bottom: 4px;
        font-weight: 500;
      }

      .message-bubble {
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
          line-height: 1.4;
          font-size: 0.95rem;
          margin-bottom: 4px;
        }

        .message-timestamp {
          font-size: 0.7rem;
          opacity: 0.8;
          text-align: right;
        }
      }
    }

    .customer-message .message-content {
      align-items: flex-end;

      .sender-label {
        text-align: right;
      }
    }

    .operator-message .message-content {
      align-items: flex-start;

      .sender-label {
        text-align: left;
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

  .chat-composer {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    border-top: 1px solid rgba(212, 115, 10, 0.1);
    background: rgba(255, 255, 255, 0.9);

    .composer-input {
      flex: 1;

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

    .send-btn {
      background: linear-gradient(135deg, #D4730A, #F59E0B);
      color: white;
      border-radius: 12px;
      min-width: 60px;
      height: 48px;
      transition: all 0.3s ease;

      &:hover {
        
        box-shadow: 0 6px 20px rgba(212, 115, 10, 0.3);
      }

      &:disabled {
        background: rgba(212, 115, 10, 0.3);
        transform: none;
        box-shadow: none;
      }
    }
  }

  .chat-actions {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.95);

    .action-btn {
      border: 2px solid rgba(212, 115, 10, 0.3);
      color: var(--warm-orange);
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(212, 115, 10, 0.1);
        border-color: var(--warm-orange);
        
      }

      .v-icon {
        margin-right: 4px;
      }
    }
  }

  .chat-footer {
    display: flex;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 0 0 16px 16px;

    .footer-btn {
      border: 2px solid rgba(212, 115, 10, 0.3);
      color: var(--warm-orange);
      border-radius: 8px;
      font-weight: 500;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(212, 115, 10, 0.1);
        border-color: var(--warm-orange);
        
      }

      .v-icon {
        margin-right: 4px;
      }
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
  .operator-ticket-details-container {
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

  .activity-grid {
    .activity-header,
    .activity-row {
      grid-template-columns: 1fr;
      gap: 0.5rem;
      padding: 0.5rem;
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

  .chat-card {
    .chat-body {
      height: 300px;

      .message-content {
        max-width: 85%;
      }
    }

    .chat-actions,
    .chat-footer {
      flex-direction: column;

      .action-btn,
      .footer-btn {
        width: 100%;
      }
    }
  }
}
</style>
