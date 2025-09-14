<!-- src/components/TicketWindow.vue -->
<template>
  <v-container class="py-8">
    <v-row>
      <!-- LEFT: Ticket Details + Attachments -->
      <v-col cols="12" md="6">
        <div class="text-h5 mb-6">Ticket Details:</div>

        <v-skeleton-loader
          v-if="loading.details"
          type="article, actions"
          class="mb-6"
        />

        <template v-else>
          <v-row dense class="mb-6">
            <v-col cols="5" class="detail-label">Reservation:</v-col>
            <v-col cols="7" class="detail-value">{{ ticketComputed.reservation || '—' }}</v-col>

            <v-col cols="5" class="detail-label">Category:</v-col>
            <v-col cols="7" class="detail-value">{{ ticketComputed.category || '—' }}</v-col>

            <v-col cols="5" class="detail-label">Status:</v-col>
            <v-col cols="7" class="detail-value">
              {{ ticketComputed.statusName || ticketComputed.status || '—' }}
            </v-col>

            <v-col cols="5" class="detail-label">Date Created:</v-col>
            <v-col cols="7" class="detail-value">{{ formatDate(ticketComputed.createdAt) }}</v-col>

            <v-col cols="5" class="detail-label">Last Activity:</v-col>
            <v-col cols="7" class="detail-value">{{ formatDate(ticketComputed.lastActivity) }}</v-col>

            <v-col cols="5" class="detail-label">Assigned Operator:</v-col>
            <v-col cols="7" class="detail-value">{{ ticketComputed.assigneeUsername || '—' }}</v-col>
          </v-row>

          <div class="text-subtitle-1 mb-2">Attachments:</div>

          <!-- Attachments carousel -->
          <!-- Attachments carousel -->
<div class="attachments">
  <v-btn size="small" variant="tonal" class="nav left" @click="scroll(-1)">
    <v-icon>mdi-chevron-left</v-icon>
  </v-btn>

  <div ref="track" class="track">
    <v-skeleton-loader
      v-if="loading.attachments"
      type="image, image, image"
      class="w-100"
      style="min-width: 360px"
    />
    <template v-else>
  <a
  v-for="(a, i) in attachmentsComputed"
  :key="i"
  class="item"
  :href="a.url || '#'"
  target="_blank"
  rel="noopener"
  :title="`Open ${a.name || a.label || ''}`"
  :style="{ cursor: a.url ? 'pointer' : 'not-allowed', opacity: a.url ? 1 : 0.6 }"
>
  <div class="thumb">
    <v-icon v-if="a.type==='image'">mdi-image</v-icon>
    <v-icon v-else-if="a.type==='pdf'">mdi-file-pdf-box</v-icon>
    <v-icon v-else>mdi-file</v-icon>
  </div>
  <div class="caption">{{ a.label || a.name }}</div>
</a>

      <div v-if="attachmentsComputed.length === 0" class="text-medium-emphasis">
        No attachments.
      </div>
    </template>
  </div>

  <v-btn size="small" variant="tonal" class="nav right" @click="scroll(1)">
    <v-icon>mdi-chevron-right</v-icon>
  </v-btn>
</div>

        </template>
      </v-col>

      <!-- RIGHT: Discussion -->
      <v-col cols="12" md="6">
        <div class="text-h6 mb-2">Ticket Discussion:</div>
        <div class="chat-frame">
          <div class="chat-scroll" ref="chatScroll">
            <v-skeleton-loader v-if="loading.messages" type="paragraph, paragraph" />
            <template v-else>
             <div
  v-for="(m, idx) in messagesComputed"
  :key="idx"
  class="msg-row"
  :class="m.sender==='customer' ? 'right' : 'left'"
>
  <div class="bubble" :class="m.sender==='customer' ? 'user' : 'neutral'">
    <div class="text">{{ m.text }}</div>
    <div class="time">{{ formatLong(m.time) }}</div>
  </div>
</div>

              <div v-if="messagesComputed.length===0" class="text-medium-emphasis pa-4">
                No messages yet.
              </div>
            </template>
          </div>

          <div class="composer">
            <v-text-field
              v-model="draftComputed"
              placeholder="Enter a message"
              hide-details
              variant="outlined"
              density="comfortable"
              @keydown.enter.prevent="send"
              :disabled="sending"
            />
            <v-btn class="ml-2" :loading="sending" :disabled="!draftComputed?.trim()" @click="send">
              Send
            </v-btn>
          </div>
        </div>

        <div class="d-flex justify-end mt-6">
          <v-btn variant="tonal" @click="goBack">Go Back</v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- preview dialog -->
    <v-dialog v-model="previewOpenComputed" max-width="720">
      <v-card>
        <v-card-title>{{ selectedComputed?.label || selectedComputed?.name }}</v-card-title>
        <v-card-text class="text-medium-emphasis">
          File preview (mock). Type: {{ selectedComputed?.type?.toUpperCase() || 'FILE' }} •
          Name: {{ selectedComputed?.name }}
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="previewOpenComputed=false">Close</v-btn>
          <v-btn
            v-if="selectedComputed?.url"
            variant="tonal"
            @click="openFile(selectedComputed.url)"
          >
            Open
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { reactive, computed, nextTick, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import axiosInstance from '@/utils/axiosInstance'

/* ========= mini store (bez test podataka) ========= */
function createTicketWindowStore() {
  const state = reactive({
    ticket: {
      id: null,
      reservation: null,
      category: null,
      status: null,       // fallback ako nema statusName
      statusName: null,   // čitko ime (npr. "Pending")
      createdAt: null,
      lastActivity: null,
      assigneeUsername: null,
    },
    attachments: [], // [{type,name,label,url}]
    messages: [],    // [{sender,text,time}]
    draft: '',
    previewOpen: false,
    selected: null,
  })

  // Ticket
  const getTicket = () => state.ticket
  const setTicket = (partial) => Object.assign(state.ticket, partial)

  // Attachments
  const getAttachments = () => state.attachments
  const setAttachments = (arr) => { state.attachments = Array.isArray(arr) ? arr : [] }

  // Messages
  const getMessages = () => state.messages
  const setMessages = (arr) => { state.messages = Array.isArray(arr) ? arr : [] }
  const addMessage = (msg) => state.messages.push(msg)

  // Draft
  const getDraft = () => state.draft
  const setDraft = (v) => { state.draft = v }

  // Preview
  const getPreviewOpen = () => state.previewOpen
  const setPreviewOpen = (b) => { state.previewOpen = !!b }
  const getSelected = () => state.selected
  const setSelected = (a) => { state.selected = a }

  return {
    // ticket
    getTicket, setTicket,
    // attachments
    getAttachments, setAttachments,
    // messages
    getMessages, setMessages, addMessage,
    // draft
    getDraft, setDraft,
    // preview
    getPreviewOpen, setPreviewOpen, getSelected, setSelected,
    _state: state,
  }
}

const store = createTicketWindowStore()

/* ========= computed binding ========= */
const ticketComputed = computed({
  get: () => store.getTicket(),
  set: (p) => store.setTicket(p),
})

const attachmentsComputed = computed({
  get: () => store.getAttachments(),
  set: (arr) => store.setAttachments(arr),
})

const messagesComputed = computed({
  get: () => store.getMessages(),
  set: (arr) => store.setMessages(arr),
})

const draftComputed = computed({
  get: () => store.getDraft(),
  set: (v) => store.setDraft(v),
})

const previewOpenComputed = computed({
  get: () => store.getPreviewOpen(),
  set: (b) => store.setPreviewOpen(b),
})

const selectedComputed = computed({
  get: () => store.getSelected(),
  set: (a) => store.setSelected(a),
})

/* ========= loading / state ========= */
const loading = reactive({
  details: true,
  attachments: true,
  messages: true,
})
const sending = ref(false)
const track = ref(null)
const chatScroll = ref(null)

const route = useRoute()
const ticketId = computed(() => Number(route.params.id))

/* ========= helpers ========= */
function buildFileType(nameOrMime = '') {
  const s = String(nameOrMime).toLowerCase()
  if (s.endsWith('.png') || s.endsWith('.jpg') || s.endsWith('.jpeg') || s.endsWith('.gif') || s.startsWith('image/')) {
    return 'image'
  }
  if (s.endsWith('.pdf') || s.startsWith('application/pdf')) return 'pdf'
  return 'file'
}

function toAbsoluteUrl(storageKey = '') {
  if (!storageKey) return null;

  // Ako backend nekad vrati pun URL (http/https), samo ga koristi
  if (/^https?:\/\//i.test(storageKey)) return storageKey;

  // normalizuj: skini leading slash, da ostane "uploads/..."
  const clean = String(storageKey).replace(/^\/+/, '');

  // UVEK koristi origin bez /api (npr. http://localhost:3000)
  const base = axiosInstance?.defaults?.baseURL || '';
  let originOnly;
  try {
    originOnly = new URL(base, window.location.origin).origin;
  } catch {
    originOnly = window.location.origin;
  }

  return `${originOnly}/${clean}`; // -> http://localhost:3000/uploads/...
}


/* ========= API ========= */
/** Jedna ulazna tacka: pokupi sve što treba za view */
async function fetchTicket() {
  try {
    loading.details = loading.attachments = loading.messages = true;

    // jedan jedini poziv – sve stiže iz ove rute
    const { data: d } = await axiosInstance.get(`/complaint/mycomplaints/${ticketId.value}`);
    console.log('ticket data:', d);


    const fullName = d.user ? [d.user.name, d.user.surname].filter(Boolean).join(' ') : null;
    // ===== Details =====
    store.setTicket({
      id: d.id ?? ticketId.value,
      reservation: d.reservation?.code ?? d.reservationCode ?? null, // prikazujemo code
      category: d.category ?? null,
      status: d.status?.code ?? null,          // fallback kod
      statusName: d.status?.name ?? null,      // čitko ime
      createdAt: d.createdAt ?? null,
      lastActivity: d.lastActivityAt ?? d.updatedAt ?? null,
      assigneeUsername: d.assigneeUsername ?? fullName ?? null,
    });
    loading.details = false;

    // ===== Attachments =====
const atts = Array.isArray(d.attachments) ? d.attachments : [];
const mappedAtts = atts.map(x => {
  const name =
    x.originalFilename ||
    x.name ||
    (x.storageKey ? String(x.storageKey).split('/').pop() : '') ||
    'file';

  const mime = x.contentType || '';
  const url = x.storageKey ? toAbsoluteUrl(String(x.storageKey)) : null;

  const type = mime
    ? (mime.startsWith('image/') ? 'image' : (mime === 'application/pdf' ? 'pdf' : 'file'))
    : buildFileType(name);

  return {
    id: x.id,
    name,
    label: name.length > 18 ? name.slice(0, 16) + '…' : name,
    url,     // npr. http://localhost:3000/uploads/telegram_background-....png
    type,    // 'image' | 'pdf' | 'file'
  };
});
attachmentsComputed.value = mappedAtts;
loading.attachments = false;


    // ===== Messages =====
    const msgs = Array.isArray(d.messages) ? d.messages : [];
    messagesComputed.value = msgs.map(m => ({
      // očekivana polja u UI: { sender, text, time }
      sender: m.sender || m.author || 'operator', // 'customer' ili 'operator'
      text: m.text || m.body || '',
      time: m.time || m.createdAt || new Date().toISOString(),
    }));
    loading.messages = false;

    // scroll na dno chata
    nextTick(() => chatScroll.value?.scrollTo({ top: chatScroll.value.scrollHeight }));
  } catch (e) {
    console.error('fetchTicket failed:', e);
    loading.details = loading.attachments = loading.messages = false;
  }
}


/** Jedini poseban poziv: slanje poruke */
async function send() {
  const text = (draftComputed.value || '').trim()
  if (!text || sending.value) return
  sending.value = true

  try {
    // Optimistic UI
    const tempMsg = { sender: 'manager', text, time: new Date().toISOString(), _optimistic: true }
    store.addMessage(tempMsg)
    draftComputed.value = ''
    nextTick(() => {
      chatScroll.value?.scrollTo({ top: chatScroll.value.scrollHeight, behavior: 'smooth' })
    })

    // POST /complaint/:id/messages { text }
    await axiosInstance.post(`/complaint/mycomplaints/${ticketId.value}/messages`, { text })

    // (opciono) refetch samo messages da pokupimo ID/tačan timestamp sa servera:
    nextTick(() => {
      chatScroll.value?.scrollTo({ top: chatScroll.value.scrollHeight, behavior: 'smooth' })
    })
  } catch (e) {
    console.error('sendMessage failed:', e)
  } finally {
    sending.value = false
  }
}

/* ========= UI akcije ========= */
function scroll(dir) {
  const el = track.value
  if (!el) return
  const step = el.clientWidth * 0.8
  el.scrollBy({ left: dir * step, behavior: 'smooth' })
}

function preview(a) {
  selectedComputed.value = a
  previewOpenComputed.value = true
}
function openFile(url) {
  window.open(url, '_blank', 'noopener')
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d)) return '—'
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`
}
function formatLong(iso) {
  const d = new Date(iso)
  if (isNaN(d)) return ''
  return `${d.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}
function goBack() { window.history.back() }

/* ========= lifecycle ========= */
onMounted(() => {
  fetchTicket()
})
</script>

<style scoped>
.detail-label{ font-weight:600; color:rgba(var(--v-theme-on-surface),0.7) }
.detail-value{ white-space:pre-wrap }

/* Attachments */
.attachments{
  position: relative; border:1px solid rgba(var(--v-theme-on-surface),.2);
  border-radius:16px; padding:12px 40px; min-height: 150px;
}
.attachments .nav{
  position:absolute; top:50%; transform:translateY(-50%); z-index:2
}
.attachments .nav.left{ left:6px }
.attachments .nav.right{ right:6px }
.track{
  display:flex; overflow-x:auto; gap:16px; scroll-behavior:smooth; padding:4px
}
.item{
  min-width:120px; max-width:120px; border:1px solid rgba(var(--v-theme-on-surface),.2);
  border-radius:12px; padding:8px; text-align:center; cursor:pointer;
  background: rgba(var(--v-theme-surface),1);
}
.thumb{
  height:90px; display:flex; align-items:center; justify-content:center;
  border:1px dashed rgba(var(--v-theme-on-surface),.3); border-radius:8px;
}
.caption{ font-size:12px; opacity:.8; margin-top:6px; white-space:pre-line }

/* Chat */
.chat-frame{
  border:1px solid rgba(var(--v-theme-on-surface),.25);
  border-radius:12px; padding:12px; background: rgba(var(--v-theme-surface),.6)
}
.chat-scroll{ height:380px; overflow:auto; padding:8px }
.msg-row{ display:flex; margin:12px 0 }
.msg-row.right{ justify-content:flex-end }
.bubble{
  max-width:78%; padding:10px 12px; border-radius:14px; box-shadow:0 1px 6px rgba(0,0,0,.06)
}
.bubble.primary{ background: var(--v-theme-primary); color: var(--v-theme-on-primary) }
.bubble.neutral{ background: rgba(var(--v-theme-surface-variant),1); color: rgba(var(--v-theme-on-surface),.95) }
.bubble .text{ white-space:pre-line; font-size:15px }
.bubble .time{ font-size:11px; opacity:.8; margin-top:6px; text-align:right }
.composer{ display:flex; align-items:center; margin-top:10px }
.bubble.user {
  background: #2196f3; /* Plava */
  color: white;        /* Tekst beo */
}

</style>
