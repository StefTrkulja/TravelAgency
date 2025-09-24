<!-- src/views/TicketDetails.vue -->
<template>
  <v-container class="py-6">
    <v-card class="ticket-card" elevation="0">
      <!-- Segmented header (tabs stilizovani kao na skici) -->
      <div class="segmented-header">
        <button class="seg-btn" :class="{ active: activeTab==='overview' }" @click="activeTab='overview'">
          Overview
        </button>
        <button class="seg-btn" :class="{ active: activeTab==='sla' }" @click="activeTab='sla'">
          Status & SLA
        </button>
        <button class="seg-btn" :class="{ active: activeTab==='eco' }" @click="activeTab='eco'">
          Escalations & Compensations
        </button>
      </div>

      <v-window v-model="activeTab" class="content-wrap">
        <!-- ================= OVERVIEW ================= -->
        <v-window-item value="overview">
          <div class="section">
            <v-row class="ov-grid" no-gutters>
              <!-- LEFT: KV lista -->
              <v-col cols="12" md="6" class="left-kv">
                <Kv label="Subject"       :value="ticket.subject" />
                <Kv label="Case ID"       :value="ticket.id" />
                <Kv label="Reservation"   :value="ticket.reservation?.code ?? ticket.reservationCode" />
                <Kv label="Passenger"     :value="fullName || '—'" />
                <Kv label="Category"      :value="ticket.category" />
                <Kv label="Status"        :value="ticket.status?.name || ticket.status?.code || ticket.status" />
                <Kv label="Date Created"  :value="fmtDate(ticket.createdAt)" />
                <Kv label="Priority"      :value="ticket.priority" />
              </v-col>

              <!-- RIGHT: meta + attachments -->
              <v-col cols="12" md="6" class="right-meta">
                <div class="two-col-list">
                  <div class="row">
                    <div class="label">Date Created:</div>
                    <div class="value">{{ fmtDate(ticket.createdAt) }}</div>
                  </div>
                  <div class="row">
                    <div class="label">Last Activity:</div>
                    <div class="value">{{ fmtDate(ticket.lastActivityAt) }}</div>
                  </div>
                  <div class="row">
                    <div class="label">Assigned:</div>
                    <div class="value">{{ ticket.assigneeUsername || '—' }}</div>
                  </div>
                </div>

                <!-- Attachments -->
                <div class="att-wrap">
                  <div class="att-title">Attachments</div>

                  <div class="att-box">
                    <button class="att-arrow left" @click="scrollAttachments(-1)">
                      <v-icon size="20">mdi-chevron-left</v-icon>
                    </button>

                    <div class="att-viewport">
                      <div class="att-track" ref="attTrack">
                        <a
                          v-for="(a, i) in attachments"
                          :key="a.id || i"
                          class="att-item"
                          :href="a.url || '#'"
                          target="_blank"
                          rel="noopener"
                          :title="a.name || 'attachment'"
                          :style="{ cursor: a.url ? 'pointer' : 'not-allowed', opacity: a.url ? 1 : 0.6 }"
                          @click.prevent="a.url && openFile(a.url)"
                        >
                          <div class="thumb">
                            <v-icon v-if="a.type==='image'">mdi-image</v-icon>
                            <v-icon v-else-if="a.type==='pdf'">mdi-file-pdf-box</v-icon>
                            <v-icon v-else>mdi-file</v-icon>
                          </div>
                          <div class="caption" :title="a.name">{{ a.label || a.name }}</div>
                        </a>

                        <div v-if="!attachments?.length" class="empty-state">
                          <v-icon size="24" class="mr-2">mdi-folder-open-outline</v-icon>
                          No attachments
                        </div>
                      </div>
                    </div>

                    <button class="att-arrow right" @click="scrollAttachments(1)">
                      <v-icon size="20">mdi-chevron-right</v-icon>
                    </button>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-window-item>

        <!-- ================= STATUS & SLA ================= -->
        <v-window-item value="sla">
          <div class="section">
            <div class="sub-title mb-2">Status History</div>
            <v-table class="history-table" fixed-header height="260">
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
                <tr v-if="!history.length">
                  <td colspan="4" class="text-medium-emphasis">No history.</td>
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
                <div class="sub-title mb-2">Timeline</div>

                <div class="tl-wrap">
                  <div class="tl-line"></div>

                  <div
                    class="tl-track"
                    :class="{
                      centered: timeline.length === 1,
                      spread: timeline.length > 1
                    }"
                  >
                    <div v-for="(t,i) in timeline" :key="i" class="tl-dot">
                      <div class="dot"></div>
                      <div class="tl-meta">
                        <div class="tl-status">{{ t.toStatusName }}</div>
                        <div class="tl-date">{{ fmtDay(t.changedAt) }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-window-item>

        <!-- ================= ESCALATIONS & COMPENSATIONS ================= -->
        <v-window-item value="eco">
          <div class="section">
            <!-- Actions toolbar -->
            <div class="eco-actions">
              <div class="left-group"></div>
              <div class="right-group">
                <v-btn
                  size="small"
                  variant="tonal"
                  prepend-icon="mdi-arrow-up-bold-box"
                  :loading="acceptingEsc"
                  :disabled="!canAcceptEscalation"
                  @click="acceptEscalation"
                  class="mr-2"
                >
                  Accept Escalation
                </v-btn>

                <v-btn
                  size="small"
                  color="primary"
                  prepend-icon="mdi-cash-plus"
                  @click="openCreateCompDialog"
                  class="mr-2"
                >
                  Create Compensation
                </v-btn>

                <v-btn
                  size="small"
                  color="error"
                  prepend-icon="mdi-check-circle"
                  :loading="closingTicket"
                  :disabled="!canCloseTicket"
                  @click="closeTicket"
                >
                  Close Ticket
                </v-btn>
              </div>
            </div>

            <v-row dense>
              <v-col cols="12" md="6">
                <div class="panel">
                  <div class="panel-title">Escalation</div>
                  <Kv label="Reason"       :value="escalation.reason" />
                  <Kv label="Date"         :value="fmtDay(escalation.escalatedAt)" />
                  <Kv label="Escalated By" :value="escalation.complaint.createdByUsername" />
                  <Kv label="Received By"  :value="escalation.managerUsername" />
                  <Kv label="Status"       :value="escalation.status || '—'" />
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
                  <td colspan="4" class="text-medium-emphasis">No proposals.</td>
                </tr>
              </tbody>
            </v-table>

            <!-- Internal Discussion -->
            <div class="sub-title mt-6 mb-2">Internal Discussion</div>
            <div class="panel chat">
              <div class="chat-body" ref="chatBody" @scroll="onChatScroll">
                <div
                  v-for="(m, i) in internalMessages"
                  :key="i"
                  class="msg"
                  :class="m.me ? 'me' : 'them'"
                >
                  <v-icon size="16" class="mr-1">mdi-account</v-icon>
                  <div class="bubble">
                    <div class="text">{{ m.content }}</div>
                    <div class="time">{{ fmtDate(m.time || m.createdAt) }}</div>
                  </div>
                </div>
                <div v-if="!internalMessages.length" class="text-medium-emphasis">
                  No messages yet.
                </div>
              </div>

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

            <!-- Create Compensation dialog (manager) -->
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
          </div>
        </v-window-item>
      </v-window>
    </v-card>
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

<style scoped>
.ticket-card { background: rgb(var(--v-theme-surface)); }

.segmented-header{
  display:grid; grid-template-columns:1fr 1fr 1fr;
  border:1px solid rgba(0,0,0,.28); border-radius:8px; overflow:hidden;
  margin:4px 16px 0;
}
.seg-btn{
  appearance:none; background:transparent; border:0; padding:10px 12px;
  font-weight:600; text-align:center; cursor:pointer;
  border-right:1px solid rgba(0,0,0,.28);
}
.seg-btn:last-child{ border-right:0; }
.seg-btn.active{ background:rgba(0,0,0,.05); }

.content-wrap{ padding:8px 12px 16px; }
.section{
  border:1px solid rgba(0,0,0,.28); border-radius:8px;
  padding:16px; margin-top:12px;
}

/* Overview layout */
.ov-grid{ border-top:1px solid rgba(0,0,0,.18); padding-top:12px; }
.left-kv .kv-row{
  display:grid; grid-template-columns:180px 1fr; gap:6px 16px; padding:4px 0;
}
.kv-label{ font-weight:600;}

/* Right meta */
.right-meta .two-col-list{ margin-bottom:12px; }
.two-col-list .row{
  display:grid; grid-template-columns:140px 1fr; padding:4px 0;
}
.two-col-list .label{ font-weight:600; }

/* Attachments */
.att-wrap{ margin-top:8px; }
.att-title{ font-weight:600; margin-bottom:6px; }
.att-box{
  position:relative; border:1px solid rgba(0,0,0,.35); border-radius:8px;
  padding:12px 36px; min-height:148px; background:#fff;
}
.att-viewport{ overflow:hidden; }
.att-track{ display:flex; gap:14px; padding:4px; scroll-behavior:smooth; }
.att-item{
  min-width:120px; max-width:120px; border:1px solid rgba(0,0,0,.2);
  border-radius:10px; padding:8px; text-align:center; background:#fff;
}
.thumb{
  height:86px; display:flex; align-items:center; justify-content:center;
  border:1px dashed rgba(0,0,0,.25); border-radius:8px;
}
.caption{
  font-size:12px; opacity:.85; margin-top:6px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.att-arrow{
  position:absolute; top:50%; transform:translateY(-50%);
  width:30px; height:30px; border:1px solid rgba(0,0,0,.25);
  border-radius:999px; display:grid; place-items:center; background:#fff;
  box-shadow:0 4px 12px rgba(0,0,0,.06);
}
.att-arrow.left{ left:6px } .att-arrow.right{ right:6px }
.empty-state{
  display:flex; align-items:center; justify-content:center; min-height:96px; width:100%;
  color:rgba(0,0,0,.6); border:1px dashed rgba(0,0,0,.18); border-radius:8px;
}

/* Tables */
.v-table.history-table thead th,
.v-table.comp-table thead th{
  font-weight:700; background:rgba(0,0,0,.04);
}
.v-table.history-table tbody tr:nth-child(odd),
.v-table.comp-table tbody tr:nth-child(odd){
  background:rgba(0,0,0,.02);
}

/* Timeline */
.tl-wrap{ position:relative; padding:22px 6px 8px; }
.tl-line{
  position:absolute; left:12px; right:12px; top:30px; height:1px; background:rgba(0,0,0,.22);
}
.tl-track{
  position:relative; display:flex; align-items:flex-start; gap:16px; margin-top:14px;
}
.tl-track.centered{ justify-content:center; }
.tl-track.spread{ justify-content:space-between; }
.tl-dot{ display:flex; flex-direction:column; align-items:center; text-align:center; min-width:0; }
.dot{
  width:12px; height:12px; border-radius:999px; background:#e53935; border:2px solid #fff;
  box-shadow:0 0 0 2px #e53935;
}
.tl-meta{ margin-top:6px; max-width:160px; }
.tl-status{ font-weight:600; }
.tl-date{ opacity:.8; font-size:.9rem; }

/* Panels & Chat */
.panel{
  border:1px solid rgba(0,0,0,.2); border-radius:8px; padding:12px; background:#fff;
}
.panel-title{ font-weight:700; margin-bottom:8px; }

.chat{ position:relative; }
.chat-body{
  max-height:300px; overflow:auto; padding:8px;
  border:1px solid rgba(0,0,0,.12); border-radius:8px; background:rgba(0,0,0,.02);
}
.msg{ display:flex; align-items:flex-start; margin:6px 0; }
.msg.me{ flex-direction:row-reverse; }
.msg .bubble{
  max-width:80%; padding:8px 10px; border-radius:10px; background:#fff; border:1px solid rgba(0,0,0,.12);
}
.msg.me .bubble{ background:#f3f7ff; }
.bubble .text{ margin-bottom:4px; }
.bubble .time{ font-size:.8rem; opacity:.7; text-align:right; }
.chat-compose{ display:flex; align-items:center; margin-top:8px; }
.scroll-bottom-btn{
  position:absolute; right:12px; bottom:64px; z-index:3;
}

/* Actions toolbar */
.eco-actions{
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:12px;
}
.eco-actions .right-group > * + * { margin-left:8px; }

/* Responsive */
@media (max-width: 959px){
  .left-kv .kv-row{ grid-template-columns:140px 1fr; }
  .two-col-list .row{ grid-template-columns:120px 1fr; }
}
</style>
