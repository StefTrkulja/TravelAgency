<template>
  <v-container class="py-6">
    <!-- Profile header -->
    <v-card rounded="xl" class="mb-4">
      <v-card-text class="d-flex align-center justify-space-between">
        <div class="d-flex align-center ga-4">
          <v-avatar color="primary" size="44">{{ initials(userDisplayName) }}</v-avatar>
          <div class="flex-1 min-w-260">
            <div class="text-h6">Profil putnika</div>
            <div class="text-medium-emphasis">@{{ username }}</div>
          </div>
        </div>
        <v-btn :loading="loading" prepend-icon="mdi-refresh" variant="tonal" @click="fetchReservations">
          Osvježi
        </v-btn>
      </v-card-text>
    </v-card>

    <!-- Filters -->
    <v-card rounded="xl" class="mb-4">
      <v-card-text class="d-flex flex-wrap ga-3 align-center">
        <v-text-field
          v-model="q"
          prepend-inner-icon="mdi-magnify"
          label="Pretraži (aranžman, destinacija, kod)"
          density="comfortable"
          hide-details
          class="flex-1"
        />
        <v-select
          v-model="status"
          :items="statusItems"
          item-title="label"
          item-value="value"
          label="Status"
          density="comfortable"
          hide-details
          class="min-w-260"
          prepend-inner-icon="mdi-filter-variant"
        />
        <v-chip variant="tonal">Ukupno: {{ filtered.length }}</v-chip>
      </v-card-text>
    </v-card>

    <v-alert v-if="err" type="error" class="mb-4">{{ err }}</v-alert>

    <!-- Empty / Loading -->
    <template v-if="loading">
      <v-skeleton-loader type="article, article, article" />
    </template>
    <template v-else-if="!filtered.length">
      <v-alert type="info" variant="tonal">
        Nema rezervacija za prikaz.
      </v-alert>
    </template>

    <!-- Reservations -->
    <v-row v-else>
      <v-col cols="12" md="6" lg="4" v-for="r in filtered" :key="r.id">
        <v-card rounded="xl" class="h-100 d-flex flex-column">
          <v-card-item>
            <div class="d-flex justify-space-between align-center">
              <div class="text-subtitle-1 font-weight-medium">
                {{ r.arrangement?.title || '—' }}
              </div>
              <v-chip size="small" :color="statusColor(r.status)" variant="elevated">
                {{ statusLabel(r.status) }}
              </v-chip>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ r.arrangement?.destination?.name || '—' }} •
              {{ r.arrangement?.destination?.country?.name || '—' }}
            </div>
          </v-card-item>

          <v-card-text class="pt-0">
            <div class="d-flex flex-wrap ga-2 mb-2">
              <v-chip size="small" prepend-icon="mdi-calendar-range" variant="tonal">
                {{ formatDateRange(r.startsAt, r.endsAt) }}
              </v-chip>
              <v-chip size="small" prepend-icon="mdi-account-multiple" variant="tonal">
                {{ r.numberOfPeople }} + {{ r.numberOfKids }} djeca
              </v-chip>
              <v-chip size="small" prepend-icon="mdi-currency-eur" variant="tonal">
                {{ money(r.totalPrice) }}
              </v-chip>
            </div>
            <div class="d-flex flex-wrap ga-2 mb-2">
              <v-chip size="small" prepend-icon="mdi-pound" variant="text">
                {{ r.code }}
              </v-chip>
            </div>

            <div class="text-body-2" v-if="r.specialRequests">
              <span class="text-medium-emphasis">Zahtjevi:</span>
              {{ r.specialRequests }}
            </div>
            <div class="text-body-2 text-medium-emphasis" v-else>
              Nema posebnih zahtjeva.
            </div>
          </v-card-text>

          <v-divider class="my-1" />

          <v-card-actions class="mt-auto">
            <v-btn variant="text" @click="toggle(r.id)">
              {{ expanded[r.id] ? 'Sakrij detalje' : 'Detalji' }}
            </v-btn>
            <v-spacer />
            <v-btn
              color="error"
              variant="text"
              :disabled="!canCancel(r.status) || cancellingId === r.id"
              :loading="cancellingId === r.id"
              @click="cancel(r.id)"
            >
              Otkaži
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              @click="openArrangement(r.arrangement?.id)"
            >
              Otvori aranžman
            </v-btn>
          </v-card-actions>

          <v-expand-transition>
            <div v-show="expanded[r.id]" class="px-4 pb-4">
              <v-divider class="mb-3" />
              <div class="text-caption text-medium-emphasis mb-1">Kontakt</div>
              <div class="text-body-2">
                {{ r.customer?.name }} {{ r.customer?.surname }} — {{ r.customer?.email }}
              </div>

              <div v-if="r.voucher" class="mt-3">
                <div class="text-caption text-medium-emphasis mb-1">Voucher</div>
                <v-chip size="small" variant="tonal">
                  {{ r.voucher.code }} ({{ r.voucher.discountType }} {{ r.voucher.discountValue }})
                </v-chip>
              </div>
            </div>
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/axiosInstance'
import { store } from '@/utils/store'

/* --- user info --- */
const username = computed(() => store.username || 'guest')
const userDisplayName = computed(() => store.name || store.username || 'Gost')

/* --- state --- */
const loading = ref(false)
const err = ref('')
const rows = ref([])
const q = ref('')
const status = ref('ALL')
const expanded = ref({})
const cancellingId = ref(null)

const statusItems = [
  { label: 'Svi statusi', value: 'ALL' },
  { label: 'Na čekanju', value: 'PENDING' },
  { label: 'Potvrđeno', value: 'CONFIRMED' },
  { label: 'Plaćeno', value: 'PAID' },
  { label: 'Otkazano', value: 'CANCELLED' },
  { label: 'Završeno', value: 'COMPLETED' },
]

/* --- helpers --- */
function money (n) {
  return Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'EUR' })
}
function formatDate (s) {
  if (!s) return '—'
  const d = new Date(s)
  return d.toLocaleDateString()
}
function formatDateRange (a, b) {
  return `${formatDate(a)} – ${formatDate(b)}`
}
function initials (name) {
  return (name || '?')
    .split(' ')
    .map(s => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function statusLabel (s) {
  switch (s) {
    case 'PENDING': return 'Na čekanju'
    case 'CONFIRMED': return 'Potvrđeno'
    case 'PAID': return 'Plaćeno'
    case 'CANCELLED': return 'Otkazano'
    case 'COMPLETED': return 'Završeno'
    default: return s
  }
}
function statusColor (s) {
  switch (s) {
    case 'PENDING': return 'orange'
    case 'CONFIRMED': return 'primary'
    case 'PAID': return 'green'
    case 'CANCELLED': return 'red'
    case 'COMPLETED': return 'teal'
    default: return 'default'
  }
}
function canCancel (s) {
  return s === 'PENDING' || s === 'CONFIRMED'
}

/* --- fetch --- */
async function fetchReservations () {
  loading.value = true
  err.value = ''
  try {
    const { data } = await api.get(`/reservations/user/${username.value}`)
    rows.value = Array.isArray(data) ? data : []
  } catch (e) {
    err.value = e?.response?.data?.error || e.message || 'Greška pri učitavanju.'
  } finally {
    loading.value = false
  }
}

/* --- actions --- */
function toggle (id) {
  expanded.value[id] = !expanded.value[id]
}
const router = useRouter()
function openArrangement (arrangementId) {
  if (!arrangementId) return
  router.push({ name: 'arrangement-public', params: { id: arrangementId } })
}
async function cancel (id) {
  if (!id) return
  cancellingId.value = id
  err.value = ''
  try {
    await api.patch(`/reservations/${id}/cancel`)
    await fetchReservations()
  } catch (e) {
    err.value = e?.response?.data?.error || e.message || 'Otkazivanje nije uspjelo.'
  } finally {
    cancellingId.value = null
  }
}

/* --- filters --- */
const filtered = computed(() => {
  const text = (q.value || '').trim().toLowerCase()
  const st = status.value
  return rows.value.filter(r => {
    const okStatus = st === 'ALL' ? true : r.status === st
    if (!okStatus) return false

    if (!text) return true
    const hay = [
      r.code,
      r.arrangement?.title,
      r.arrangement?.destination?.name,
      r.arrangement?.destination?.country?.name
    ].filter(Boolean).join(' ').toLowerCase()
    return hay.includes(text)
  })
})

onMounted(fetchReservations)
</script>

<style scoped>
/* zamjena za Tailwind klasu min-w-[260px] */
.min-w-260 { min-width: 260px; }

/* sitni dodaci za kartice */
.h-100 { height: 100%; }
</style>
