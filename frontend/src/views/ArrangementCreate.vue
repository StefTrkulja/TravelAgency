<template>
  <v-container>
    <h2>Novi aranžman</h2>

    <v-alert v-if="err" type="error" class="mb-3">{{ err }}</v-alert>

    <!-- Odabrane ponude (sa sumom) -->
    <v-card v-if="selectedOffers.length" class="mb-4 pa-4">
      <div class="text-subtitle-1 mb-2">Odabrane ponude</div>
      <v-table density="compact">
        <thead>
          <tr>
            <th>ID</th><th>Tip</th><th>Naslov</th><th>Cena</th><th>Detalj</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="o in selectedOffers" :key="o.id">
            <td>{{ o.id }}</td>
            <td>{{ o.offerType }}</td>
            <td>{{ o.title || '—' }}</td>
            <td>{{ (o.priceTotal ?? 0).toFixed(2) }} {{ o.currency || 'EUR' }}</td>
            <td>
              <span v-if="o.offerType==='HOTEL'">{{ o.hotelName || '—' }} ({{ o.board || '—' }})</span>
              <span v-else-if="o.offerType==='BUS' || o.offerType==='AIRLINE'">{{ o.transportCompany || '—' }} → {{ o.toLocation || '—' }}</span>
              <span v-else>{{ o.guideLanguage || '—' }} / {{ o.durationHours || '—' }}h</span>
            </td>
          </tr>
        </tbody>
      </v-table>
      <div class="mt-3"><b>Ukupno (suma ponuda):</b> {{ totalSelected.toFixed(2) }} EUR</div>
      <div v-if="inquiry" class="text-caption mt-1">
        Period upita: {{ inquiry.dateFrom }} → {{ inquiry.dateTo }}
      </div>
    </v-card>

    <!-- Forma aranžmana -->
    <v-form v-model="valid" class="mt-4">
      <v-select
        label="Destinacija"
        :items="destinations"
        item-title="name"
        item-value="id"
        v-model="form.destinationId"
      />
      <v-text-field label="Naslov" v-model="form.title" />
      <v-textarea label="Sažetak" v-model="form.summary" />

      <v-text-field
        label="Cena po osobi"
        v-model.number="form.basePricePerPerson"
        type="number"
        hint="Inicijalno postavljeno na sumu ponuda — menjaj po potrebi"
        persistent-hint
      />

      <v-select label="Prevoz" :items="['BUS','PLANE','OWN']" v-model="form.transportType" />
      <v-select label="Smeštaj" :items="['HOTEL','APT','HOSTEL','OTHER']" v-model="form.accommodationType" />
      <v-select label="Tip aranžmana" :items="['DAY_TRIP','MULTI_DAY']" v-model="form.type" />

      <div class="mt-3 d-flex ga-2">
        <v-btn color="primary" :disabled="!valid" :loading="creating" @click="createArrangement(false)">
          Sačuvaj
        </v-btn>
        <v-btn color="secondary" variant="elevated" :disabled="!valid" :loading="creating" @click="createArrangement(true)">
          Sačuvaj i odmah dodaj polazak
        </v-btn>
        <v-btn
          v-if="createdArrangementId"
          variant="outlined"
          :to="{ name:'op-departures', params:{ arrangementId: createdArrangementId }, query: prefillDatesQuery() }"
        >
          Dodaj još polazaka
        </v-btn>
      </div>

      <v-alert v-if="ok" type="success" class="mt-3">{{ ok }}</v-alert>
    </v-form>

    <!-- Već dodati polasci (ako se vraćaš sa Polazaka ili refresha) -->
    <v-card v-if="createdArrangementId" class="mt-6">
      <v-card-title class="px-4 pt-4">Polasci za aranžman #{{ createdArrangementId }}</v-card-title>
      <v-data-table
        :headers="depHeaders"
        :items="departures"
        item-key="id"
        class="px-2 pb-4"
      >
        <template #item.actions="{ item }">
          <v-btn size="small" :to="`/op/itinerary/${item.id}`" prepend-icon="mdi-file-document">Itinerer</v-btn>
        </template>
        <template #no-data>
          <v-alert type="info" class="ma-4">
            Još nema polazaka. Klikni “Dodaj još polazaka”.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup>
import api from '@/utils/axiosInstance'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const valid = ref(false)
const creating = ref(false)
const err = ref('')
const ok = ref('')

const destinations = ref([])
const inquiry = ref(null)
const allOffersForInquiry = ref([])
const selectedOffers = ref([])

const selectedOfferIds = ref([])
const inquiryId = ref(null)
const createdArrangementId = ref(route.query.arrangementId ? Number(route.query.arrangementId) : null)
const departures = ref([])

const form = ref({
  destinationId: null,
  title: '',
  summary: '',
  basePricePerPerson: 0,
  transportType: 'BUS',
  accommodationType: 'HOTEL',
  type: 'MULTI_DAY'
})

const depHeaders = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Start', key: 'startDate' },
  { title: 'End', key: 'endDate' },
  { title: 'Kapacitet', key: 'capacity' },
  { title: '', key: 'actions', sortable:false, width:140 }
]

const totalSelected = computed(() =>
  selectedOffers.value.reduce((sum, o) => sum + Number(o.priceTotal || 0), 0)
)

// helper: izaberi datume (upit > min/max iz ponuda)
function pickStartEnd() {
  let start = inquiry.value?.dateFrom || null
  let end = inquiry.value?.dateTo || null

  if (!start || !end) {
    const starts = selectedOffers.value.map(o => o.availabilityStart).filter(Boolean)
    const ends = selectedOffers.value.map(o => o.availabilityEnd).filter(Boolean)
    if (!start && starts.length) start = starts.sort()[0]
    if (!end && ends.length) end = ends.sort()[ends.length - 1]
  }
  return { start, end }
}

// prefill query za Polaske
function prefillDatesQuery() {
  const { start, end } = pickStartEnd()
  const ret = encodeURIComponent(router.resolve({
    name:'op-arrangements-new',
    query: {
      offerIds: selectedOfferIds.value.join(','),
      inquiryId: inquiryId.value || '',
      arrangementId: createdArrangementId.value
    }
  }).href)
  return {
    startDate: start || '',
    endDate: end || '',
    returnTo: ret
  }
}

function deriveFormFromOffers() {
  if (inquiry.value?.destinationId) form.value.destinationId = inquiry.value.destinationId

  if (!form.value.title) {
    const destName = inquiry.value?.destination?.name || 'Aranžman'
    const period = (inquiry.value?.dateFrom && inquiry.value?.dateTo)
      ? ` (${inquiry.value.dateFrom} → ${inquiry.value.dateTo})`
      : ''
    form.value.title = `${destName}${period}`
  }

  const hasHotel = selectedOffers.value.some(o => o.offerType === 'HOTEL')
  const hasTransportBus = selectedOffers.value.some(o => o.offerType === 'BUS')
  const hasTransportPlane = selectedOffers.value.some(o => o.offerType === 'AIRLINE')

  if (hasTransportPlane) form.value.transportType = 'PLANE'
  else if (hasTransportBus) form.value.transportType = 'BUS'
  else form.value.transportType = 'OWN'

  form.value.accommodationType = hasHotel ? 'HOTEL' : 'OTHER'

  if (inquiry.value?.dateFrom && inquiry.value?.dateTo) {
    const d1 = new Date(inquiry.value.dateFrom)
    const d2 = new Date(inquiry.value.dateTo)
    const diff = Math.round((d2 - d1)/(1000*60*60*24)) + 1
 form.value.type = (diff === 1 && !hasHotel) ? 'DAY_TRIP' : 'MULTI_DAY'
  } else {
    form.value.type = hasHotel ? 'MULTI_DAY' : 'DAY_TRIP'
  }

  form.value.basePricePerPerson = Number(totalSelected.value.toFixed(2))
}

// data loads
async function loadDestinations() {
  try { const { data } = await api.get('/destinations'); destinations.value = data } catch {}
}

async function loadInquiryBasics() {
  if (!inquiryId.value) return
  const { data } = await api.get('/offers/inquiries')
  const found = (data || []).find(x => x.id === Number(inquiryId.value))
  if (found) inquiry.value = found
}

async function loadSelectedOffers() {
  if (!inquiryId.value || !selectedOfferIds.value.length) return
  const { data } = await api.get(`/offers/inquiries/${inquiryId.value}/offers`)
  allOffersForInquiry.value = data || []
  const idset = new Set(selectedOfferIds.value)
  selectedOffers.value = allOffersForInquiry.value.filter(o => idset.has(o.id))
}

async function loadDepartures() {
  if (!createdArrangementId.value) return
  const { data } = await api.get(`/departures/by-arrangement/${createdArrangementId.value}`)
  departures.value = data || []
}

onMounted(async () => {
  const idsStr = String(route.query.offerIds || '')
  selectedOfferIds.value = idsStr.split(',').map(x => Number(x)).filter(Number.isFinite)
  inquiryId.value = route.query.inquiryId ? Number(route.query.inquiryId) : null

  await Promise.all([loadDestinations(), loadInquiryBasics(), loadSelectedOffers()])
  deriveFormFromOffers()
  await loadDepartures()
})

async function createArrangement (goToDepartures) {
  err.value = ''; ok.value = ''; creating.value = true
  try {
    // ako već postoji (vratila si se sa polazaka), samo attach-uj ponude (ako treba) i eventualno idi na Polaske
    if (createdArrangementId.value) {
      // attach ako iz nekog razloga nisi (obično jesi)
      if (selectedOfferIds.value.length) {
        await api.post(`/arrangements/${createdArrangementId.value}/attach-offers`, {
          offerIds: selectedOfferIds.value,
          inquiryId: inquiryId.value
        })
      }
      ok.value = 'Aranžman ažuriran.'
      if (goToDepartures) {
        router.push({ name:'op-departures', params:{ arrangementId: createdArrangementId.value }, query: prefillDatesQuery() })
      } else {
        await loadDepartures()
      }
      return
    }

    // 1) kreiraj aranžman
    const { data } = await api.post('/arrangements', form.value)
    createdArrangementId.value = data.id

    // 2) attach izabrane ponude
    if (selectedOfferIds.value.length) {
      await api.post(`/arrangements/${createdArrangementId.value}/attach-offers`, {
        offerIds: selectedOfferIds.value,
        inquiryId: inquiryId.value
      })
    }

    ok.value = 'Aranžman kreiran i ponude povezane.'
    await loadDepartures()

    // 3) odmah na polaske?
    if (goToDepartures) {
      router.push({ name:'op-departures', params:{ arrangementId: createdArrangementId.value }, query: prefillDatesQuery() })
    }
  } catch (e) {
    const d = e?.response?.data
    err.value = d?.error || d?.errors?.[0]?.message || 'Greška'
  } finally {
    creating.value = false
  }
}
</script>
