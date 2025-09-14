<!-- src/views/TicketDetails.vue -->
<template>
  <v-container class="py-6">
    <v-card class="ticket-card" elevation="0">
      <!-- Tabs -->
      <v-tabs v-model="activeTab" grow>
        <v-tab value="overview">Overview</v-tab>
        <v-tab value="sla">Status & SLA</v-tab>
        <v-tab value="eco">Escalations & Compensations</v-tab>
      </v-tabs>

      <v-window v-model="activeTab" class="content-wrap">
        <!-- ================= OVERVIEW ================= -->
        <v-window-item value="overview">
          <div class="section p-4">
            <v-row>
              <v-col cols="12" md="6">
                <Kv label="Subject"       :value="ticket.subject" />
                <Kv label="Case ID"       :value="ticket.id" />
                <Kv label="Reservation"   :value="ticket.reservation" />
                <Kv label="Passenger"     :value="ticket.passenger" />
                <Kv label="Category"      :value="ticket.category" />
                <Kv label="Status"        :value="ticket.statusName || ticket.status" />
                <Kv label="Date Created"  :value="fmtDate(ticket.createdAt)" />
                <Kv label="Priority"      :value="ticket.priority" />
              </v-col>

              <v-col cols="12" md="6">
                <Kv label="Last Activity" :value="fmtDate(ticket.lastActivityAt)" />

                <div class="mt-6 mb-2 text-subtitle-1 font-weight-600">Attachments</div>
                <div class="attachments">
                  <v-btn icon variant="text" @click="scrollAttachments(-1)">
                    <v-icon>mdi-chevron-left</v-icon>
                  </v-btn>

                  <div class="attachments-track" ref="attTrack">
                    <div
                      v-for="(a, i) in attachments"
                      :key="a.id || i"
                      class="att-card"
                      @click="previewAttachment(a)"
                    >
                      <div class="thumb">
                        <v-img
                          v-if="a.isImage"
                          :src="a.url"
                          alt="attachment"
                          cover
                        />
                        <div v-else class="doc-icon">
                          <v-icon size="36">mdi-file-document-outline</v-icon>
                        </div>
                      </div>
                      <div class="att-name">{{ a.name }}</div>
                      <v-btn size="x-small" class="mt-1" variant="outlined">Preview</v-btn>
                    </div>
                  </div>

                  <v-btn icon variant="text" @click="scrollAttachments(1)">
                    <v-icon>mdi-chevron-right</v-icon>
                  </v-btn>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-window-item>

        <!-- ================= STATUS & SLA ================= -->
        <v-window-item value="sla">
          <div class="section p-4">
            <!-- History -->
            <div class="sub-title mb-2">Status History</div>
            <v-table class="history-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Valid From</th>
                  <th>Note</th>
                  <th>Changed By</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(h, i) in history" :key="i">
                  <td>{{ h.toStatusName }}</td>
                  <td>{{ fmtDayTime(h.changedAt) }}</td>
                  <td>{{ h.note || '—' }}</td>
                  <td>{{ h.changedByUsername }}</td>
                </tr>
              </tbody>
            </v-table>

            <v-row class="mt-4" dense>
              <!-- SLA metrics -->
              <v-col cols="12" md="6">
                <div class="sub-title mb-2">SLA Metrics</div>
                <div class="metrics">
                  <Kv label="First Response Due"     :value="fmtDayTime(sla.firstResponseAt)" />
                  <Kv label="Time to First Response" :value="sla.tfr" />
                  <Kv label="Resolution Due"         :value="fmtDayTime(sla.resolutionDue)" />
                  <Kv label="Time to Resolution"     :value="sla.ttr" />
                  <Kv label="Number of Breaches"     :value="sla.breaches" />
                  <div class="metric-dot">
                    <span>SLA Compliance %</span>
                    <div class="dot-row">
                      <span class="percent">{{ sla.compliance }}%</span>
                      <v-icon color="red">mdi-circle</v-icon>
                    </div>
                  </div>
                </div>
              </v-col>

              <!-- Timeline -->
              <v-col cols="12" md="6">
                <div class="sub-title mb-2">Timemap</div>
                <div class="timeline">
                  <div v-for="(t, i) in timeline" :key="i" class="tl-item">
                    <v-icon color="red" size="18">mdi-circle</v-icon>
                    <div class="tl-label">
                      <div class="tl-status">{{ t.toStatusName }}</div>
                      <div class="tl-date">{{ fmtDay(t.changedAt) }}</div>
                    </div>
                  </div>
                  <div class="tl-axis"></div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-window-item>

        <!-- ================= ESCALATIONS & COMPENSATIONS ================= -->
        <v-window-item value="eco">
          <div class="section p-4">
            <v-row dense>
              <!-- Escalation -->
              <v-col cols="12" md="6">
                <div class="panel">
                  <div class="panel-title">Escalation</div>
                  <Kv label="Reason"       :value="escalation.subject" />
                  <Kv label="Date"         :value="fmtDay(escalation.createdAt)" />
                  <Kv label="Escalated By" :value="escalation.createdByUsername" />
                  <Kv label="Received By"  :value="escalation.assigneeUsername" />
                  <Kv label="Priority"     :value="escalation.status.name" />
                </div>
              </v-col>

              <!-- Internal Discussion -->
              <v-col cols="12" md="6">
                <div class="panel chat">
                  <div class="panel-title">Internal Discussion</div>
                  <div class="chat-body">
                    <div
                      v-for="(m, i) in internalMessages"
                      :key="i"
                      class="msg"
                      :class="m.me ? 'me' : 'them'"
                    >
                      <v-icon size="16" class="mr-1">mdi-account</v-icon>
                      <div class="bubble">
                        <div class="text">{{ m.text }}</div>
                        <div class="time">{{ fmtDate(m.time) }}</div>
                      </div>
                    </div>
                    <div v-if="!internalMessages.length" class="text-medium-emphasis">
                      No messages yet.
                    </div>
                  </div>
                  <div class="chat-compose">
                    <v-text-field
                      v-model="draft"
                      density="compact"
                      variant="outlined"
                      hide-details
                      placeholder="Enter a message"
                      class="flex-1"
                      @keydown.enter.prevent="sendInternal"
                    />
                    <v-btn class="ml-2" :loading="sending" @click="sendInternal">Send</v-btn>
                  </div>
                </div>
              </v-col>
            </v-row>

            <!-- Compensation Proposals -->
            <div class="sub-title mt-6 mb-2">Compensation Proposals</div>
            <v-table class="comp-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Value</th>
                  <th>Date Proposed</th>
                  <th style="text-align:right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(c, i) in compensations" :key="i">
                  <td>{{ c.type }}</td>
                  <td>{{ c.value }}</td>
                  <td>{{ fmtDay(c.date) }}</td>
                  <td class="text-right">
                    <v-btn size="small" color="primary" class="mr-2" @click="approveComp(c)">Approve</v-btn>
                    <v-btn size="small" variant="outlined" @click="rejectComp(c)">Reject</v-btn>
                  </td>
                </tr>
                <tr v-if="!compensations.length">
                  <td colspan="5" class="text-medium-emphasis">No proposals.</td>
                </tr>
              </tbody>
            </v-table>
          </div>
        </v-window-item>
      </v-window>
    </v-card>
  </v-container>
</template>

<script>
import axiosInstance from '@/utils/axiosInstance'
import { defineComponent, h } from 'vue'

export default {
  name: 'TicketDetails',
  components: {
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
      attachments: [],
      history: [],
      sla: {},
      timeline: [],
      escalation: {},
      internalMessages: [],
      draft: '',
      sending: false,
      compensations: [],
    }
  },
  async created() {
    const ticketId = this.$route.params.id

    await Promise.all([
      this.fetchTicket(ticketId),
      this.fetchAttachments(ticketId),
      this.fetchHistory(ticketId),
      this.fetchSla(ticketId),
      this.fetchTimeline(ticketId),
      this.fetchEscalation(ticketId),
      this.fetchInternalMessages(ticketId),
      this.fetchCompensations(ticketId),
    ])
  },
  methods: {
    async fetchTicket(id) {
      const { data } = await axiosInstance.get(`/complaint/${id}`)
      console.log('ticket data', data)
      this.ticket = data
    },
    async fetchAttachments(id) {
      const { data } = await axiosInstance.get(`/complaint/${id}/attachments`)
      this.attachments = data.map(a => ({
        ...a,
        isImage: a.contentType?.startsWith('image/'),
      }))
    },
    async fetchHistory(id) {
      const { data } = await axiosInstance.get(`/complaint/${id}/history`)
      this.history = data
      console.log('history', data)
    },
    async fetchSla(id) {
      const { data } = await axiosInstance.get(`/complaint/${id}/sla`)

  // raw SLA sa BE
  const raw = data

  // formatirano za prikaz
  this.sla = {
    firstResponseAt: raw.firstResponseAt,
    firstResponseDue: raw.responseDueAt,
    tfr: raw.firstResponseAt
      ? this.diffHuman(raw.firstResponseAt, raw.responseDueAt)
      : '—',
    resolutionDue: raw.resolutionDueAt,
    ttr: raw.resolvedAt
      ? this.diffHuman(raw.resolutionStartedAt, raw.resolvedAt)
      : '—',
    breaches: raw.breachesCount ?? 0,
    paused: this.msToHuman(raw.totalPausedMs),
    compliance: this.calcCompliance(raw),
  }
  console.log('SLA', raw, this.sla)
},
    async fetchTimeline(id) {
      const { data } = await axiosInstance.get(`/complaint/${id}/timeline`)
      this.timeline = data
    },
    async fetchEscalation(id) {
      const { data } = await axiosInstance.get(`/escalation/${id}`)
      this.escalation = data.data
      console.log('escalation', data) 
    },
    async fetchInternalMessages(id) {
      const { data } = await axiosInstance.get(`/complaint/${id}/internal-messages`)
      this.internalMessages = data.map(m => ({
        ...m,
        me: m.author === 'Manager', // prilagodi po login useru
      }))
    },
    async fetchCompensations(id) {
  const resp = await axiosInstance.get(`/compensation/${id}`)
  const payload = resp?.data
      console.log('compensations raw', payload) 
  // UVEK pretvori u niz
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.data)
      ? payload.data
      : (payload ? [payload] : [])

  // Normalizuj polja koja render očekuje
  this.compensations = list
    .filter(Boolean)
    .map(x => ({
      id: x.id ?? x.compensationId ?? undefined,
      type: x.type ?? x.kind ?? x.compensationType ?? '—',
      value: x.amount != null
        ? `${x.amount}${x.currency ? ' ' + x.currency : ''}`
        : (x.value ?? '—'),
      by: x.managerUsername ?? x.createdByUsername ?? x.proposedByUsername ?? '—',
      date: x.createdAt ?? x.date ?? x.proposedAt ?? null,
      status: x.status ?? '—',
    })).filter(c => c.status?.toUpperCase() === 'PROPOSED') // ⬅️ samo Proposed

  },
    async sendInternal() {
      const txt = (this.draft || '').trim()
      if (!txt || this.sending) return
      this.sending = true
      try {
        const ticketId = this.$route.params.id
        const { data } = await axiosInstance.post(`/complaint/${ticketId}/internal-messages`, { text: txt })
        this.internalMessages.push({ ...data, me: true })
        this.draft = ''
      } finally {
        this.sending = false
      }
    },
    async approveComp(c) {
      const ticketId = this.$route.params.id
      await axiosInstance.post(`/compensation/${c.id}/approve`)
      this.fetchCompensations(ticketId)
    },
    async rejectComp(c) {
      const ticketId = this.$route.params.id
      await axiosInstance.post(`/compensation/${c.id}/reject`)
      this.fetchCompensations(ticketId)
    },
    // Helpers
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

// ms u "xh ymin"
msToHuman(ms) {
  if (!ms || isNaN(ms)) return '0m'
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
},

// SLA compliance % (primer logika)
calcCompliance(raw) {
  if (!raw) return 100
  // ako nema breach-eva -> 100%
  if (!raw.breachesCount) return 100
  // osnovna formula: (broj SLA uspešnih / ukupno) * 100
  return Math.max(0, 100 - raw.breachesCount * 10) // prilagodi svojoj logici
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
    scrollAttachments(dir) {
      const el = this.$refs.attTrack
      if (el && el.scrollBy) el.scrollBy({ left: dir * 240, behavior: 'smooth' })
    },
    previewAttachment(a) {
      console.log('preview', a)
    },
  },
}
</script>
