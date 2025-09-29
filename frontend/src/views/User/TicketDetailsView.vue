<!-- src/components/TicketWindow.vue -->
<template>
  <v-container class="py-8 ticket-details-container">
    <!-- Header -->
    <div class="ticket-header animate-fade-in">
      <div class="header-content">
        <v-icon size="32" color="var(--warm-orange)" class="mr-3">mdi-ticket-confirmation</v-icon>
        <div>
          <h1 class="ticket-title font-heading">Ticket #{{ ticketId }}</h1>
          <p class="ticket-subtitle">Detailed view and conversation</p>
        </div>
      </div>
      <v-btn
        variant="outlined"
        class="back-btn"
        prepend-icon="mdi-arrow-left"
        @click="goBack"
      >
        Go Back
      </v-btn>
    </div>

    <v-row class="ticket-content">
      <!-- LEFT: Ticket Details + Attachments -->
      <v-col cols="12" md="6">
        <v-card class="details-card" elevation="0">
          <v-card-title class="card-title">
            <v-icon class="mr-2">mdi-information-outline</v-icon>
            Ticket Details
          </v-card-title>

          <v-card-text class="pa-6">
            <v-skeleton-loader
              v-if="loading.details"
              type="article, actions"
              class="mb-6"
            />

            <template v-else>
              <div class="details-grid">
                <div class="detail-row">
                  <span class="detail-label">Reservation:</span>
                  <span class="detail-value">{{ ticketComputed.reservation || '—' }}</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Category:</span>
                  <span class="detail-value">
                    <v-chip class="category-chip" size="small">
                      {{ ticketComputed.category || '—' }}
                    </v-chip>
                  </span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value">
                    <v-chip 
                      class="status-chip" 
                      size="small"
                      :class="`status-${(ticketComputed.statusName || ticketComputed.status || '').toLowerCase()}`"
                    >
                      {{ ticketComputed.statusName || ticketComputed.status || '—' }}
                    </v-chip>
                  </span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Date Created:</span>
                  <span class="detail-value">{{ formatDate(ticketComputed.createdAt) }}</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Last Activity:</span>
                  <span class="detail-value">{{ formatDate(ticketComputed.lastActivity) }}</span>
                </div>

                <div class="detail-row">
                  <span class="detail-label">Assigned Operator:</span>
                  <span class="detail-value">{{ ticketComputed.assigneeUsername || '—' }}</span>
                </div>
              </div>
            </template>
          </v-card-text>
        </v-card>

        <!-- Attachments Section -->
        <v-card class="attachments-card mt-6" elevation="0">
          <v-card-title class="card-title">
            <v-icon class="mr-2">mdi-paperclip</v-icon>
            Attachments
          </v-card-title>

          <v-card-text class="pa-6">
            <div class="attachments-frame">
              <v-btn 
                size="small" 
                variant="text" 
                class="nav-arrow left" 
                @click="scroll(-1)"
                icon="mdi-chevron-left"
              />

              <div ref="track" class="attachments-track">
                <v-skeleton-loader
                  v-if="loading.attachments"
                  type="image, image, image"
                  class="w-100"
                  style="min-width: 360px"
                />
                <template v-else>
                  <div
                    v-for="(a, i) in attachmentsComputed"
                    :key="i"
                    class="attachment-item"
                    @click="openFile(a.url)"
                    :title="`Open ${a.name || a.label || ''}`"
                    :class="{ disabled: !a.url }"
                  >
                    <div class="attachment-thumb">
                      <v-icon 
                        size="32"
                        :color="a.url ? 'var(--warm-orange)' : 'grey'"
                      >
                        {{ getAttachmentIcon(a.type) }}
                      </v-icon>
                    </div>
                    <div class="attachment-caption">{{ a.label || a.name }}</div>
                  </div>

                  <div v-if="attachmentsComputed.length === 0" class="no-attachments">
                    <v-icon size="48" color="grey lighten-2">mdi-paperclip-off</v-icon>
                    <p class="text-medium-emphasis mt-2">No attachments</p>
                  </div>
                </template>
              </div>

              <v-btn 
                size="small" 
                variant="text" 
                class="nav-arrow right" 
                @click="scroll(1)"
                icon="mdi-chevron-right"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- RIGHT: Discussion -->
      <v-col cols="12" md="6">
        <v-card class="chat-card" elevation="0">
          <v-card-title class="card-title">
            <v-icon class="mr-2">mdi-chat-outline</v-icon>
            Ticket Discussion
          </v-card-title>

          <v-card-text class="pa-0">
            <div class="chat-container">
              <div class="chat-messages" ref="chatScroll">
                <v-skeleton-loader v-if="loading.messages" type="paragraph, paragraph" />
                <template v-else>
                  <div
                    v-for="(m, idx) in messagesComputed"
                    :key="idx"
                    class="message-wrapper"
                    :class="m.sender === 'customer' ? 'message-right' : 'message-left'"
                  >
                    <div class="message-bubble" :class="m.sender === 'customer' ? 'user-message' : 'operator-message'">
                      <div class="message-text">{{ m.text }}</div>
                      <div class="message-time">{{ formatLong(m.time) }}</div>
                    </div>
                  </div>

                  <div v-if="messagesComputed.length === 0" class="no-messages">
                    <v-icon size="48" color="grey lighten-2">mdi-chat-outline</v-icon>
                    <p class="text-medium-emphasis mt-2">No messages yet</p>
                  </div>
                </template>
              </div>

              <div class="chat-composer">
                <v-text-field
                  v-model="draftComputed"
                  placeholder="Type your message here..."
                  hide-details
                  variant="outlined"
                  density="comfortable"
                  class="message-input"
                  @keydown.enter.prevent="send"
                  :disabled="sending"
                  prepend-inner-icon="mdi-message-outline"
                />
                <v-btn 
                  class="send-btn"
                  :loading="sending" 
                  :disabled="!draftComputed?.trim()" 
                  @click="send"
                  variant="elevated"
                  color="primary"
                  icon="mdi-send"
                />
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Preview Dialog -->
    <v-dialog v-model="previewOpenComputed" max-width="720" class="preview-dialog">
      <v-card class="preview-card" elevation="0">
        <v-card-title class="preview-header">
          <v-icon class="mr-2">mdi-file-outline</v-icon>
          {{ selectedComputed?.label || selectedComputed?.name }}
        </v-card-title>
        <v-card-text class="preview-content">
          <div class="preview-info">
            <p>File preview (mock)</p>
            <p><strong>Type:</strong> {{ selectedComputed?.type?.toUpperCase() || 'FILE' }}</p>
            <p><strong>Name:</strong> {{ selectedComputed?.name }}</p>
          </div>
        </v-card-text>
        <v-card-actions class="preview-actions">
          <v-spacer />
          <v-btn variant="outlined" @click="previewOpenComputed = false">Close</v-btn>
          <v-btn
            v-if="selectedComputed?.url"
            variant="elevated"
            color="primary"
            @click="openFile(selectedComputed.url)"
          >
            Open File
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

function getAttachmentIcon(type) {
  switch (type) {
    case 'image': return 'mdi-image'
    case 'pdf': return 'mdi-file-pdf-box'
    default: return 'mdi-file-document-outline'
  }
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
/* Container */
.ticket-details-container {
  background: rgba(255, 255, 255, 0.02);
  border-radius: var(--border-radius-xl);
  backdrop-filter: blur(10px);
  min-height: calc(100vh - 120px);
}

/* Header */
.ticket-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.header-content {
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
}

.ticket-title {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--warm-brown);
  letter-spacing: 0.5px;
}

.ticket-subtitle {
  margin: 4px 0 0 0;
  color: rgba(28, 25, 23, 0.7);
  font-size: 1rem;
}

.back-btn {
  position: relative;
  z-index: 1;
  border-color: var(--warm-orange) !important;
  color: var(--warm-orange) !important;
  
  &:hover {
    background: rgba(212, 115, 10, 0.1) !important;
    
  }
}

/* Content */
.ticket-content {
  margin-top: 8px;
}

/* Cards */
.details-card, .attachments-card, .chat-card {
  border-radius: var(--border-radius-lg) !important;
  background: rgba(255, 255, 255, 0.98) !important;
  backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(245, 158, 11, 0.1) !important;
  transition: all 0.3s ease !important;
  
  &:hover {
    box-shadow: var(--warm-shadow-md) !important;
    border-color: rgba(245, 158, 11, 0.2) !important;
  }
}

.card-title {
  font-weight: 700 !important;
  color: var(--warm-brown) !important;
  border-bottom: 1px solid rgba(245, 158, 11, 0.1) !important;
  
  .v-icon {
    color: var(--warm-orange) !important;
  }
}

/* Details Grid */
.details-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(245, 158, 11, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
}

.detail-label {
  font-weight: 600;
  color: var(--warm-brown);
  font-size: 0.95rem;
  min-width: 140px;
}

.detail-value {
  color: var(--warm-text);
  font-weight: 500;
  text-align: right;
}

/* Chips */
.category-chip {
  background: var(--light-orange) !important;
  color: var(--warm-brown) !important;
  border: 1px solid rgba(212, 115, 10, 0.3) !important;
}

.status-chip {
  font-weight: 600 !important;
  
  &.status-open {
    background: linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%) !important;
    color: white !important;
  }
  
  &.status-pending, &.status-in-progress {
    background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%) !important;
    color: white !important;
  }
  
  &.status-closed {
    background: linear-gradient(135deg, #10B981 0%, #059669 100%) !important;
    color: white !important;
  }
  
  &.status-escalated {
    background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%) !important;
    color: white !important;
  }
}

/* Attachments */
.attachments-frame {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  border: 2px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--border-radius-lg);
  padding: 16px;
  gap: 12px;
  background: var(--soft-orange);
  min-height: 180px;
}

.nav-arrow {
  border-radius: 50% !important;
  background: rgba(255, 255, 255, 0.9) !important;
  color: var(--warm-orange) !important;
  transition: all 0.2s ease !important;
  
  &:hover {
    background: white !important;
    /* transform: scale(1.1); - uklonjeno za bolje UX */
    box-shadow: var(--warm-shadow-sm) !important;
  }
}

.attachments-track {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 8px 4px;
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

.attachment-item {
  min-width: 120px;
  max-width: 120px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--border-radius-md);
  padding: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover:not(.disabled) {
    /* transform: translateY(...) uklonjeno za bolje UX */
    box-shadow: var(--warm-shadow-md);
    background: white;
    border-color: var(--warm-orange);
  }
  
  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.attachment-thumb {
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(245, 158, 11, 0.3);
  border-radius: var(--border-radius-sm);
  margin-bottom: 8px;
  background: rgba(245, 158, 11, 0.05);
}

.attachment-caption {
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--warm-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-attachments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 120px;
  width: 100%;
  color: rgba(28, 25, 23, 0.5);
}

/* Chat */
.chat-container {
  height: 500px;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  scrollbar-width: thin;
  scrollbar-color: var(--warm-orange) var(--light-orange);
  
  &::-webkit-scrollbar {
    width: 6px;
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

.message-wrapper {
  display: flex;
  margin: 12px 0;
  
  &.message-right {
    justify-content: flex-end;
  }
}

.message-bubble {
  max-width: 75%;
  padding: 12px 16px;
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  
  &.user-message {
    background: var(--warm-gradient);
    color: white;
    border-bottom-right-radius: 6px;
  }
  
  &.operator-message {
    background: rgba(255, 255, 255, 0.95);
    color: var(--warm-text);
    border: 1px solid rgba(245, 158, 11, 0.2);
    border-bottom-left-radius: 6px;
  }
}

.message-text {
  white-space: pre-line;
  font-size: 0.95rem;
  line-height: 1.4;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.8;
  margin-top: 4px;
  text-align: right;
}

.no-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: rgba(28, 25, 23, 0.5);
}

.chat-composer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid rgba(245, 158, 11, 0.1);
  background: var(--warm-surface);
}

.message-input {
  flex: 1;
  
  :deep(.v-field) {
    border-radius: var(--border-radius-md) !important;
    background: rgba(255, 255, 255, 0.9) !important;
  }
  
  :deep(.v-field__prepend-inner .v-icon) {
    color: var(--warm-orange) !important;
  }
}

.send-btn {
  border-radius: 50% !important;
  width: 48px !important;
  height: 48px !important;
  min-width: 48px !important;
  
  /* &:hover:not(:disabled) { transform: scale(1.1); } - uklonjeno za bolje UX */
}

/* Preview Dialog */
.preview-dialog {
  :deep(.v-overlay__content) {
    margin: 24px;
  }
}

.preview-card {
  background: var(--warm-surface) !important;
  border: 1px solid rgba(245, 158, 11, 0.1) !important;
}

.preview-header {
  background: var(--soft-gradient);
  color: var(--warm-brown) !important;
  
  .v-icon {
    color: var(--warm-orange) !important;
  }
}

.preview-content {
  padding: 24px !important;
}

.preview-info {
  background: rgba(245, 158, 11, 0.05);
  border: 1px solid rgba(245, 158, 11, 0.2);
  border-radius: var(--border-radius-md);
  padding: 16px;
  
  p {
    margin: 4px 0;
    color: var(--warm-text);
    
    &:first-child {
      font-weight: 600;
      color: var(--warm-brown);
    }
  }
}

.preview-actions {
  border-top: 1px solid rgba(245, 158, 11, 0.1) !important;
  
  .v-btn {
    border-radius: var(--border-radius-md) !important;
    font-weight: 600 !important;
    text-transform: none !important;
  }
}

/* Media Queries */
@media (max-width: 960px) {
  .ticket-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .back-btn {
    order: 2;
  }
  
  .header-content {
    order: 1;
  }
  
  .details-grid {
    gap: 12px;
  }
  
  .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
  
  .detail-value {
    text-align: left;
  }
  
  .chat-container {
    height: 400px;
  }
  
  .message-bubble {
    max-width: 85%;
  }
}

@media (max-width: 600px) {
  .ticket-title {
    font-size: 1.4rem;
  }
  
  .ticket-subtitle {
    font-size: 0.9rem;
  }
  
  .attachments-frame {
    padding: 12px;
    gap: 8px;
  }
  
  .attachment-item {
    min-width: 100px;
    max-width: 100px;
  }
  
  .attachment-thumb {
    height: 60px;
  }
  
  .message-input {
    :deep(.v-field__input) {
      font-size: 0.9rem;
    }
  }
}
</style>
