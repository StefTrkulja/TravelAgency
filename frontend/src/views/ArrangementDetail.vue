<template>
  <div class="d-flex align-center justify-space-between mb-3">
    <h2>Aranžman #{{ id }}</h2>
    <div class="d-flex ga-2">
      <v-chip v-if="arr?.occupancy" color="primary" variant="tonal" prepend-icon="mdi-account-group">
        {{ arr.occupancy }} mjesta
      </v-chip>
      <v-chip :color="statusColor(arr?.status)" variant="flat">{{ arr?.status || '—' }}</v-chip>
      <v-btn color="primary" prepend-icon="mdi-ticket-confirmation" @click="openReservation">Rezerviši</v-btn>
    </div>
  </div>

  <v-container>
    <!-- OSNOVNO -->
    <v-card class="mb-4">
      <v-card-text>
        <v-row>
          <v-col cols="12" md="6">
            <div class="text-subtitle-1">Naslov</div>
            <div class="text-body-1">{{ arr?.title || '—' }}</div>

            <div class="text-subtitle-1 mt-3">Destinacija</div>
            <div class="text-body-1">{{ arr?.destination?.name || '—' }}</div>

            <div class="text-subtitle-1 mt-3">Tip</div>
            <div class="text-body-1">{{ arr?.type || '—' }}</div>

            <div class="text-subtitle-1 mt-3">Cena po osobi</div>
            <div class="text-body-1">{{ money(arr?.basePricePerPerson, 'EUR') }}</div>

            <div class="text-subtitle-1 mt-3">Kapacitet (broj putnika)</div>
            <div class="text-body-1">{{ arr?.occupancy ?? '—' }}</div>
          </v-col>

          <v-col cols="12" md="6">
            <div class="text-subtitle-1">Prevoz</div>
            <div class="text-body-1">{{ prettyTransport(arr?.transportType) }}</div>

            <div class="text-subtitle-1 mt-3">Smeštaj</div>
            <div class="text-body-1">{{ prettyAccommodation(arr?.accommodationType) }}</div>

            <div class="text-subtitle-1 mt-3">Sažetak</div>
            <div class="text-body-2">{{ arr?.summary || '—' }}</div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- CHECKLIST ZA READY -->
    <v-alert v-if="missingCats.length" type="error" variant="tonal" class="mb-4">
      <div class="mb-2"><b>Nedostaje da bi prešlo u READY:</b></div>
      <div class="d-flex flex-wrap ga-2">
        <v-chip color="error" v-for="c in missingCats" :key="c">{{ c }}</v-chip>
      </div>
      <div class="text-caption mt-2">
        Izaberi ponude iz liste ispod i označi ih za odgovarajuću kategoriju.
      </div>
    </v-alert>

    <!-- IZABRANE PONUDE -->
    <v-card class="mb-4">
      <v-card-title class="px-4 pt-4">Izabrane ponude (po kategorijama)</v-card-title>
      <v-card-text>
        <v-table density="compact">
          <thead>
            <tr>
              <th style="width:160px;">Kategorija</th>
              <th>Tip / Naslov</th>
              <th>Detalj</th>
              <th style="width:160px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in chosenRows" :key="row.category">
              <td><b>{{ row.category }}</b></td>

              <!-- Tip / Naslov -->
              <td>
                <div v-if="row.offer">
                  <div>
                    <b>{{ prettyOfferType(row.offer.offerType) }}</b>
                    — {{ row.offer.title || '—' }}
                  </div>
                  <div class="text-caption">
                    {{ money(row.offer.priceTotal, row.offer.currency) }}
                  </div>
                </div>
                <div v-else class="text-error">
                  — nije izabrano —
                  <span class="text-medium-emphasis" v-if="row.category==='TRANSPORT'">
                    (tip: {{ prettyTransport(arr?.transportType) }})
                  </span>
                  <span class="text-medium-emphasis" v-else-if="row.category==='ACCOMMODATION'">
                    (tip: {{ prettyAccommodation(arr?.accommodationType) }})
                  </span>
                </div>
              </td>

              <!-- Detalj -->
              <td>
                <div v-if="row.offer">
                  <div v-if="row.offer.offerType==='HOTEL'">
                    {{ row.offer.hotelName || '—' }},
                    board: {{ row.offer.board || '—' }},
                    ★{{ row.offer.hotelStars ?? '—' }}
                  </div>
                  <div v-else-if="row.offer.offerType==='BUS' || row.offer.offerType==='AIRLINE'">
                    {{ row.offer.transportCompany || '—' }}
                    ({{ row.offer.transportMode || prettyOfferType(row.offer.offerType) }})
                    — {{ [row.offer.fromLocation,row.offer.toLocation].filter(Boolean).join(' → ') || '—' }}
                  </div>
                  <div v-else>
                    {{ row.offer.guideName || '—' }} /
                    {{ row.offer.guideLanguage || '—' }} /
                    {{ row.offer.durationHours ?? '—' }}h
                  </div>
                </div>
              </td>

              <!-- Akcija -->
              <td>
                <v-menu>
                  <template #activator="{ props }">
                    <v-btn v-bind="props" size="x-small" variant="outlined">Promeni izbor</v-btn>
                  </template>
                  <v-list>
                    <v-list-item
                      v-for="o in offersForCategory(row.category)"
                      :key="o.id"
                      @click="selectOffer(row.category, o)"
                    >
                      <v-list-item-title>
                        #{{ o.id }} — {{ prettyOfferType(o.offerType) }} — {{ o.title || '—' }}
                        ({{ money(o.priceTotal, o.currency) }})
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- SVE PRISTIGLE PONUDE -->
    <v-card class="mb-6">
      <v-card-title class="px-4 pt-4">Sve pristigle ponude</v-card-title>
      <v-card-text>
        <v-tabs v-model="tab" bg-color="primary" dark>
          <v-tab value="TRANSPORT">Transport</v-tab>
          <v-tab value="ACCOMMODATION">Smeštaj</v-tab>
          <v-tab value="TOUR">Ture/Vodič</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- Transport -->
          <v-window-item value="TRANSPORT">
            <v-data-table :headers="hTransport" :items="transportOffers">
              <template #item.offerType="{ item }">{{ prettyOfferType(item.offerType) }}</template>
              <template #item.toLocation="{ item }">
                {{ [item.fromLocation,item.toLocation].filter(Boolean).join(' → ') || '—' }}
              </template>
              <template #item.priceTotal="{ item }">{{ money(item.priceTotal, item.currency) }}</template>
              <template #item.actions="{ item }">
                <v-btn size="x-small" @click="selectOffer('TRANSPORT', item)">Izaberi kao TRANSPORT</v-btn>
              </template>
              <template #no-data><v-alert type="info" class="ma-4">Nema ponuda.</v-alert></template>
            </v-data-table>
          </v-window-item>

          <!-- Smještaj -->
          <v-window-item value="ACCOMMODATION">
            <v-data-table :headers="hHotel" :items="hotelOffers">
              <template #item.priceTotal="{ item }">{{ money(item.priceTotal, item.currency) }}</template>
              <template #item.actions="{ item }">
                <v-btn size="x-small" @click="selectOffer('ACCOMMODATION', item)">Izaberi kao SMEŠTAJ</v-btn>
              </template>
              <template #no-data><v-alert type="info" class="ma-4">Nema ponuda.</v-alert></template>
            </v-data-table>
          </v-window-item>

          <!-- Ture -->
          <v-window-item value="TOUR">
            <v-data-table :headers="hTour" :items="tourOffers">
              <template #item.priceTotal="{ item }">{{ money(item.priceTotal, item.currency) }}</template>
              <template #item.actions="{ item }">
                <v-btn size="x-small" @click="selectOffer('TOUR', item)">Izaberi kao TURU</v-btn>
              </template>
              <template #no-data><v-alert type="info" class="ma-4">Nema ponuda.</v-alert></template>
            </v-data-table>
          </v-window-item>
        </v-window>
      </v-card-text>
    </v-card>

    <!-- AKCIJE -->
    <div class="d-flex align-center ga-2">
      <v-btn color="primary" :disabled="arr?.status!=='READY'" @click="sendReady">Pošalji na odobrenje</v-btn>
      <v-chip v-if="arr?.status!=='READY'" color="error" variant="tonal">
        Najpre popuni sve obavezne kategorije (vidi checklist gore).
      </v-chip>
    </div>

    <v-alert v-if="err" type="error" class="mt-3">{{ err }}</v-alert>
    <v-alert v-if="ok" type="success" class="mt-3">{{ ok }}</v-alert>
  </v-container>

  <!-- Rezervacija -->
  <v-dialog v-model="bookOpen" max-width="560">
    <v-card>
      <v-card-title>Rezervacija</v-card-title>
      <v-card-text>
        <v-alert type="error" v-if="bookErr" class="mb-3">{{ bookErr }}</v-alert>
        <v-alert type="success" v-if="bookOk" class="mb-3">{{ bookOk }}</v-alert>

        <v-form v-model="bookValid">
          <v-text-field v-model.number="bookForm.travelers" type="number" min="1" :max="arr?.occupancy || 1"
                        label="Broj putnika" hint="Ne može više od ukupnog kapaciteta." persistent-hint required />
          <v-text-field v-model.trim="bookForm.contactName" label="Ime i prezime" required />
          <v-text-field v-model.trim="bookForm.contactEmail" label="Email" type="email" required />
          <v-text-field v-model.trim="bookForm.phone" label="Telefon (opcionalno)" />
          <v-textarea v-model.trim="bookForm.notes" label="Napomena (opcionalno)" rows="3" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-btn variant="text" @click="bookOpen = false">Otkaži</v-btn>
        <v-spacer />
        <v-btn color="primary" :loading="booking" :disabled="!bookValid" @click="submitReservation">Potvrdi rezervaciju</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import api from '@/utils/axiosInstance'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = Number(route.params.id)

const arr = ref(null)
const offers = ref([])
const err = ref('')
const ok = ref('')
const tab = ref('TRANSPORT')

function asArray(x){ return Array.isArray(x) ? x : [] }

function statusColor(s){
  switch (s) {
    case 'DRAFT': return 'grey'
    case 'READY': return 'blue'
    case 'PENDING': return 'orange'
    case 'ACTIVE': return 'green'
    case 'CHANGES_REQUESTED': return 'red'
    default: return 'grey'
  }
}
function money(v, c='EUR'){ const n = Number(v ?? 0); return `${n.toFixed(2)} ${c}` }

async function loadArrangement(){
  try{ const { data } = await api.get(`/arrangements/${id}`); arr.value = data || null }
  catch{ err.value = 'Greška pri učitavanju aranžmana' }
}
async function loadOffers(){
  try{
    const { data } = await api.get(`/offers/for-arrangement/${id}`, { params:{ scope: 'all' } })
    offers.value = Array.isArray(data) ? data : []
  }catch(e){
    err.value = e?.response?.data?.error || 'Greška pri učitavanju ponuda'
    offers.value = []
  }
}
onMounted(async () => { await Promise.all([loadArrangement(), loadOffers()]) })

/* selections / checklist */
const selectionsByCat = computed(() => {
  const map = {}
  for (const s of asArray(arr.value?.selections)) map[s.category] = s.offer || null
  return map
})
const requiredCats = computed(() =>
  (arr.value?.type === 'DAY_TRIP') ? ['TRANSPORT','TOUR'] : ['TRANSPORT','ACCOMMODATION','TOUR']
)
const missingCats = computed(() => requiredCats.value.filter(c => !selectionsByCat.value[c]))
const chosenRows = computed(() =>
  ['TRANSPORT','ACCOMMODATION','TOUR'].map(cat => ({ category: cat, offer: selectionsByCat.value[cat] || null }))
)

/* offers split */
const hotelOffers     = computed(() => offers.value.filter(o => o.offerType === 'HOTEL'))
const transportOffers = computed(() => offers.value.filter(o => o.offerType === 'BUS' || o.offerType === 'AIRLINE'))
const tourOffers      = computed(() => offers.value.filter(o => ['GUIDE','TOUR','OTHER'].includes(o.offerType)))
function offersForCategory(c){ if (c==='ACCOMMODATION') return hotelOffers.value; if (c==='TRANSPORT') return transportOffers.value; return tourOffers.value }

/* actions */
async function selectOffer(category, offer){
  try{
    await api.post(`/arrangements/${id}/select-offer`, { category, offerId: offer.id })
    ok.value = `Izabrano: ${category} → #${offer.id}`
    await loadArrangement()
  }catch(e){
    const d = e?.response?.data
    err.value = d?.error || d?.errors?.[0]?.message || 'Greška pri izboru ponude'
  }
}
async function sendReady(){
  try{
    await api.post('/approvals/send', { arrangementId: id })
    ok.value = 'Poslato na odobrenje.'
    await loadArrangement()
  }catch(e){
    const d = e?.response?.data
    err.value = d?.error || d?.errors?.[0]?.message || 'Greška pri slanju na odobrenje'
  }
}

/* tabele */
const hTransport = [
  { title:'ID', key:'id', width:80 },
  { title:'Tip', key:'offerType', width:120 },
  { title:'Kompanija', key:'transportCompany' },
  { title:'Ruta', key:'toLocation' },
  { title:'Cena', key:'priceTotal', width:140 },
  { title:'', key:'actions', sortable:false, width:200 },
]
const hHotel = [
  { title:'ID', key:'id', width:80 },
  { title:'Hotel', key:'hotelName' },
  { title:'Board', key:'board', width:120 },
  { title:'Zvezdice', key:'hotelStars', width:120 },
  { title:'Cena', key:'priceTotal', width:140 },
  { title:'', key:'actions', sortable:false, width:200 },
]
const hTour = [
  { title:'ID', key:'id', width:80 },
  { title:'Naslov', key:'title' },
  { title:'Vodič', key:'guideName' },
  { title:'Jezik', key:'guideLanguage', width:120 },
  { title:'Trajanje (h)', key:'durationHours', width:140 },
  { title:'Cena', key:'priceTotal', width:140 },
  { title:'', key:'actions', sortable:false, width:200 },
]

function formatDate(s){ if (!s) return '—'; return new Date(s).toLocaleDateString() }

/* Rezervacija */
const bookOpen  = ref(false)
const bookValid = ref(false)
const bookErr   = ref('')
const bookOk    = ref('')
const booking   = ref(false)
const bookForm  = ref({ travelers:1, contactName:'', contactEmail:'', phone:'', notes:'' })

function openReservation(){
  bookErr.value=''; bookOk.value=''
  bookForm.value = { travelers:1, contactName:'', contactEmail:'', phone:'', notes:'' }
  bookOpen.value = true
}
async function submitReservation(){
  bookErr.value=''; bookOk.value=''
  const t = Number(bookForm.value.travelers)
  if (!Number.isFinite(t) || t < 1) { bookErr.value = 'Unesi ispravan broj putnika.'; return }
  if (arr.value?.occupancy && t > arr.value.occupancy) { bookErr.value = `Maksimalno ${arr.value.occupancy} putnika.`; return }
  if (!bookForm.value.contactName || !bookForm.value.contactEmail) { bookErr.value = 'Ime i email su obavezni.'; return }

  booking.value = true
  try{
    await api.post('/reservations', {
      arrangementId: id,
      travelers: t,
      contactName: bookForm.value.contactName.trim(),
      contactEmail: bookForm.value.contactEmail.trim(),
      phone: bookForm.value.phone?.trim() || null,
      notes: bookForm.value.notes?.trim() || null,
    })
    bookOk.value = 'Zahtjev je poslan. Uskoro ćemo te kontaktirati ✉️'
  }catch(e){
    bookErr.value = e?.response?.data?.error || e?.message || 'Rezervacija nije uspjela.'
  }finally{ booking.value = false }
}

/* pretty helpers */
function prettyTransport(t){ return ({ BUS:'Autobus', AIRLINE:'Avion', PLANE:'Avion', OWN:'Vlastiti prevoz' }[t] || t || '—') }
function prettyAccommodation(t){ return ({ HOTEL:'Hotel', APT:'Apartman', HOSTEL:'Hostel', OTHER:'Ostalo' }[t] || t || '—') }
function prettyOfferType(t){ return ({ BUS:'Autobus', AIRLINE:'Avio prevoz', HOTEL:'Hotel', GUIDE:'Vodič', TOUR:'Tura', OTHER:'Ostalo' }[t] || t || '—') }
</script>
