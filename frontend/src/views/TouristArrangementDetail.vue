<template>
  <v-container class="py-6" v-if="arr">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-3">
      <h1 class="text-h4 text-md-h3">{{ arr.title }}</h1>
      <v-chip
        v-if="arr.occupancy != null"
        size="large"
        prepend-icon="mdi-account-group"
        color="primary"
        variant="tonal"
      >
        {{ arr.occupancy }} mjesta
      </v-chip>
    </div>

    <!-- Hero -->
    <v-card rounded="xl" class="mb-6 overflow-hidden">
      <v-img :src="coverUrl" height="300" cover />
      <div class="px-4 py-3">
        <div class="d-flex flex-wrap ga-2">
          <v-chip size="small" variant="elevated" prepend-icon="mdi-map-marker">
            {{ arr.destination?.name || '—' }}
          </v-chip>
          <v-chip size="small" variant="elevated" prepend-icon="mdi-calendar-range">
            {{ formatDateRange(arr.dateFrom, arr.dateTo) }}
          </v-chip>
          <v-chip size="small" variant="elevated" prepend-icon="mdi-currency-eur">
            Od {{ money(arr.basePricePerPerson) }} po osobi
          </v-chip>
          <v-chip size="small" variant="elevated" prepend-icon="mdi-bus">
            {{ prettyTransport(arr.transportType) }}
          </v-chip>
          <v-chip size="small" variant="elevated" prepend-icon="mdi-bed">
            {{ prettyAccommodation(arr.accommodationType) }}
          </v-chip>
        </div>
        <div class="text-body-2 mt-3 text-medium-emphasis">
          {{ arr.summary || '—' }}
        </div>
      </div>
    </v-card>

    <v-row class="mb-8">
      <!-- Galerija -->
      <v-col cols="12" md="6">
        <v-card rounded="xl">
          <v-card-title>Galerija</v-card-title>
          <v-card-text>
            <v-carousel height="260" hide-delimiter-background :show-arrows="images.length>1">
              <v-carousel-item v-for="(img,i) in images" :key="i">
                <v-img :src="img" cover />
              </v-carousel-item>
            </v-carousel>
            <div v-if="!images.length" class="text-medium-emphasis text-body-2 mt-3">
              Nema dodatih slika. Prikazana je naslovna.
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Kalkulator -->
      <v-col cols="12" md="6">
        <v-card rounded="xl">
          <v-card-title>Kalkulator cijene</v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-text-field
                  v-model.number="calc.adults"
                  type="number"
                  min="1"
                  step="1"
                  label="Broj odraslih"
                  prepend-inner-icon="mdi-account"
                  density="comfortable"
                  hide-details
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="calc.kids"
                  type="number"
                  min="0"
                  step="1"
                  label="Djeca"
                  prepend-inner-icon="mdi-baby-face-outline"
                  density="comfortable"
                  hide-details
                />
              </v-col>

              <v-col cols="12">
                <v-alert v-if="overCapacity" type="error" variant="tonal" class="mt-2">
                  Previše putnika za ovaj aranžman. Maksimalno {{ maxPax }}.
                </v-alert>
              </v-col>

              <!-- Voucher -->
              <v-col cols="12">
                <v-text-field
                  v-model="calc.voucherCode"
                  label="Voucher kod (opciono)"
                  prepend-inner-icon="mdi-ticket-percent-outline"
                  density="comfortable"
                  hide-details
                />
                <div class="text-caption mt-1" :class="voucherStatusClass">
                  {{ voucherMessage }}
                </div>
              </v-col>

              <!-- Pregled izabranih dodataka u kalkulatoru -->
              <v-col cols="12" v-if="extrasChosen.length">
                <div class="text-subtitle-2 mb-1">Dodatne aktivnosti</div>
                <div
                  v-for="row in extrasChosen"
                  :key="row.id"
                  class="d-flex justify-space-between text-body-2 mb-1"
                >
                  <span>{{ row.title }} × {{ row.qty }}</span>
                  <span>{{ money(row.sum) }}</span>
                </div>
              </v-col>

              <v-col cols="12">
                <v-divider class="my-3" />
                <div class="d-flex align-center justify-space-between">
                  <div class="text-medium-emphasis">Ukupno (procjena)</div>
                  <div class="text-h6">{{ money(totalWithVoucherPreview) }}</div>
                </div>
                <div class="text-caption text-medium-emphasis">
                  * Ovo je informativni izračun (voucher primjenjujemo u koraku plaćanja).
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Dodatne aktivnosti (preklop + količina) -->
      <v-col cols="12" class="mt-6">
        <v-card rounded="xl">
          <v-card-title class="d-flex align-center justify-space-between">
            <span>Dodatne aktivnosti</span>
            <span class="text-caption text-medium-emphasis">Izbor utiče na ukupnu cijenu</span>
          </v-card-title>
          <v-divider />
          <v-card-text>
            <v-row v-if="extras.length">
              <v-col v-for="x in extras" :key="x.id" cols="12" md="6">
                <v-card variant="tonal" class="pa-3">
                  <div class="d-flex align-start justify-space-between ga-4">
                    <div class="flex-1">
                      <div class="text-subtitle-1 font-weight-medium">{{ x.title }}</div>
                      <div class="text-body-2 text-medium-emphasis mb-2" v-if="x.description">
                        {{ x.description }}
                      </div>
                      <div class="text-body-2">
                        Cijena: <b>{{ money(x.extraCost) }}</b>
                        <span class="text-caption text-medium-emphasis" v-if="x.perPerson"> / osoba</span>
                      </div>
                    </div>
                    <div class="d-flex align-center ga-2">
                      <v-switch
                        v-model="sel[x.id].enabled"
                        :false-value="false"
                        :true-value="true"
                        hide-details
                        color="primary"
                      />
                    </div>
                  </div>

                  <!-- Količina samo ako NIJE perPerson -->
                  <div class="mt-2" v-if="sel[x.id].enabled && !x.perPerson">
                    <v-text-field
                      v-model.number="sel[x.id].qty"
                      type="number"
                      min="1"
                      :max="maxQtyFor(x)"
                      density="comfortable"
                      hide-details
                      label="Količina"
                      class="mt-1"
                    />
                  </div>
                </v-card>
              </v-col>
            </v-row>
            <v-alert v-else type="info" variant="tonal" text="Nema dodatnih usluga za ovaj aranžman." />
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Karta -->
      <v-col cols="12" class="mt-6">
        <v-card rounded="xl">
          <v-card-title>Karta</v-card-title>
          <v-card-text>
            <div class="ratio ratio-16-9 rounded-lg overflow-hidden">
              <iframe :src="osmEmbedUrl" style="border:0; width:100%; height:100%;" loading="lazy"></iframe>
            </div>
            <div class="text-caption text-medium-emphasis mt-2">
              * OpenStreetMap pretraga po nazivu destinacije.
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Recenzije -->
    <v-card rounded="xl" class="mb-8">
      <v-card-title>Recenzije putnika</v-card-title>
      <v-card-text>
        <v-list v-if="reviews.length">
          <v-list-item v-for="r in reviews" :key="r.id" class="px-0">
            <template #prepend>
              <v-avatar color="primary" size="36">{{ initials(r.authorName) }}</v-avatar>
            </template>
            <v-list-item-title>
              {{ r.authorName }} • <span class="text-medium-emphasis">Ocjena: {{ r.rating }}/5</span>
            </v-list-item-title>
            <v-list-item-subtitle class="mt-1">{{ r.text }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
        <v-alert v-else type="info" variant="tonal" text="Još nema recenzija." />
      </v-card-text>
    </v-card>

    <!-- CTA -->
    <div class="d-flex ga-2">
      <v-btn color="primary" prepend-icon="mdi-ticket-confirmation-outline" @click="openWizard">Rezerviši</v-btn>
      <v-btn variant="text" @click="$router.back()">Nazad</v-btn>
    </div>

    <!-- Wizard -->
    <v-dialog v-model="wizard.open" width="840" persistent>
      <v-card rounded="xl">
        <v-card-title class="d-flex align-center justify-space-between">
          <div class="text-h6">Rezervacija — {{ arr.title }}</div>
          <v-chip v-if="selectedDeparture" size="small" variant="tonal" prepend-icon="mdi-calendar-range">
            {{ formatDateRange(selectedDeparture.startDate, selectedDeparture.endDate) }}
          </v-chip>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-stepper
            v-model="wizard.step"
            :items="steps"
            class="no-stepper-actions"
            prev-text=""
            next-text=""
          >
            <!-- Korak 1 -->
            <template #item.1>
              <v-row>
                <v-col cols="12" md="6">
                  <v-select
                    v-model="wizard.departureId"
                    :items="departures"
                    item-title="label"
                    item-value="id"
                    label="Odaberi polazak"
                    prepend-inner-icon="mdi-calendar-range"
                    :loading="loadingDepartures"
                    hide-details
                  />
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field v-model.number="calc.adults" type="number" min="1" label="Odraslih" hide-details />
                </v-col>
                <v-col cols="6" md="3">
                  <v-text-field v-model.number="calc.kids" type="number" min="0" label="Djeca" hide-details />
                </v-col>
                <v-col cols="12">
                  <v-text-field v-model="wizard.customerUsername" label="Korisničko ime" prepend-inner-icon="mdi-account" hide-details />
                </v-col>
                <v-col cols="12">
                  <v-textarea v-model="wizard.specialRequests" label="Specijalni zahtjevi" rows="2" hide-details />
                </v-col>
                <v-alert
                  v-if="overArrangementCapacity"
                  type="error"
                  variant="tonal"
                  class="mb-3"
                >
                  Nema dovoljno mjesta za ovoliko putnika (maksimalno {{ arrangementCapacity }}).
                </v-alert>
              </v-row>
              <div class="d-flex justify-end mt-4">
                <v-btn color="primary" :disabled="overArrangementCapacity" @click="go(2)">Dalje</v-btn>
              </div>
            </template>

            <!-- Korak 2: dodatne usluge + voucher -->
            <template #item.2>
              <div class="text-subtitle-1 mb-2">Dodatne aktivnosti</div>
              <v-row v-if="extras.length">
                <v-col v-for="x in extras" :key="x.id" cols="12" md="6">
                  <v-card variant="outlined" class="pa-3">
                    <div class="d-flex align-start justify-space-between ga-4">
                      <div class="flex-1">
                        <div class="font-weight-medium">{{ x.title }}</div>
                        <div class="text-caption text-medium-emphasis mb-2" v-if="x.description">{{ x.description }}</div>
                        <div class="text-caption">
                          Cijena: <b>{{ money(x.extraCost) }}</b> <span v-if="x.perPerson">/ osoba</span>
                        </div>
                      </div>
                      <v-switch v-model="sel[x.id].enabled" hide-details color="primary" />
                    </div>
                    <div class="mt-2" v-if="sel[x.id].enabled && !x.perPerson">
                      <v-text-field
                        v-model.number="sel[x.id].qty"
                        type="number"
                        min="1"
                        :max="maxQtyFor(x)"
                        density="comfortable"
                        hide-details
                        label="Količina"
                        class="mt-1"
                      />
                    </div>
                  </v-card>
                </v-col>
              </v-row>
              <v-alert v-else type="info" variant="tonal" text="Nema dodatnih usluga." />

              <v-divider class="my-4" />
              <div class="d-flex ga-3 align-center">
                <v-text-field v-model="calc.voucherCode" label="Voucher kod" hide-details class="flex-grow-1" />
                <v-btn :loading="wizard.applyingVoucher" @click="applyVoucherOnServer" variant="tonal">
                  Primijeni voucher
                </v-btn>
              </div>

              <div class="d-flex justify-space-between mt-4">
                <v-btn variant="text" @click="go(1)">Nazad</v-btn>
                <v-btn color="primary" @click="go(3)">Dalje</v-btn>
              </div>
            </template>

            <!-- Korak 3: pregled & plaćanje -->
            <template #item.3>
              <v-row>
                <v-col cols="12" md="7">
                  <div class="text-subtitle-1 mb-2">Pregled narudžbine</div>
                  <v-list density="compact">
                    <v-list-item>
                      <v-list-item-title>Odraslih</v-list-item-title>
                      <v-list-item-subtitle>{{ calc.adults }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Djeca</v-list-item-title>
                      <v-list-item-subtitle>{{ calc.kids }}</v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Usluge</v-list-item-title>
                      <v-list-item-subtitle>
                        <span v-if="!extrasChosen.length" class="text-medium-emphasis">—</span>
                        <ul v-else class="pl-4">
                          <li v-for="row in extrasChosen" :key="row.id">
                            {{ row.title }} × {{ row.qty }} — {{ money(row.sum) }}
                          </li>
                        </ul>
                      </v-list-item-subtitle>
                    </v-list-item>
                    <v-list-item>
                      <v-list-item-title>Voucher</v-list-item-title>
                      <v-list-item-subtitle>
                        <span v-if="!appliedVoucher">—</span>
                        <span v-else>{{ appliedVoucher.code }} ({{ appliedVoucher.discountType }} {{ appliedVoucher.discountValue }})</span>
                      </v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-col>
                <v-col cols="12" md="5">
                  <v-card variant="tonal">
                    <v-card-text>
                      <div class="d-flex justify-space-between mb-1">
                        <span>Osnovica</span><b>{{ money(subtotal) }}</b>
                      </div>
                      <div class="d-flex justify-space-between mb-1">
                        <span>Dodatne usluge</span><b>{{ money(extrasTotal) }}</b>
                      </div>
                      <div class="d-flex justify-space-between mb-1" v-if="appliedVoucher">
                        <span>Voucher</span><b>-{{ money(voucherDiscountAmount) }}</b>
                      </div>
                      <v-divider class="my-2" />
                      <div class="d-flex justify-space-between">
                        <span class="text-medium-emphasis">Za platiti</span>
                        <div class="text-h6">{{ money(finalTotal) }}</div>
                      </div>
                    </v-card-text>
                  </v-card>
                  <div class="mt-4 d-flex ga-2">
                    <v-btn variant="text" @click="go(2)">Nazad</v-btn>
                    <v-btn color="primary" :loading="wizard.submitting" @click="submitReservation">
                      Plati i rezerviši
                    </v-btn>
                  </div>
                </v-col>
              </v-row>
            </template>
          </v-stepper>

          <v-alert v-if="wizard.err" type="error" class="mt-3">{{ wizard.err }}</v-alert>
          <v-alert v-if="wizard.ok" type="success" class="mt-3">{{ wizard.ok }}</v-alert>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>

  <v-container v-else class="py-10">
    <v-skeleton-loader type="article, image" />
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '@/utils/axiosInstance'

const route = useRoute()
const router = useRouter()
const id = Number(route.params.id)

const arr = ref(null)
const images = ref([])
const reviews = ref([])
const extras = ref([])
const departures = ref([])
const loadingDepartures = ref(false)

const coverUrl = computed(() => images.value[0] || 'https://picsum.photos/1200/600')

const arrangementCapacity = computed(() => Number(arr.value?.occupancy || 0))
const overArrangementCapacity = computed(() =>
  arrangementCapacity.value > 0 && pax.value > arrangementCapacity.value
)

const calc = ref({ adults: 1, kids: 0, voucherCode: '' })
const wizard = ref({
  open: false,
  step: 1,
  departureId: null,
  customerUsername: '',
  specialRequests: '',
  applyingVoucher: false,
  submitting: false,
  err: '',
  ok: ''
})

const appliedVoucher = ref(null)
const tmpReservationId = ref(null)

// Kapacitet / over-capacity
const maxPax = computed(() => {
  const occ = Number(arr.value?.occupancy)
  return Number.isFinite(occ) ? occ : Infinity
})
const overCapacity = computed(() => pax.value > maxPax.value)

// Voucher preview
const voucherPreview = ref(null)
const voucherMsg = ref('')
let voucherTimer = null

// map selekcija
const sel = ref({})

// Utils
function money (n) { return Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'EUR' }) }
function formatDate (s) { if (!s) return '—'; return new Date(s).toLocaleDateString() }
function formatDateRange (a, b) { return `${formatDate(a)} – ${formatDate(b)}` }
function prettyTransport (t) { const m = { BUS: 'Autobus', AIRLINE: 'Avion', PLANE: 'Avion', OWN: 'Vlastiti' }; return m[t] || t }
function prettyAccommodation (t) { const m = { HOTEL: 'Hotel', APT: 'Apartman', HOSTEL: 'Hostel', OTHER: 'Ostalo' }; return m[t] || t }
function initials (name) { return (name || '?').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase() }

const kidsDiscountPretty = computed(() => {
  const v = Number(arr.value?.kidsDiscount ?? 0)
  if (!v) return 'nema popusta'
  return v <= 1 ? `${v * 100}%` : `${v}%`
})

const osmEmbedUrl = computed(() => {
  const q = encodeURIComponent(arr.value?.destination?.name || '')
  return `https://www.openstreetmap.org/export/embed.html?bbox=&layer=mapnik&marker=&search=${q}`
})

// Loaders
async function loadArrangement () { const { data } = await api.get(`/arrangements/${id}`); arr.value = data }
async function loadAssets () { images.value = [arr.value?.coverUrl || 'https://picsum.photos/1200/600?blur=2'] }
async function loadExtras () {
  try {
    const r = await api.get(`/arrangements/${id}/extras`)
    extras.value = Array.isArray(r.data) ? r.data : []
    for (const x of extras.value) sel.value[x.id] = { enabled: false, qty: x.perPerson ? pax.value : 1 }
  } catch { extras.value = [] }
}
async function loadReviews () {
  try {
    const r = await api.get(`/reviews`, { params: { arrangementId: id } })
    reviews.value = Array.isArray(r.data) ? r.data : []
  } catch { reviews.value = [] }
}
async function loadDepartures () {
  loadingDepartures.value = true
  try {
    const { data } = await api.get(`/departures/by-arrangement/${id}`)
    departures.value = (data || []).map(d => ({ ...d, label: formatDateRange(d.startDate, d.endDate) }))
    if (!wizard.value.departureId && departures.value[0]) wizard.value.departureId = departures.value[0].id
  } finally { loadingDepartures.value = false }
}

onMounted(async () => {
  await loadArrangement()
  await Promise.all([loadAssets(), loadExtras(), loadReviews(), loadDepartures()])
})

// Pax & prices
const pax = computed(() =>
  Math.max(1, Number(calc.value.adults || 0)) +
  Math.max(0, Number(calc.value.kids || 0))
)
const basePrice = computed(() => Number(arr.value?.basePricePerPerson || 0))
const kidsDiscountPct = computed(() => {
  const kd = Number(arr.value?.kidsDiscount || 0)
  return kd > 1 ? (kd / 100) : kd
})
const subtotal = computed(() => {
  const base = basePrice.value
  const adultPart = base * Math.max(1, Number(calc.value.adults || 0))
  const kidsPart = base * Math.max(0, Number(calc.value.kids || 0)) * (1 - kidsDiscountPct.value)
  return adultPart + kidsPart
})

// Extras totals
function qtyFor (x) { const s = sel.value[x.id] || { enabled: false, qty: 1 }; if (!s.enabled) return 0; return x.perPerson ? pax.value : Math.max(1, Number(s.qty || 1)) }
function sumFor (x) { const unit = Number(x.extraCost || 0); return unit * qtyFor(x) }
const extrasChosen = computed(() =>
  extras.value.filter(x => (sel.value[x.id]?.enabled)).map(x => ({ id: x.id, title: x.title, qty: qtyFor(x), sum: sumFor(x) }))
)
const extrasTotal = computed(() => extrasChosen.value.reduce((s, r) => s + r.sum, 0))

// Totals + voucher preview
const totalNoVoucher = computed(() => subtotal.value + extrasTotal.value)

// Voucher: debounce & exact match
watch(
  () => calc.value.voucherCode,
  () => { clearTimeout(voucherTimer); voucherTimer = setTimeout(checkVoucher, 350) },
  { immediate: true }
)

async function checkVoucher () {
  voucherPreview.value = null
  voucherMsg.value = ''
  const codeRaw = (calc.value.voucherCode || '').trim()
  if (!codeRaw) return

  const code = codeRaw.toUpperCase()
  try {
    const { data } = await api.get('/vouchers/lookup', { params: { search: code, limit: 50 } })
    const rows = Array.isArray(data) ? data : []
    const hit = rows.find(x => (x.code || '').toUpperCase() === code)
    if (!hit) { voucherMsg.value = 'Nevažeći voucher kod'; return }

    let v = hit
    try { const full = await api.get(`/vouchers/${hit.id}`); v = full.data || hit } catch {}

    const today = new Date()
    const start = v.validFrom ? new Date(v.validFrom + 'T00:00:00') : null
    const end = v.validTo ? new Date(v.validTo + 'T23:59:59') : null
    if (v.isUsed) { voucherMsg.value = 'Voucher je već iskorišten'; return }
    if (start && today < start) { voucherMsg.value = 'Voucher nije još važeći'; return }
    if (end && today > end) { voucherMsg.value = 'Voucher je istekao'; return }

    voucherPreview.value = v
    voucherMsg.value = ''
  } catch {
    voucherPreview.value = null
    voucherMsg.value = 'Nevažeći voucher kod'
  }
}

const voucherStatusClass = computed(() => {
  const code = (calc.value.voucherCode || '').trim()
  if (!code) return 'text-medium-emphasis'
  return voucherPreview.value ? 'text-success' : 'text-error'
})
const voucherMessage = computed(() => {
  const code = (calc.value.voucherCode || '').trim()
  if (!code) return `Djeca: popust ${kidsDiscountPretty.value}`
  if (voucherMsg.value) return voucherMsg.value
  if (voucherPreview.value) {
    const v = voucherPreview.value
    return `Voucher OK — ${v.discountType} ${v.discountValue}`
  }
  return 'Nevažeći voucher kod'
})

const totalWithVoucherPreview = computed(() => {
  const base = totalNoVoucher.value
  const v = voucherPreview.value
  if (!v) return base
  if (v.discountType === 'PERCENT') {
    const pct = Math.max(0, Number(v.discountValue || 0)) / 100
    return Math.max(0, Number((base * (1 - pct)).toFixed(2)))
  }
  return Math.max(0, Number((base - Number(v.discountValue || 0)).toFixed(2)))
})

const voucherDiscountAmount = computed(() => {
  if (!appliedVoucher.value) return 0
  const v = appliedVoucher.value
  if (v.discountType === 'PERCENT') return totalNoVoucher.value * (Number(v.discountValue || 0) / 100)
  return Number(v.discountValue || 0)
})
const finalTotal = computed(() => Math.max(0, Number((totalNoVoucher.value - voucherDiscountAmount.value).toFixed(2))))

// Helpers
const steps = [{ title: 'Podaci' }, { title: 'Usluge' }, { title: 'Pregled & plaćanje' }]
function openWizard () { wizard.value.open = true; wizard.value.step = 1; wizard.value.err = ''; wizard.value.ok = ''; appliedVoucher.value = null; tmpReservationId.value = null }
function go (n) {
  if (n === 2 && overArrangementCapacity.value) {
    wizard.value.err = `Nema dovoljno mjesta (maksimalno ${arrangementCapacity.value}).`
    return
  }
  wizard.value.step = n
}
const selectedDeparture = computed(() => departures.value.find(d => d.id === wizard.value.departureId) || null)
function maxQtyFor (x) { return x.perPerson ? pax.value : 99 }

// Reservation flow
async function ensureReservationExists () {
  if (overCapacity.value) throw new Error(`Broj putnika (${pax.value}) prelazi kapacitet (${maxPax.value}).`)
  if (tmpReservationId.value) return tmpReservationId.value
  const activities = extrasChosen.value.filter(r => r.qty > 0).map(r => ({ activityId: r.id, qty: r.qty }))

  const payload = {
    arrangementId: id,
    customerUsername: (wizard.value.customerUsername || '').trim() || 'guest',
    numberOfPeople: pax.value,
    numberOfKids: Math.max(0, Number(calc.value.kids || 0)),
    specialRequests: wizard.value.specialRequests || '',
    departureId: wizard.value.departureId || undefined,
    activities
  }
  const { data } = await api.post('/reservations', payload)
  tmpReservationId.value = data?.id
  return tmpReservationId.value
}

async function applyVoucherOnServer () {
  wizard.value.err = ''; wizard.value.ok = '';
  if (overCapacity.value) { wizard.value.err = `Previše putnika. Maksimalno ${maxPax.value}.`; return }
  wizard.value.applyingVoucher = true
  try {
    const code = (calc.value.voucherCode || '').trim()
    if (!code) throw new Error('Unesi voucher kod')
    const rid = await ensureReservationExists()
    const { data } = await api.post('/vouchers/apply', { reservationId: rid, code })
    appliedVoucher.value = data?.voucher || data
    wizard.value.ok = 'Voucher primijenjen.'
  } catch (e) {
    wizard.value.err = e?.response?.data?.error || 'Neispravan ili nevažeći voucher kod.'
    appliedVoucher.value = null
  } finally {
    wizard.value.applyingVoucher = false
  }
}

async function submitReservation () {
  wizard.value.err = ''; wizard.value.ok = '';
  if (overCapacity.value) { wizard.value.err = `Previše putnika. Maksimalno ${maxPax.value}.`; return }
  wizard.value.submitting = true
  try {
    const rid = await ensureReservationExists()
    await api.patch(`/reservations/${rid}/confirm`)
    wizard.value.ok = 'Plaćanje uspješno. Rezervacija potvrđena.'
  } catch (e) {
    wizard.value.err = e?.response?.data?.error || e.message || 'Transakcija nije uspjela.'
  } finally {
    wizard.value.submitting = false
  }
}
</script>

<style scoped>
.ratio { position: relative; width: 100%; }
.ratio-16-9 { padding-top: 56.25%; }
.ratio > iframe, .ratio > img, .ratio > div { position: absolute; top: 0; left: 0; width: 100%; height: 100%; }

/* sakrij default PREVIOUS/NEXT u v-stepperu */
:deep(.no-stepper-actions .v-stepper-actions),
:deep(.no-stepper-actions .v-stepper__actions) {
  display: none !important;
}
</style>
