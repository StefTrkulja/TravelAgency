<!-- src/views/ManagerTicketDetails.vue -->
<template>
  <v-container class="page-container">
    <!-- Warm-themed Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-navigation">
          <v-btn
            variant="outlined"
            size="small"
            class="back-btn"
            @click="goBack"
            prepend-icon="mdi-arrow-left"
          >
            Back to Tickets
          </v-btn>
        </div>
        <div class="header-main">
          <div class="header-icon">
            <v-icon size="32" color="white">mdi-ticket-confirmation</v-icon>
          </div>
          <div class="header-text">
            <h1 class="page-title">Ticket Details</h1>
            <p class="page-subtitle">Case #{{ ticket.id || 'Loading...' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Enhanced Tab Navigation -->
    <v-card class="tabs-card">
      <v-tabs
        v-model="activeTab"
        class="warm-tabs"
        color="primary"
        slider-color="primary"
      >
        <v-tab value="overview" prepend-icon="mdi-eye">
          Overview
        </v-tab>
        <v-tab value="sla" prepend-icon="mdi-clock-check">
          Status & SLA
        </v-tab>
        <v-tab value="eco" prepend-icon="mdi-account-cash">
          Escalations & Compensations
        </v-tab>
      </v-tabs>
    </v-card>

    <!-- Tab Content -->
    <v-card class="content-card">
      <v-window v-model="activeTab">
        <!-- ================= OVERVIEW ================= -->
        <v-window-item value="overview">
          <div class="overview-content">
            <v-row>
              <!-- Left Side - Ticket Details -->
              <v-col cols="12" md="6">
                <div class="details-section">
                  <h3 class="section-title">
                    <v-icon class="mr-2">mdi-information</v-icon>
                    Ticket Information
                  </h3>
                  <div class="details-grid">
                    <div class="detail-item">
                      <span class="label">Subject:</span>
                      <span class="value">{{ ticket.subject || 'No subject' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">Case ID:</span>
                      <span class="value case-id">#{{ ticket.id }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">Reservation:</span>
                      <span class="value">{{ (ticket.reservation?.code ?? ticket.reservationCode) || '—' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">Passenger:</span>
                      <span class="value">{{ fullName || '—' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">Category:</span>
                      <v-chip size="small" :color="getCategoryColor(ticket.category)" variant="tonal">
                        <v-icon size="14" class="mr-1">{{ getCategoryIcon(ticket.category) }}</v-icon>
                        {{ ticket.category || 'Other' }}
                      </v-chip>
                    </div>
                    <div class="detail-item">
                      <span class="label">Status:</span>
                      <v-chip size="small" :color="getStatusColor(ticket.status)" variant="tonal">
                        <v-icon size="14" class="mr-1">{{ getStatusIcon(ticket.status) }}</v-icon>
                        {{ ticket.status?.name || ticket.status?.code || ticket.status || 'Unknown' }}
                      </v-chip>
                    </div>
                    <div class="detail-item">
                      <span class="label">Priority:</span>
                      <v-chip size="small" :color="getPriorityColor(ticket.priority)" variant="flat">
                        <v-icon size="14" class="mr-1">{{ getPriorityIcon(ticket.priority) }}</v-icon>
                        {{ ticket.priority || 'Low' }}
                      </v-chip>
                    </div>
                    <div class="detail-item">
                      <span class="label">Date Created:</span>
                      <span class="value">{{ fmtDate(ticket.createdAt) }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">Assigned To:</span>
                      <span class="value">{{ ticket.assigneeUsername || 'Unassigned' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">Last Activity:</span>
                      <span class="value">{{ fmtDate(ticket.lastActivityAt) }}</span>
                    </div>
                  </div>
                </div>
              </v-col>

              <!-- Right Side - Attachments -->
              <v-col cols="12" md="6">
                <div class="attachments-section">
                  <h3 class="section-title">
                    <v-icon class="mr-2">mdi-paperclip</v-icon>
                    Attachments
                  </h3>
                  <div class="attachments-grid">
                    <div
                      v-for="(a, i) in attachments"
                      :key="a.id || i"
                      class="attachment-item"
                      @click="a.url && openFile(a.url)"
                      :style="{ cursor: a.url ? 'pointer' : 'not-allowed' }"
                    >
                      <div class="attachment-icon">
                        <v-icon v-if="a.type==='image'" size="32">mdi-image</v-icon>
                        <v-icon v-else-if="a.type==='pdf'" size="32">mdi-file-pdf-box</v-icon>
                        <v-icon v-else size="32">mdi-file</v-icon>
                      </div>
                      <div class="attachment-name">{{ a.label || a.name || 'Untitled' }}</div>
                    </div>

                    <div v-if="!attachments?.length" class="no-attachments">
                      <v-icon size="48" color="grey">mdi-folder-open-outline</v-icon>
                      <p class="mt-2">No attachments</p>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-window-item>

        <!-- ================= STATUS & SLA ================= -->
        <v-window-item value="sla">
          <div class="sla-content">
            <v-row>
              <!-- Left Side - Status History -->
              <v-col cols="12" md="6">
                <div class="history-section">
                  <h3 class="section-title">
                    <v-icon class="mr-2">mdi-history</v-icon>
                    Status History
                  </h3>
                  <v-table class="history-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Changed By</th>
                        <th>Note</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(h, i) in history" :key="i">
                        <td>
                          <v-chip size="small" :color="getStatusColor(h.toStatusName)" variant="tonal">
                            {{ h.toStatusName }}
                          </v-chip>
                        </td>
                        <td>{{ fmtDayTime(h.changedAt) }}</td>
                        <td>{{ h.changedByUsername || '—' }}</td>
                        <td>{{ h.note || '—' }}</td>
                      </tr>
                      <tr v-if="!history.length">
                        <td colspan="4" class="text-center text-grey">No history available</td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>

                <!-- SLA Metrics -->
                <div class="sla-metrics-section mt-6">
                  <h3 class="section-title">
                    <v-icon class="mr-2">mdi-clock-check</v-icon>
                    SLA Metrics
                  </h3>
                  <div class="metrics-grid">
                    <div class="metric-card">
                      <div class="metric-label">First Response Due</div>
                      <div class="metric-value">{{ fmtDayTime(sla.firstResponseAt) }}</div>
                    </div>
                    <div class="metric-card">
                      <div class="metric-label">Time to First Response</div>
                      <div class="metric-value">{{ sla.tfr || '—' }}</div>
                    </div>
                    <div class="metric-card">
                      <div class="metric-label">Resolution Due</div>
                      <div class="metric-value">{{ fmtDayTime(sla.resolutionDue) }}</div>
                    </div>
                    <div class="metric-card">
                      <div class="metric-label">Time to Resolution</div>
                      <div class="metric-value">{{ sla.ttr || '—' }}</div>
                    </div>
                    <div class="metric-card">
                      <div class="metric-label">Number of Breaches</div>
                      <div class="metric-value">{{ sla.breaches || 0 }}</div>
                    </div>
                    <div class="metric-card compliance">
                      <div class="metric-label">SLA Compliance</div>
                      <div class="compliance-value">
                        <span class="percentage">{{ sla.compliance || 0 }}%</span>
                        <v-icon :color="sla.compliance >= 90 ? 'success' : 'error'">
                          {{ sla.compliance >= 90 ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                        </v-icon>
                      </div>
                    </div>
                  </div>
                </div>
              </v-col>

              <!-- Right Side - Timeline -->
              <v-col cols="12" md="6">
                <div class="timeline-section">
                  <h3 class="section-title">
                    <v-icon class="mr-2">mdi-timeline</v-icon>
                    Status Timeline
                  </h3>
                  <div class="timeline-container">
                    <div 
                      v-for="(t, i) in timeline" 
                      :key="i" 
                      class="timeline-item"
                      :class="{ 'is-last': i === timeline.length - 1 }"
                    >
                      <div class="timeline-dot">
                        <v-icon size="16" color="white">{{ getStatusIcon(t.toStatusName) }}</v-icon>
                      </div>
                      <div class="timeline-content">
                        <div class="timeline-status">{{ t.toStatusName }}</div>
                        <div class="timeline-date">{{ fmtDay(t.changedAt) }}</div>
                        <div v-if="t.note" class="timeline-note">{{ t.note }}</div>
                      </div>
                    </div>
                    <div v-if="!timeline.length" class="no-timeline">
                      <v-icon size="48" color="grey">mdi-timeline-outline</v-icon>
                      <p class="mt-2">No timeline data</p>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-window-item>

        <!-- ================= ESCALATIONS & COMPENSATIONS ================= -->
        <v-window-item value="eco">
          <div class="eco-content">
            <!-- Action Buttons -->
            <div class="action-toolbar">
              <v-btn
                variant="outlined"
                prepend-icon="mdi-arrow-up-bold-box"
                :loading="acceptingEsc"
                :disabled="!canAcceptEscalation"
                @click="acceptEscalation"
                class="action-btn"
              >
                Accept Escalation
              </v-btn>
              <v-btn
                color="primary"
                prepend-icon="mdi-cash-plus"
                @click="openCreateCompDialog"
                class="action-btn primary-btn"
              >
                Create Compensation
              </v-btn>
              <v-btn
                color="error"
                prepend-icon="mdi-check-circle"
                :loading="closingTicket"
                :disabled="!canCloseTicket"
                @click="closeTicket"
                class="action-btn"
              >
                Close Ticket
              </v-btn>
            </div>

            <v-row>
              <!-- Escalation Details -->
              <v-col cols="12" md="6">
                <div class="escalation-section">
                  <h3 class="section-title">
                    <v-icon class="mr-2">mdi-alert-octagon</v-icon>
                    Escalation Details
                  </h3>
                  <div class="details-grid">
                    <div class="detail-item">
                      <span class="label">Reason:</span>
                      <v-chip size="small" :color="getEscalationReasonColor(escalation.reason)" variant="tonal">
                        {{ escalation.reason || 'Not specified' }}
                      </v-chip>
                    </div>
                    <div class="detail-item">
                      <span class="label">Date Escalated:</span>
                      <span class="value">{{ fmtDay(escalation.escalatedAt) }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">Escalated By:</span>
                      <span class="value">{{ escalation.complaint?.createdByUsername || '—' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">Assigned Manager:</span>
                      <span class="value">{{ escalation.managerUsername || '—' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">Status:</span>
                      <v-chip size="small" :color="getStatusColor(escalation.status)" variant="tonal">
                        {{ escalation.status || 'Unknown' }}
                      </v-chip>
                    </div>
                  </div>
                </div>
              </v-col>

              <!-- Compensation Proposals -->
              <v-col cols="12" md="6">
                <div class="compensation-section">
                  <h3 class="section-title">
                    <v-icon class="mr-2">mdi-cash-multiple</v-icon>
                    Compensation Proposals
                  </h3>
                  <v-table class="compensation-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Value</th>
                        <th>Date</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(c, i) in compensations" :key="i">
                        <td>
                          <v-chip size="small" :color="getCompensationType(c.type)" variant="tonal">
                            {{ c.type || 'Unknown' }}
                          </v-chip>
                        </td>
                        <td class="font-weight-bold">{{ c.value || '—' }}</td>
                        <td>{{ fmtDay(c.date) }}</td>
                        <td>
                          <div class="compensation-actions">
                            <v-btn 
                              size="small" 
                              color="success" 
                              variant="outlined"
                              @click="approveComp(c)"
                              class="mr-1"
                            >
                              Approve
                            </v-btn>
                            <v-btn 
                              size="small" 
                              color="error" 
                              variant="outlined"
                              @click="rejectComp(c)"
                            >
                              Reject
                            </v-btn>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="!compensations.length">
                        <td colspan="4" class="text-center text-grey">No compensation proposals</td>
                      </tr>
                    </tbody>
                  </v-table>
                </div>
              </v-col>
            </v-row>

            <!-- Internal Discussion -->
            <div class="discussion-section mt-6">
              <h3 class="section-title">
                <v-icon class="mr-2">mdi-chat</v-icon>
                Internal Discussion
              </h3>
              <v-card class="chat-container">
                <div class="chat-messages" ref="chatBody" @scroll="onChatScroll">
                  <div
                    v-for="(m, i) in internalMessages"
                    :key="i"
                    class="message"
                    :class="{ 'own-message': m.me }"
                  >
                    <div class="message-bubble">
                      <div class="message-content">{{ m.content }}</div>
                      <div class="message-time">{{ fmtDate(m.time || m.createdAt) }}</div>
                    </div>
                  </div>
                  <div v-if="!internalMessages.length" class="no-messages">
                    <v-icon size="48" color="grey">mdi-chat-outline</v-icon>
                    <p class="mt-2">No internal messages yet</p>
                  </div>
                </div>

                <div class="chat-input">
                  <v-text-field
                    v-model="draft"
                    density="compact"
                    variant="outlined"
                    hide-details
                    placeholder="Type your message..."
                    @keydown.enter.prevent="sendInternal"
                    class="flex-1"
                  />
                  <v-btn 
                    color="primary" 
                    :loading="sending" 
                    @click="sendInternal"
                    class="ml-2"
                  >
                    Send
                  </v-btn>
                </div>
              </v-card>

              <v-btn
                v-show="showChatScrollBtn"
                class="scroll-bottom-btn"
                variant="elevated"
                size="small"
                @click="scrollChatToBottom"
              >
                Jump to latest
                <v-icon end>mdi-arrow-down</v-icon>
              </v-btn>
            </div>
          </div>
        </v-window-item>
      </v-window>
    </v-card>

    <!-- Create Compensation Dialog -->
    <ProposeCompensationDialog
      v-model="createCompDialog"
      :ticket="{
        id: ticket.id,
        subject: ticket.subject || ticket.category || '—',
        passenger: fullName || '—'
      }"
      default-currency="EUR"
      default-type="VOUCHER"
      @submit="handleCreateComp"
    />
  </v-container>
</template>

<script>
import axiosInstance from '@/utils/axiosInstance'
import { defineComponent, h } from 'vue'
import ProposeCompensationDialog from '@/components/ProposeCompensationDialog.vue'

export default {
  name: 'TicketDetails',
  components: {
    ProposeCompensationDialog,
    Kv: defineComponent({
      name: 'Kv',
      props: { label: String, value: [String, Number, Boolean] },
      setup(props) {
        return () =>
          h('div', { class: 'kv-row' }, [
            h('div', { class: 'kv-label' }, `${props.label}:`),
            h('div', { class: 'kv-value' }, props.value ?? '—'),
          ])
      },
    }),
  },
  data() {
    return {
      activeTab: 'overview',
      ticket: {},
      attachments: [],          // [{ id,name,label,url,type }]
      history: [],
      sla: {},
      timeline: [],
      escalation: {},
      internalMessages: [],
      draft: '',
      sending: false,
      compensations: [],
      showChatScrollBtn: false,
      fullName: null,
      escalationId: null,
      // actions state
      acceptingEsc: false,
      closingTicket: false,
      createCompDialog: false,
    }
  },
  async created() {
    const ticketId = this.$route.params.id
    await Promise.all([
      this.fetchTicket(ticketId),
      this.fetchHistory(ticketId),
      this.fetchSla(ticketId),
      this.fetchTimeline(ticketId),
      this.fetchEscalation(ticketId),
      this.fetchCompensations(ticketId),
    ])
    this.$nextTick(() => this.scrollChatToBottom())
  },
  computed: {
    canAcceptEscalation() {
      const st = (this.escalation?.status && (this.escalation.status.code || this.escalation.status.name)) || ''
      const normalized = String(st).toUpperCase()
      return !!this.escalation && normalized !== 'ACCEPTED' && normalized !== 'CLOSED'
    },
    canCloseTicket() {
      const st = (this.ticket?.status && (this.ticket.status.code || this.ticket.status.name)) || this.ticket?.status
      const normalized = String(st || '').toUpperCase()
      return normalized !== 'CLOSED' && normalized !== 'RESOLVED'
    },
  },
  methods: {
    // ========= Navigation =========
    goBack() {
      // Try to go back in history first, otherwise navigate to manager tickets
      if (window.history.length > 1) {
        this.$router.back()
      } else {
        this.$router.push({ name: 'ManagerTicketsView' })
      }
    },

    // ========= helpers =========
    toAbsoluteUrl(storageKey = '') {
      if (!storageKey) return null
      if (/^https?:\/\//i.test(storageKey)) return storageKey
      const clean = String(storageKey).replace(/^\/+/, '')
      const base = axiosInstance?.defaults?.baseURL || ''
      let originOnly
      try {
        originOnly = new URL(base, window.location.origin).origin
      } catch {
        originOnly = window.location.origin
      }
      return `${originOnly}/${clean}`
    },
    fileTypeFrom(nameOrMime = '') {
      const s = String(nameOrMime).toLowerCase()
      if (s.endsWith('.png') || s.endsWith('.jpg') || s.endsWith('.jpeg') || s.endsWith('.gif') || s.startsWith('image/')) return 'image'
      if (s.endsWith('.pdf') || s.startsWith('application/pdf')) return 'pdf'
      return 'file'
    },

    // ========= Style Helpers for Warm Theme =========
    getCategoryColor(category) {
      switch (String(category || '').toLowerCase()) {
        case 'accommodation': return 'purple'
        case 'transport': return 'blue'
        case 'finance': return 'green'
        case 'support': return 'orange'
        default: return 'grey'
      }
    },

    getCategoryIcon(category) {
      switch (String(category || '').toLowerCase()) {
        case 'accommodation': return 'mdi-bed'
        case 'transport': return 'mdi-bus'
        case 'finance': return 'mdi-currency-usd'
        case 'support': return 'mdi-help-circle'
        default: return 'mdi-tag'
      }
    },

    getStatusColor(status) {
      const statusStr = String(status?.name || status?.code || status || '').toLowerCase()
      switch (statusStr) {
        case 'open':
        case 'new': return 'info'
        case 'in progress':
        case 'in_progress': return 'warning'
        case 'resolved':
        case 'closed': return 'success'
        case 'escalated': return 'error'
        default: return 'grey'
      }
    },

    getStatusIcon(status) {
      const statusStr = String(status?.name || status?.code || status || '').toLowerCase()
      switch (statusStr) {
        case 'open':
        case 'new': return 'mdi-circle-outline'
        case 'in progress':
        case 'in_progress': return 'mdi-progress-clock'
        case 'resolved':
        case 'closed': return 'mdi-check-circle'
        case 'escalated': return 'mdi-alert-circle'
        default: return 'mdi-help-circle'
      }
    },

    getPriorityColor(priority) {
      switch (String(priority || '').toLowerCase()) {
        case 'critical': return 'error'
        case 'high': return 'deep-orange'
        case 'medium': return 'warning'
        case 'low': return 'success'
        default: return 'grey'
      }
    },

    getPriorityIcon(priority) {
      switch (String(priority || '').toLowerCase()) {
        case 'critical': return 'mdi-fire'
        case 'high': return 'mdi-arrow-up-bold'
        case 'medium': return 'mdi-minus'
        case 'low': return 'mdi-arrow-down-bold'
        default: return 'mdi-flag-outline'
      }
    },

    getEscalationReasonColor(reason) {
      switch (String(reason || '').toLowerCase()) {
        case 'sla violation': 
        case 'sla_violation': return 'error'
        case 'customer complaint':
        case 'customer_complaint': return 'warning'
        case 'complexity':
        case 'technical issue':
        case 'technical_issue': return 'info'
        default: return 'primary'
      }
    },

    getCompensationType(type) {
      switch (String(type || '').toLowerCase()) {
        case 'refund': return 'success'
        case 'voucher': return 'primary'
        case 'discount': return 'warning'
        default: return 'grey'
      }
    },

    // ========= API =========
    async fetchTicket(id) {
      const { data: d } = await axiosInstance.get(`/complaint/manager/${id}`)
      this.ticket = d
      this.fullName = d?.user ? [d.user.name, d.user.surname].filter(Boolean).join(' ') : null

      // Attachments
      const atts = Array.isArray(d.attachments) ? d.attachments : []
      this.attachments = atts.map(x => {
        const name = x.originalFilename || x.name || (x.storageKey ? String(x.storageKey).split('/').pop() : 'file')
        const url = x.storageKey ? this.toAbsoluteUrl(x.storageKey) : null
        const type = this.fileTypeFrom(name)
        return {
          id: x.id,
          name,
          label: name.length > 22 ? name.slice(0, 20) + '…' : name,
          url,
          type,
        }
      })

      // bootstrap poruke iz detalja (ako postoje)
      if (Array.isArray(d.messages) && !this.internalMessages.length) {
        this.internalMessages = d.messages.map(m => ({
          ...m,
          me: m.authorUsername && (m.authorUsername !== d.user?.username),
          time: m.createdAt,
          text: m.text,
        }))
      }
    },
    async fetchHistory(id) {
      try {
        const { data } = await axiosInstance.get(`/complaint/${id}/history`)
        this.history = data
      } catch { this.history = [] }
    },
    async fetchSla(id) {
      try {
        const { data } = await axiosInstance.get(`/sla/tracking/${id}`)
        const raw = data
        this.sla = {
          firstResponseAt: raw.firstResponseAt,
          firstResponseDue: raw.responseDueAt,
          tfr: raw.firstResponseAt ? this.diffHuman(raw.firstResponseAt, raw.responseDueAt) : '—',
          resolutionDue: raw.resolutionDueAt,
          ttr: raw.resolvedAt ? this.diffHuman(raw.resolutionStartedAt, raw.resolvedAt) : '—',
          breaches: raw.breachesCount ?? 0,
          paused: this.msToHuman(raw.totalPausedMs),
          compliance: this.calcCompliance(raw),
        }
      } catch { this.sla = {} }
    },
    async fetchTimeline(id) {
      try {
        const { data } = await axiosInstance.get(`/complaint/${id}/timeline`)
        this.timeline = data
      } catch { this.timeline = [] }
    },
    async fetchEscalation(id) {
      try {
        const { data } = await axiosInstance.get(`/escalation/${id}`)
        this.escalation = data
        this.escalationId = data?.id || null
        if( this.escalationId ) {
          await this.fetchInternalMessages(this.escalationId)
        } else {
          this.internalMessages = []
        }
        console.log("Escalation data", this.escalation.status )
      } catch { this.escalation = {} }
    },
    async fetchInternalMessages(escalationId) {
      try {
        const { data } = await axiosInstance.get(`/escalation/${escalationId}/messages`)
        this.internalMessages = data.map(m => ({
          ...m,
          me: m.author === 'Manager' || m.authorUsername === this.ticket.assigneeUsername,
        }))
      } catch { this.internalMessages = [] }
    },
    async fetchCompensations(id) {
      try {
        const resp = await axiosInstance.get(`/compensation/${id}`)
        
        const payload = resp?.data
        console.log("Compensations data", payload)
        const list = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : (payload ? [payload] : [])
        this.compensations = list
          .filter(Boolean)
          .map(x => ({
            id: x.id ?? x.compensationId ?? undefined,
            type: x.type ?? x.kind ?? x.compensationType ?? '—',
            value: x.amount != null ? `${x.amount}${x.currency ? ' ' + x.currency : ''}` : (x.value ?? '—'),
            by: x.managerUsername ?? x.createdByUsername ?? x.proposedByUsername ?? '—',
            date: x.createdAt ?? x.date ?? x.proposedAt ?? null,
            status: x.status ?? '—',
          }))
          // ako želiš da vidiš sve (ne samo PROPOSED), zakomentariši naredni filter
          .filter(c => (c.status || '').toUpperCase() === 'PROPOSED')
      } catch { this.compensations = [] }
    },

    // ========= Actions =========
    openCreateCompDialog() { this.createCompDialog = true },

    async handleCreateComp(payload) {
      // payload iz ProposeCompensationDialog: { caseId, type, value, currency, validUntil, note }
      // Pošto menadžer kreira direktno, mapiramo value->amount i šaljemo source='MANAGER'
      try {
        const ticketId = payload.caseId || this.$route.params.id
        await axiosInstance.post(`/compensation/${ticketId}/propose`, {
          type: payload.type,             // REFUND | VOUCHER | DISCOUNT
          value: payload.value,          // broj
          currency: payload.currency,     // 'EUR' | 'USD' | 'RSD' | '%'
          validUntil: payload.validUntil || null,
          note: payload.note || '',
          source: 'MANAGER'
        })
        await this.fetchCompensations(ticketId)
      } catch (e) {
        console.error('Create compensation failed:', e)
      }
    },

    async acceptEscalation() {
      if (this.acceptingEsc) return
      this.acceptingEsc = true
      try {
        const ticketId = this.$route.params.id
        await axiosInstance.post(`/escalation/${ticketId}/accept`)
        await this.fetchEscalation(ticketId)
      } catch (e) {
        console.error('Failed to accept escalation', e)
      } finally {
        this.acceptingEsc = false
      }
    },

    async closeTicket() {
      if (this.closingTicket) return
      this.closingTicket = true
      try {
        const ticketId = this.$route.params.id
        // ili generička tranzicija: /complaint/:id/transition { toStatusCode: 'CLOSED' }
        await axiosInstance.post(`/complaint/${ticketId}/close`)
        await Promise.all([
          this.fetchTicket(ticketId),
          this.fetchHistory(ticketId),
          this.fetchTimeline(ticketId),
          this.fetchSla(ticketId),
        ])
      } catch (e) {
        console.error('Failed to close ticket', e)
      } finally {
        this.closingTicket = false
      }
    },

    async sendInternal() {
      const txt = (this.draft || '').trim()
      if (!txt || this.sending) return
      this.sending = true
      try {
        const ticketId = this.$route.params.id
        const { data } = await axiosInstance.post(`/escalation/${this.escalationId}/messages`, { text: txt })
        this.internalMessages.push({ ...data, me: true })
        this.draft = ''
        this.$nextTick(() => this.scrollChatToBottom())
      } finally {
        this.sending = false
      }
    },
    async approveComp(c) {
      const ticketId = this.$route.params.id
      console.log("Approve compensation", c)
      await axiosInstance.post(`/compensation/${c.id}/approve`)
      this.fetchCompensations(ticketId)
    },
    async rejectComp(c) {
      const ticketId = this.$route.params.id
      await axiosInstance.post(`/compensation/${c.id}/reject`)
      this.fetchCompensations(ticketId)
    },

    // ========= UI helpers =========
    openFile(url) { if (url) window.open(url, '_blank', 'noopener') },
    scrollAttachments(dir) {
      const el = this.$refs.attTrack
      if (!el) return
      const step = el.clientWidth * 0.8
      el.scrollBy({ left: dir * step, behavior: 'smooth' })
    },
    onChatScroll(e) {
      const el = e?.target || this.$refs.chatBody
      if (!el) return
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
      this.showChatScrollBtn = !nearBottom
    },
    scrollChatToBottom() {
      const el = this.$refs.chatBody
      if (!el) return
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      this.showChatScrollBtn = false
    },

    // ========= formatting =========
    diffHuman(start, end) {
      if (!start || !end) return '—'
      const s = new Date(start).getTime()
      const e = new Date(end).getTime()
      const diffMs = e - s
      if (isNaN(diffMs)) return '—'
      const hours = Math.floor(diffMs / 3600000)
      const minutes = Math.floor((diffMs % 3600000) / 60000)
      return `${hours}h ${minutes}m`
    },
    msToHuman(ms) {
      if (!ms || isNaN(ms)) return '0m'
      const totalMin = Math.floor(ms / 60000)
      const h = Math.floor(totalMin / 60)
      const m = totalMin % 60
      return h > 0 ? `${h}h ${m}m` : `${m}m`
    },
    calcCompliance(raw) {
      if (!raw) return 100
      if (!raw.breachesCount) return 100
      return Math.max(0, 100 - raw.breachesCount * 10)
    },
    fmtDate(iso) {
      if (!iso) return '—'
      const d = new Date(iso)
      return isNaN(+d) ? String(iso) : d.toLocaleString()
    },
    fmtDay(iso) {
      if (!iso) return '—'
      const d = new Date(iso)
      if (isNaN(+d)) return String(iso)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    },
    fmtDayTime(iso) {
      if (!iso) return '—'
      const d = new Date(iso)
      if (isNaN(+d)) return String(iso)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    },
  },
}
</script>

<style scoped lang="scss">
:root {
  --warm-primary: #D4730A;
  --warm-secondary: #F59E0B;
  --warm-accent: #F97316;
  --warm-light: #FEF3E2;
  --warm-lighter: #FFFBF5;
  --warm-gradient: linear-gradient(135deg, #D4730A 0%, #F59E0B 100%);
  --warm-gradient-light: linear-gradient(135deg, #FEF3E2 0%, #FFFBF5 100%);
}

.page-container {
  padding: 24px;
  background: var(--warm-lighter);
  min-height: 100vh;
}

.page-header {
  background: var(--warm-gradient);
  border-radius: 16px;
  padding: 24px 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(212, 115, 10, 0.15);
  animation: slideInFromTop 0.6s ease-out;

  .header-content {
    display: flex;
    flex-direction: column;
    gap: 16px;

    .header-navigation {
      display: flex;
      justify-content: flex-start;
      
      .back-btn {
        background: rgba(255, 255, 255, 0.1) !important;
        border: 1px solid rgba(255, 255, 255, 0.3) !important;
        color: white !important;
        backdrop-filter: blur(10px);
        border-radius: 8px !important;
        text-transform: none !important;
        font-weight: 500 !important;
        transition: all 0.3s ease !important;

        &:hover {
          background: rgba(255, 255, 255, 0.2) !important;
          border-color: rgba(255, 255, 255, 0.5) !important;
          transform: translateX(-2px);
        }

        .v-icon {
          color: white !important;
        }
      }
    }

    .header-main {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .header-icon {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 12px;
      backdrop-filter: blur(10px);
    }

    .header-text {
      .page-title {
        color: white;
        font-size: 2rem;
        font-weight: 700;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .page-subtitle {
        color: rgba(255, 255, 255, 0.9);
        font-size: 1.1rem;
        margin: 4px 0 0 0;
        font-weight: 400;
      }
    }
  }
}

.tabs-card {
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(212, 115, 10, 0.1);
  overflow: hidden;
  animation: slideInFromLeft 0.6s ease-out 0.1s both;

  :deep(.warm-tabs) {
    background: var(--warm-gradient-light);

    .v-tab {
      color: var(--warm-primary) !important;
      font-weight: 600 !important;
      text-transform: none !important;
      
      &--selected {
        color: var(--warm-primary) !important;
        background: rgba(212, 115, 10, 0.1);
      }
    }

    .v-tab-item {
      border-radius: 12px 12px 0 0;
    }

    .v-slide-group__content {
      background: transparent;
    }
  }
}

.content-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(212, 115, 10, 0.1);
  overflow: hidden;
  animation: slideInFromRight 0.6s ease-out 0.2s both;

  .overview-content,
  .sla-content,
  .eco-content {
    padding: 32px;
  }

  .section-title {
    color: var(--warm-primary);
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
  }

  // Overview styles
  .details-section {
    background: var(--warm-gradient-light);
    border-radius: 12px;
    padding: 24px;
    border: 1px solid rgba(212, 115, 10, 0.1);
  }

  .details-grid {
    display: grid;
    gap: 16px;

    .detail-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid rgba(212, 115, 10, 0.1);

      &:last-child {
        border-bottom: none;
      }

      .label {
        font-weight: 600;
        color: var(--warm-primary);
        min-width: 140px;
      }

      .value {
        font-weight: 500;
        color: #333;
        
        &.case-id {
          background: var(--warm-light);
          padding: 4px 8px;
          border-radius: 6px;
          border: 1px solid rgba(212, 115, 10, 0.2);
          font-weight: 700;
          color: var(--warm-primary);
        }
      }
    }
  }

  // Attachments styles
  .attachments-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid rgba(212, 115, 10, 0.1);
  }

  .attachments-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 16px;
    min-height: 120px;

    .attachment-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      border: 1px solid rgba(212, 115, 10, 0.2);
      border-radius: 12px;
      background: var(--warm-light);
      transition: all 0.3s ease;

      &:hover {
        
        box-shadow: 0 4px 12px rgba(212, 115, 10, 0.2);
        background: white;
      }

      .attachment-icon {
        color: var(--warm-primary);
        margin-bottom: 8px;
      }

      .attachment-name {
        font-size: 0.8rem;
        text-align: center;
        color: #666;
        font-weight: 500;
      }
    }

    .no-attachments {
      grid-column: 1 / -1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px;
      color: #999;
      border: 2px dashed rgba(212, 115, 10, 0.2);
      border-radius: 12px;
    }
  }

  // SLA styles
  .history-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid rgba(212, 115, 10, 0.1);
  }

  .history-table {
    :deep(thead th) {
      background: var(--warm-gradient-light) !important;
      color: var(--warm-primary) !important;
      font-weight: 600 !important;
      border-bottom: 2px solid rgba(212, 115, 10, 0.2) !important;
    }

    :deep(tbody tr) {
      &:hover {
        background: var(--warm-light) !important;
      }

      &:nth-child(odd) {
        background: rgba(212, 115, 10, 0.03);
      }
    }
  }

  .sla-metrics-section {
    background: var(--warm-gradient-light);
    border-radius: 12px;
    padding: 24px;
    border: 1px solid rgba(212, 115, 10, 0.1);
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;

    .metric-card {
      background: white;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid rgba(212, 115, 10, 0.1);
      text-align: center;

      &.compliance {
        background: var(--warm-light);
        border: 2px solid var(--warm-primary);
      }

      .metric-label {
        font-size: 0.9rem;
        color: #666;
        margin-bottom: 8px;
        font-weight: 500;
      }

      .metric-value {
        font-size: 1.2rem;
        font-weight: 700;
        color: var(--warm-primary);
      }

      .compliance-value {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;

        .percentage {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--warm-primary);
        }
      }
    }
  }

  // Timeline styles
  .timeline-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid rgba(212, 115, 10, 0.1);
  }

  .timeline-container {
    position: relative;
    padding-left: 24px;

    &::before {
      content: '';
      position: absolute;
      left: 12px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: var(--warm-gradient);
    }

    .timeline-item {
      position: relative;
      margin-bottom: 24px;

      &:not(.is-last)::after {
        content: '';
        position: absolute;
        left: -18px;
        top: 32px;
        bottom: -24px;
        width: 2px;
        background: rgba(212, 115, 10, 0.3);
      }

      .timeline-dot {
        position: absolute;
        left: -24px;
        top: 8px;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--warm-gradient);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(212, 115, 10, 0.3);
      }

      .timeline-content {
        margin-left: 16px;

        .timeline-status {
          font-weight: 600;
          color: var(--warm-primary);
          margin-bottom: 4px;
        }

        .timeline-date {
          font-size: 0.9rem;
          color: #666;
          margin-bottom: 4px;
        }

        .timeline-note {
          font-size: 0.8rem;
          color: #888;
          font-style: italic;
        }
      }
    }

    .no-timeline {
      text-align: center;
      padding: 32px;
      color: #999;
    }
  }

  // Escalations & Compensations styles
  .action-toolbar {
    display: flex;
    gap: 12px;
    margin-bottom: 32px;
    flex-wrap: wrap;

    .action-btn {
      border-radius: 12px !important;
      text-transform: none !important;
      font-weight: 600 !important;
      padding: 0 20px !important;
      height: 40px !important;

      &.primary-btn {
        background: var(--warm-gradient) !important;
        color: white !important;
        box-shadow: 0 4px 12px rgba(212, 115, 10, 0.3);

        &:hover {
          
          box-shadow: 0 6px 20px rgba(212, 115, 10, 0.4);
        }
      }

      &:not(.primary-btn) {
        border: 2px solid var(--warm-primary) !important;
        color: var(--warm-primary) !important;

        &:hover {
          background: var(--warm-light) !important;
          
        }
      }
    }
  }

  .escalation-section,
  .compensation-section {
    background: var(--warm-gradient-light);
    border-radius: 12px;
    padding: 24px;
    border: 1px solid rgba(212, 115, 10, 0.1);
  }

  .compensation-table {
    :deep(thead th) {
      background: var(--warm-gradient-light) !important;
      color: var(--warm-primary) !important;
      font-weight: 600 !important;
      border-bottom: 2px solid rgba(212, 115, 10, 0.2) !important;
    }

    :deep(tbody tr) {
      &:hover {
        background: var(--warm-light) !important;
      }

      &:nth-child(odd) {
        background: rgba(212, 115, 10, 0.03);
      }
    }

    .compensation-actions {
      display: flex;
      gap: 8px;
    }
  }

  // Discussion styles
  .discussion-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    border: 1px solid rgba(212, 115, 10, 0.1);
  }

  .chat-container {
    border: 1px solid rgba(212, 115, 10, 0.2);
    border-radius: 12px;
    overflow: hidden;
  }

  .chat-messages {
    max-height: 300px;
    overflow-y: auto;
    padding: 16px;
    background: var(--warm-lighter);

    .message {
      display: flex;
      margin-bottom: 16px;

      &.own-message {
        flex-direction: row-reverse;

        .message-bubble {
          background: var(--warm-gradient);
          color: white;
          border-radius: 18px 18px 4px 18px;
        }
      }

      .message-bubble {
        max-width: 70%;
        padding: 12px 16px;
        background: white;
        border-radius: 18px 18px 18px 4px;
        border: 1px solid rgba(212, 115, 10, 0.1);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        .message-content {
          font-size: 0.9rem;
          line-height: 1.4;
          margin-bottom: 4px;
        }

        .message-time {
          font-size: 0.75rem;
          opacity: 0.7;
          text-align: right;
        }
      }
    }

    .no-messages {
      text-align: center;
      padding: 32px;
      color: #999;
    }
  }

  .chat-input {
    display: flex;
    padding: 16px;
    background: white;
    border-top: 1px solid rgba(212, 115, 10, 0.1);

    :deep(.v-field) {
      border-radius: 12px;
    }

    .v-btn {
      border-radius: 12px !important;
      background: var(--warm-gradient) !important;
      color: white !important;
    }
  }

  .scroll-bottom-btn {
    position: absolute;
    right: 24px;
    bottom: 80px;
    z-index: 10;
  }
}

// Animations
@keyframes slideInFromTop {
  from {
    opacity: 0;
    /* transform: translateY(...) uklonjeno za bolje UX */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

// Responsive design
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }

  .page-header {
    padding: 20px 24px;
    margin-bottom: 20px;

    .header-content {
      gap: 12px;

      .header-navigation {
        .back-btn {
          font-size: 0.875rem !important;
          height: 32px !important;
          min-width: auto !important;
          padding: 0 12px !important;
        }
      }

      .header-main {
        gap: 12px;
      }

      .header-text .page-title {
        font-size: 1.6rem;
      }
    }
  }

  .content-card {
    .overview-content,
    .sla-content,
    .eco-content {
      padding: 20px;
    }

    .details-grid .detail-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;

      .label {
        min-width: auto;
      }
    }

    .attachments-grid {
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    }

    .metrics-grid {
      grid-template-columns: 1fr;
    }

    .action-toolbar {
      flex-direction: column;

      .action-btn {
        width: 100% !important;
      }
    }
  }
}

// Dark mode support
@media (prefers-color-scheme: dark) {
  :root {
    --warm-lighter: #1a1a1a;
    --warm-light: #2d2d2d;
  }

  .page-container {
    background: var(--warm-lighter);
  }

  .details-grid .detail-item .value {
    color: #e0e0e0;
  }

  .attachment-name {
    color: #b0b0b0;
  }

  .metric-label {
    color: #b0b0b0;
  }

  .timeline-content {
    .timeline-date,
    .timeline-note {
      color: #b0b0b0;
    }
  }

  .message-content {
    color: #333;
  }
}
</style>
