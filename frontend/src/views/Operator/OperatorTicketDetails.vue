<template>
  <v-container class="py-6">
    <v-row>
      <v-col cols="12" md="6">
        <div class="section-title">Ticket Details:</div>

        <v-skeleton-loader v-if="loading.details" type="article, actions" class="mt-2 mb-4" />

        <template v-else>
          <v-row dense class="mt-2">
            <v-col cols="5" class="label">Case ID:</v-col>
            <v-col cols="7" class="value">{{ ticket.caseId }}</v-col>

            <v-col cols="5" class="label">Reservation:</v-col>
            <v-col cols="7" class="value">{{ ticket.reservation ?? '—' }}</v-col>

            <v-col cols="5" class="label">Passenger:</v-col>
            <v-col cols="7" class="value">{{ ticket.passenger ?? '—' }}</v-col>

            <v-col cols="5" class="label">Category:</v-col>
            <v-col cols="7" class="value">{{ ticket.category ?? '—' }}</v-col>

            <v-col cols="5" class="label">Status:</v-col>
            <v-col cols="7" class="value">
              <v-chip variant="tonal" color="primary" class="cursor-pointer" :class="{ 'disabled-chip': isEscalated }"
                :title="isEscalated ? 'Ticket je eskaliran – status menja viši nivo' : 'Promeni status'"
                @click="onStatusChipClick">
                {{ ticket.statusName || ticket.status || '—' }}
              </v-chip>
            </v-col>

            <!-- Dijalog za promenu statusa -->
            <ComplaintStatusDialog :key="ticket.caseId" v-model="statusDialog" :complaint-id="ticket.caseId"
              :status-id="ticket.statusId" :current-status-code="ticket.status"
              :current-status-name="ticket.statusName || ticket.status" @updated="onStatusUpdated" />


            <v-col cols="5" class="label">Date Created:</v-col>
            <v-col cols="7" class="value">{{ formatDate(ticket.createdAt) }}</v-col>

            <v-col cols="5" class="label">Priority:</v-col>
            <v-col cols="7" class="value">
              <v-chip class="priority-chip" :color="priorityColor(ticket.priority)" variant="flat">
                {{ (ticket.priority || '—').toUpperCase() }}
              </v-chip>
            </v-col>
          </v-row>

          <div class="sub-title mt-4">Activity Status</div>

          <v-skeleton-loader v-if="loading.history" type="table" class="mt-2 mb-3" />
          <template v-else>
            <div class="grid" v-if="activityRows.length">
              <div class="grid-header">
                <span>Status</span><span>Valid From</span><span>Note</span><span>Changed By</span>
              </div>
              <div v-for="(r, i) in activityRows" :key="i" class="grid-row">
                <span>{{ r.statusName }}</span>
                <span>{{ r.validFrom }}</span>
                <span class="ellipsis">{{ r.note || '' }}</span>
                <span>{{ r.changedBy || '' }}</span>
              </div>
            </div>
            <div v-else class="text-medium-emphasis mt-2">No history.</div>
          </template>

          <div class="text-subtitle-1 mb-2">Attachments:</div>
          <div class="attachments">
            <v-btn size="small" variant="tonal" class="nav left" @click="scroll(-1)">
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>

            <div ref="track" class="track">
              <v-skeleton-loader v-if="loading.attachments" type="image, image, image" class="w-100"
                style="min-width: 360px" />
              <template v-else>
                <a v-for="(a, i) in attachments" :key="i" class="item" :href="a.url || '#'" target="_blank"
                  rel="noopener" :title="`Open ${a.name || a.label || ''}`"
                  :style="{ cursor: a.url ? 'pointer' : 'not-allowed', opacity: a.url ? 1 : 0.6 }">
                  <div class="thumb">
                    <v-icon v-if="a.type === 'image'">mdi-image</v-icon>
                    <v-icon v-else-if="a.type === 'pdf'">mdi-file-pdf-box</v-icon>
                    <v-icon v-else>mdi-file</v-icon>
                  </div>
                  <div class="caption">{{ a.label || a.name }}</div>
                </a>

                <div v-if="attachments.length === 0" class="text-medium-emphasis">No attachments.</div>
              </template>
            </div>

            <v-btn size="small" variant="tonal" class="nav right" @click="scroll(1)">
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
          </div>
        </template>
      </v-col>

      <!-- RIGHT: Chat -->
      <v-col cols="12" md="6">
        <div class="chat-wrap">
          <div class="chat-header">
            <v-tabs v-model="activeTab" density="compact" class="w-100">
              <v-tab value="customer">{{ ticket.passenger || 'Customer' }}</v-tab>
              <v-tab value="manager">Manager</v-tab>
            </v-tabs>
          </div>

          <div class="chat-body">
            <v-skeleton-loader v-if="loading.messages" type="paragraph, paragraph" />
            <template v-else>
              <div v-for="(m, idx) in viewMessages" :key="idx" class="msg-row"
                :class="m.sender === 'user' ? 'right' : 'left'">
                <template v-if="m.sender !== 'customer'">
                  <v-icon size="20" class="avatar">mdi-account</v-icon>
                </template>

                <!-- WRAP: label + bubble -->
                <div class="bubble-wrap">
                  <div class="sender-label">{{ m.sender }}</div>
                  <div class="bubble" :class="m.sender === 'customer' ? 'blue' : 'gray'">
                    <div class="bubble-text">{{ m.text }}</div>
                    <div class="timestamp">{{ formatTime(m.time) }}</div>
                  </div>
                </div>

                <template v-if="m.sender === 'customer'">
                  <v-icon size="20" class="avatar">mdi-account</v-icon>
                </template>
              </div>

              <div v-if="viewMessages.length === 0" class="text-medium-emphasis">
                No messages yet.
              </div>
            </template>
          </div>

          <div class="composer">
            <v-text-field v-model="draft" density="compact" variant="outlined" hide-details
              placeholder="Enter a message" class="composer-input" :disabled="sending" @keydown.enter.prevent="send" />
            <v-btn class="btn-small" :loading="sending" :disabled="!draft?.trim()" @click="send">
              Send
            </v-btn>
          </div>

          <div class="actions-row">
            <v-btn variant="outlined" class="btn-small" @click="onEscalateClick">
              Escalate
            </v-btn> <v-btn variant="outlined" class="btn-small" @click="compDialog = true">
              Propose Compensation
            </v-btn>
          </div>

          <div class="footer-row">
            <v-btn variant="outlined" class="btn-small">Close Ticket</v-btn>
            <v-btn variant="outlined" class="btn-small" @click="$router.back()">Go Back</v-btn>
          </div>
        </div>
      </v-col>
      <EscalateCaseDialog v-model="escalateDialog" :ticket="{
        id: ticket.caseId,
        subject: ticket.category || '—',
        assigneeUsername: store?.username || '—',
        statusName: ticket.statusName || ticket.status,
        priority: ticket.priority
      }" :submitting="escalating" @submit="handleEscalate" @cancel="() => (escalateDialog = false)" />
      <ProposeCompensationDialog v-model="compDialog" :ticket="{
        id: ticket.caseId,
        subject: ticket.category || '—',
        passenger: ticket.passenger || '—'
      }" default-currency="USD" default-type="VOUCHER" @submit="handleCompSubmit" @pdf="handleCompPdf" />

    </v-row>
  </v-container>
  <v-snackbar v-model="snackbar.show" :timeout="snackbar.timeout" :color="snackbar.color" location="bottom right"
    rounded="lg">
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

        // Ako ti je endpoint /complaint/mycomplaints/:id/messages — zameni ovde:
        await axiosInstance.post(`/complaint/${this.complaintId}/messages`, { text })

        // (opciono) refetch za tačan timestamp/ID
        // await this.fetchMessages()
      } catch (e) {
        console.error('send failed:', e)
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
  cursor: not-allowed !important;
}
</style>
