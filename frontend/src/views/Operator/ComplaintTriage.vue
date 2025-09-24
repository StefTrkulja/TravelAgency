<template>
  <v-container class="py-8">
    <v-row>
      <!-- LEFT: Ticket Details + Attachments -->
      <v-col cols="12" md="6">
        <div class="text-h5 mb-6">Ticket Details (Triage):</div>

        <v-skeleton-loader v-if="loading.details" type="article, actions" class="mb-6" />
        <template v-else>
          <v-row dense class="mb-4">
            <v-col cols="5" class="detail-label">Reservation:</v-col>
            <v-col cols="7" class="detail-value">{{ ticket.reservation || '—' }}</v-col>

            <v-col cols="5" class="detail-label">Category:</v-col>
            <v-col cols="7" class="detail-value">{{ ticket.category || '—' }}</v-col>

            <v-col cols="5" class="detail-label">Status:</v-col>
            <v-col cols="7" class="detail-value">
              <v-chip v-if="ticket.status==='NEW'" size="small" color="warning" variant="tonal" class="ml-2">NEW</v-chip>
            </v-col>

            <v-col cols="5" class="detail-label">Date Created:</v-col>
            <v-col cols="7" class="detail-value">{{ formatDate(ticket.createdAt) }}</v-col>

            <v-col cols="5" class="detail-label">Assigned Operator:</v-col>
            <v-col cols="7" class="detail-value">{{ ticket.subject || '—' }}</v-col>

            <v-col cols="5" class="detail-label">Priority:</v-col>
            <v-col cols="7">
              <v-select
                v-model="selectedPriority"
                :items="priorityOptions"
                label="Select priority"
                density="compact"
                variant="outlined"
                hide-details
                class="select-compact"
                :loading="saving.priority"
                :disabled="accepting"
                @update:model-value="onPriorityChanged"
              />
              <!-- (opciono) mali preview SLA ciljeva za izabrani priority -->
              <div v-if="slaPreview" class="text-caption mt-1 text-medium-emphasis">
  First response: {{ slaPreview?.targetResponseMins ?? '—' }} min •
  Resolution: {{
    slaPreview?.targetResolutionMins
      ? Math.round((slaPreview.targetResolutionMins/60)*10)/10 + ' h'
      : '—'
  }}
</div>
            </v-col>
          </v-row>

          <div class="text-subtitle-1 mb-2">Attachments:</div>
          <div class="attachments">
            <v-btn size="small" variant="tonal" class="nav left" @click="scroll(-1)">
              <v-icon>mdi-chevron-left</v-icon>
            </v-btn>
            <div ref="track" class="track">
              <v-skeleton-loader v-if="loading.attachments" type="image, image, image" class="w-100" style="min-width: 360px" />
              <template v-else>
                <a v-for="(a, i) in attachments" :key="i" class="item" :href="a.url || '#'" target="_blank" rel="noopener"
                   :title="`Open ${a.name || a.label || ''}`"
                   :style="{ cursor: a.url ? 'pointer' : 'not-allowed', opacity: a.url ? 1 : 0.6 }">
                  <div class="thumb">
                    <v-icon v-if="a.type==='image'">mdi-image</v-icon>
                    <v-icon v-else-if="a.type==='pdf'">mdi-file-pdf-box</v-icon>
                    <v-icon v-else>mdi-file</v-icon>
                  </div>
                  <div class="caption">{{ a.label || a.name }}</div>
                </a>
                <div v-if="attachments.length===0" class="text-medium-emphasis">No attachments.</div>
              </template>
            </div>
            <v-btn size="small" variant="tonal" class="nav right" @click="scroll(1)">
              <v-icon>mdi-chevron-right</v-icon>
            </v-btn>
          </div>

          <div class="d-flex gap-2 mt-6">
            <v-btn color="primary" :loading="accepting" :disabled="!canAccept" @click="acceptTicket">
              Accept ticket
            </v-btn>
            <v-btn variant="tonal" @click="goBack">Go Back</v-btn>
          </div>
        </template>
      </v-col>

      <!-- RIGHT: Discussion (read-only u triage fazi) -->
      <v-col cols="12" md="6">
        <div class="text-h6 mb-2">Ticket Discussion (read-only):</div>
        <div class="chat-frame">
          <div class="chat-scroll" ref="chatScroll">
            <v-skeleton-loader v-if="loading.messages" type="paragraph, paragraph" />
            <template v-else>
              <div v-for="(m, idx) in messages" :key="idx" class="msg-row" :class="m.sender==='customer' ? 'right' : 'left'">
                <div class="bubble" :class="m.sender==='customer' ? 'user' : 'neutral'">
                  <div class="text">{{ m.text }}</div>
                  <div class="time">{{ formatLong(m.time) }}</div>
                </div>
              </div>
              <div v-if="messages.length===0" class="text-medium-emphasis pa-4">No messages yet.</div>
            </template>
          </div>
        </div>
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

<style scoped>
.detail-label{ font-weight:600; color:rgba(var(--v-theme-on-surface),0.7) }
.detail-value{ white-space:pre-wrap }
.select-compact :deep(.v-field){ height: 36px }

/* Attachments */
.attachments{ position:relative; border:1px solid rgba(0,0,0,.2); border-radius:16px; padding:12px 40px; min-height:150px }
.attachments .nav{ position:absolute; top:50%; transform:translateY(-50%); z-index:2 }
.attachments .nav.left{ left:6px } .attachments .nav.right{ right:6px }
.track{ display:flex; overflow-x:auto; gap:16px; scroll-behavior:smooth; padding:4px }
.item{ min-width:120px; max-width:120px; border:1px solid rgba(0,0,0,.2); border-radius:12px; padding:8px; text-align:center; background:#fff }
.thumb{ height:90px; display:flex; align-items:center; justify-content:center; border:1px dashed rgba(0,0,0,.3); border-radius:8px }
.caption{ font-size:12px; opacity:.8; margin-top:6px }

/* Chat (read-only) */
.chat-frame{ border:1px solid rgba(0,0,0,.25); border-radius:12px; padding:12px; background:#fafafa }
.chat-scroll{ height:380px; overflow:auto; padding:8px }
.msg-row{ display:flex; margin:12px 0 }
.msg-row.right{ justify-content:flex-end }
.bubble{ max-width:78%; padding:10px 12px; border-radius:14px; box-shadow:0 1px 6px rgba(0,0,0,.06) }
.bubble.user{ background:#2196f3; color:#fff }
.bubble.neutral{ background:#e9e9eb; color:#333 }
.bubble .text{ white-space:pre-line }
.bubble .time{ font-size:11px; opacity:.8; margin-top:6px; text-align:right }
</style>
