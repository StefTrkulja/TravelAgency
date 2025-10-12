<template>
  <v-container class="py-6">
    <!-- HERO -->
    <v-sheet rounded="xl" class="pa-6 mb-6" color="primary" dark>
      <div class="d-flex flex-column flex-md-row align-center justify-space-between ga-4">
        <div>
          <div class="text-h5 text-md-h4 font-weight-bold">Pronađi svoj aranžman</div>
          <div class="opacity-90">Filtriraj po destinaciji, datumu, cijeni i broju putnika.</div>
        </div>
        <v-btn variant="elevated" color="white" text-color="primary" @click="resetAll" prepend-icon="mdi-broom">
          Resetuj filtere
        </v-btn>
      </div>
    </v-sheet>

    <!-- FILTERI -->
    <v-card rounded="xl" elevation="1" class="mb-6">
      <v-card-text>
        <v-row class="ga-2">
          <v-col cols="12" md="4">
            <v-autocomplete
              v-model="filters.destination"
              :items="destinations"
              item-title="name"
              item-value="id"
              label="Destinacija"
              prepend-inner-icon="mdi-map-marker"
              clearable
              hide-details
              density="comfortable"
              @update:search="onDestinationSearch"
            />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field v-model="filters.dateFrom" type="date" label="Datum od"
                          prepend-inner-icon="mdi-calendar-start" hide-details density="comfortable" />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field v-model="filters.dateTo" type="date" label="Datum do"
                          prepend-inner-icon="mdi-calendar-end" hide-details density="comfortable" />
          </v-col>

          <v-col cols="12" md="6">
            <v-slider v-model="filters.priceMax" :min="0" :max="3000" :step="50"
                      label="Maksimalna cijena (po osobi)" class="mt-4" hide-details />
            <div class="text-caption mt-1 text-medium-emphasis">
              Do: <strong>{{ formatMoney(filters.priceMax) }}</strong>
            </div>
          </v-col>

          <v-col cols="12" md="6">
            <v-btn-toggle v-model="sortBy" mandatory class="w-100">
              <v-btn value="relevance" prepend-icon="mdi-star-outline" class="text-none w-33">Relevantnost</v-btn>
              <v-btn value="price-asc" prepend-icon="mdi-sort-ascending" class="text-none w-33">Cijena ⬆</v-btn>
              <v-btn value="price-desc" prepend-icon="mdi-sort-descending" class="text-none w-33">Cijena ⬇</v-btn>
            </v-btn-toggle>
            <div class="text-caption mt-1 text-medium-emphasis">Sortiraj po odabranoj metriki.</div>
          </v-col>
        </v-row>

        <!-- Napredno -->
        <v-expansion-panels class="mt-2">
          <v-expansion-panel>
            <v-expansion-panel-title><v-icon class="mr-2">mdi-tune</v-icon> Napredno</v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-row class="ga-2">
                <v-col cols="12" md="4">
                  <v-text-field v-model.number="filters.travelers" type="number" min="1" label="Broj putnika"
                                prepend-inner-icon="mdi-account-multiple" hide-details density="comfortable" />
                  <div class="text-caption text-medium-emphasis mt-1">
                    Prikazat ćemo aranžmane sa najmanje toliko mjesta (occupancy).
                  </div>
                </v-col>
                <v-col cols="12" md="4">
                  <v-select v-model="filters.accommodationType" :items="accommodationTypes" label="Tip smještaja"
                            prepend-inner-icon="mdi-bed" clearable hide-details density="comfortable" />
                </v-col>
                <v-col cols="12" md="4">
                  <v-select v-model="filters.transportType" :items="transportTypes" label="Tip prevoza"
                            prepend-inner-icon="mdi-bus" clearable hide-details density="comfortable" />
                </v-col>
              </v-row>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Akcije -->
        <div class="d-flex ga-2 mt-6">
          <v-btn color="primary" prepend-icon="mdi-magnify" :loading="loading" @click="search">Pretraži</v-btn>
          <v-btn variant="text" @click="resetAll">Reset</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <!-- REZULTATI -->
    <div class="d-flex align-center justify-space-between mb-2">
      <div class="text-subtitle-1">
        Rezultati: <strong>{{ results.length }}</strong>
        <span v-if="totalCount !== null" class="text-medium-emphasis">/ {{ totalCount }}</span>
      </div>
      <v-btn variant="text" size="small" prepend-icon="mdi-reload" :loading="loading" @click="search">Osvježi</v-btn>
    </div>

    <v-skeleton-loader v-if="loading" type="card@3" class="mb-4" />

    <template v-else>
      <v-alert
        v-if="!results.length"
        type="info"
        class="mb-6"
        variant="tonal"
        title="Nema rezultata"
        text="Proširi datume, povećaj maksimalnu cijenu ili smanji broj putnika."
      />
      <v-row v-else>
        <v-col v-for="a in sortedResults" :key="a.id" cols="12" md="6" lg="4">
          <v-card rounded="xl" elevation="1" class="h-100">
            <v-img :src="a.coverUrl || placeholderImage" height="160" cover class="rounded-t-xl" />
            <v-card-title class="pb-0">{{ a.title }}</v-card-title>
            <v-card-subtitle class="d-flex align-center ga-2">
              <v-icon size="18">mdi-map-marker</v-icon>
              <span>{{ a.destination?.name || a.destination || '—' }}</span>
            </v-card-subtitle>

            <v-card-text>
              <div class="d-flex flex-wrap ga-3">
                <v-chip size="small" variant="tonal" prepend-icon="mdi-calendar-range">
                  {{ formatDateRange(a.dateFrom, a.dateTo) }}
                </v-chip>
                <v-chip size="small" variant="tonal" prepend-icon="mdi-currency-eur">
                  Od {{ formatMoney(a.basePricePerPerson ?? 0) }}
                </v-chip>
                <v-chip size="small" v-if="a.transportType" variant="tonal" prepend-icon="mdi-bus">
                  {{ prettyTransport(a.transportType) }}
                </v-chip>
                <v-chip size="small" v-if="a.accommodationType" variant="tonal" prepend-icon="mdi-bed">
                  {{ prettyAccommodation(a.accommodationType) }}
                </v-chip>
                <v-chip size="small" v-if="a.occupancy != null" variant="tonal" prepend-icon="mdi-account-group">
                  Mjesta: {{ a.occupancy }}
                </v-chip>
              </div>

              <div class="text-body-2 mt-3 text-medium-emphasis three-lines">
                {{ a.summary || a.description || 'Bez opisa.' }}
              </div>
            </v-card-text>

            <v-card-actions class="d-flex justify-space-between">
              <div class="text-caption text-medium-emphasis" v-if="a._clientScore !== undefined">
                Relevance: <strong>{{ a._clientScore.toFixed(2) }}</strong>
              </div>
              <v-spacer />
              <v-btn :to="{ name: 'arrangement-public', params: { id: a.id } }" color="primary" variant="elevated" prepend-icon="mdi-eye">
                    Pogledaj
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import api from '@/utils/axiosInstance'

// UI state
const loading = ref(false)
const results = ref([])
const totalCount = ref(null)
const sortBy = ref('relevance') // 'relevance' | 'price-asc' | 'price-desc'
const placeholderImage = 'https://picsum.photos/800/400?blur=2'

// filteri
const filters = ref({
  destination: null,
  dateFrom: '',
  dateTo: '',
  priceMax: 1500,
  travelers: 1,
  accommodationType: null,
  transportType: null,
})

// šifrarnici — usklađeni s backend ENUM-ovima
const destinations = ref([]) // [{id, name}]
const accommodationTypes = [
  { title: 'Hotel', value: 'HOTEL' },
  { title: 'Apartman', value: 'APT' },
  { title: 'Hostel', value: 'HOSTEL' },
  { title: 'Ostalo', value: 'OTHER' },
]
const transportTypes = [
  { title: 'Autobus', value: 'BUS' },
  { title: 'Avion', value: 'PLANE' },
  { title: 'Vlastiti prevoz', value: 'OWN' },
]

// helpers
function formatMoney(n) {
  return Number(n || 0).toLocaleString(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}
function formatDate(s) {
  if (!s) return '—'
  const d = new Date(s); return d.toLocaleDateString()
}
function formatDateRange(a, b) {
  if (!a && !b) return 'Datumi po dogovoru'
  if (a && !b) return `${formatDate(a)}`
  if (!a && b) return `${formatDate(b)}`
  return `${formatDate(a)} – ${formatDate(b)}`
}
function prettyTransport(t) {
  const m = { BUS: 'Autobus', PLANE: 'Avion', OWN: 'Vlastiti' }; return m[t] || t
}
function prettyAccommodation(t) {
  const m = { HOTEL: 'Hotel', APT: 'Apartman', HOSTEL: 'Hostel', OTHER: 'Ostalo' }; return m[t] || t
}
function resetAll() {
  filters.value = { destination: null, dateFrom: '', dateTo: '', priceMax: 1500, travelers: 1, accommodationType: null, transportType: null }
  sortBy.value = 'relevance'
  search()
}

// relevance (klijent)
function computeClientScore(item) {
  let s = 0
  const f = filters.value
  const title = (item.title || '').toLowerCase()
  const desc = (item.summary || item.description || '').toLowerCase()
  const destName = (item.destination?.name || item.destination || '').toLowerCase()

  if (f.destination) {
    // ako backend vraća ID, client-relevance ide bez destName bonusa; nije kritično
    s += 0.0
  }
  // poklapanje datuma (labavo)
  if (f.dateFrom || f.dateTo) {
    const aStart = item.dateFrom ? new Date(item.dateFrom).getTime() : null
    const aEnd   = item.dateTo   ? new Date(item.dateTo).getTime()   : null
    const fStart = f.dateFrom ? new Date(f.dateFrom).getTime() : null
    const fEnd   = f.dateTo   ? new Date(f.dateTo).getTime()   : null
    const overlaps =
      (aStart === null && aEnd === null) ||
      (fStart === null && fEnd === null) ||
      (aStart !== null && aEnd !== null && fStart !== null && fEnd !== null &&
        Math.max(aStart, fStart) <= Math.min(aEnd, fEnd))
    if (overlaps) s += 0.5
  }
  
  const price = Number(item.basePricePerPerson ?? 0);
  if (!Number.isNaN(price) && price <= (filters.value.priceMax || Infinity)) s += 0.5;

  // blagi bonus ako ima dovoljno mjesta
  if (Number.isFinite(item?.occupancy) && item.occupancy >= (filters.value.travelers || 1)) s += 0.3

  // BONUS: naziv destinacije u naslovu ili opisu
  if (destName) {
    if ((item.title || '').toLowerCase().includes(destName)) s += 0.2
    if ((item.summary || '').toLowerCase().includes(destName)) s += 0.1
  }
  return s
}

const sortedResults = computed(() => {
  const arr = results.value.map(a => ({ ...a, _clientScore: computeClientScore(a) }))
  if (sortBy.value === 'price-asc')  return [...arr].sort((x, y) => (x.basePricePerPerson ?? 0) - (y.basePricePerPerson ?? 0))
  if (sortBy.value === 'price-desc') return [...arr].sort((x, y) => (y.basePricePerPerson ?? 0) - (x.basePricePerPerson ?? 0))
  return [...arr].sort((x, y) => (y._clientScore ?? 0) - (x._clientScore ?? 0))
})

// data loading
async function loadDestinations(q = '') {
  try {
    const { data } = await api.get('/destinations', { params: q ? { q } : undefined })
    const rows = data?.data || data || []
    destinations.value = rows.map(d => ({ id: d.id ?? d._id ?? d.code ?? d.name, name: d.name ?? d.title ?? String(d) }))
  } catch (e) {
    console.warn('Destinations load failed', e)
  }
}
function onDestinationSearch(q) {
  clearTimeout(onDestinationSearch._t); onDestinationSearch._t = setTimeout(() => loadDestinations(q), 250)
}

async function search() {
  loading.value = true
  try {
    const p = {}
    if (filters.value.destination) p.destinationId = filters.value.destination
    if (filters.value.dateFrom)    p.dateFrom = filters.value.dateFrom
    if (filters.value.dateTo)      p.dateTo   = filters.value.dateTo
    if (filters.value.priceMax !== null && filters.value.priceMax !== undefined) {
        p.priceTo = Number(filters.value.priceMax)
    }
    if (filters.value.travelers)   p.travelers = Number(filters.value.travelers) // backend: occupancy >= travelers

    if (filters.value.accommodationType) p.accommodationType = filters.value.accommodationType
    if (filters.value.transportType)     p.transportType     = filters.value.transportType

    // sort – backend: createdAt | dateFrom | price
    if (sortBy.value === 'price-asc')      { p.sortBy = 'price';     p.sortDir = 'ASC' }
    else if (sortBy.value === 'price-desc'){ p.sortBy = 'price';     p.sortDir = 'DESC' }
    else                                   { p.sortBy = 'createdAt'; p.sortDir = 'DESC' }

    // pozovi /arrangements (bez /search i bez paginacije)
    const res = await api.get('/arrangements', { params: p })

    const payload = res?.data
    const rows = payload?.data || payload?.items || (Array.isArray(payload) ? payload : [])
    results.value = rows
    totalCount.value = (payload?.total ?? payload?.count ?? rows.length) ?? rows.length
  } catch (e) {
    console.error('Search failed', e)
    results.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

// auto-pretraga
watch(() => [filters.value.destination, filters.value.dateFrom, filters.value.dateTo, filters.value.priceMax, filters.value.travelers, filters.value.accommodationType, filters.value.transportType],
  () => debounce(search, 200)())
watch(sortBy, () => debounce(search, 80)())

onMounted(async () => { await loadDestinations(); await search() })

function debounce(fn, wait = 200) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait) }
}
</script>

<style scoped>
.opacity-90 { opacity: .9; }
.three-lines { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.w-33 { width: 33.33%; }
</style>
