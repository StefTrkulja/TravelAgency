<template>
  <v-container>
    <h2>Ponude za upit #{{ inquiryId }}</h2>

    <v-alert v-if="err" type="error" class="mb-3">{{ err }}</v-alert>

    <v-row>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <div class="text-subtitle-1 mb-1">Odabrano</div>
          <div class="mb-2">Smeštaj: <b>{{ picks.hotel?.title || '—' }}</b></div>
          <div class="mb-2">Prevoz: <b>{{ picks.transport?.title || '—' }}</b></div>
          <div class="mb-4">Tura: <b>{{ picks.tour?.title || '—' }}</b></div>

          <v-btn
            color="primary"
            :disabled="!canProceed"
            :to="nextLink"
            prepend-icon="mdi-arrow-right"
          >
            Kreiraj aranžman
          </v-btn>
          <div class="text-caption mt-2">
            * Izbor nije obavezan za sve tri kategorije (npr. jednodnevno: prevoz + tura).
          </div>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-tabs v-model="tab" bg-color="primary" dark>
          <v-tab value="HOTEL">Smeštaj</v-tab>
          <v-tab value="TRANSPORT">Prevoz</v-tab>
          <v-tab value="TOUR">Ture/Vodič</v-tab>
        </v-tabs>

        <v-window v-model="tab">
          <!-- HOTEL -->
          <v-window-item value="HOTEL">
            <v-data-table :headers="hHotel" :items="hotels">
              <template #item.actions="{ item }">
                <v-btn size="small" @click="picks.hotel = item" :disabled="picks.hotel?.id===item.id">
                  Izaberi
                </v-btn>
              </template>
              <template #no-data>
                <v-alert type="info" class="ma-4">Nema ponuda.</v-alert>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- TRANSPORT (BUS/AIRLINE) -->
          <v-window-item value="TRANSPORT">
            <v-data-table :headers="hTransport" :items="transport">
              <template #item.actions="{ item }">
                <v-btn size="small" @click="picks.transport = item" :disabled="picks.transport?.id===item.id">
                  Izaberi
                </v-btn>
              </template>
              <template #no-data>
                <v-alert type="info" class="ma-4">Nema ponuda.</v-alert>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- TOUR/GUIDE -->
          <v-window-item value="TOUR">
            <v-data-table :headers="hTour" :items="tours">
              <template #item.actions="{ item }">
                <v-btn size="small" @click="picks.tour = item" :disabled="picks.tour?.id===item.id">
                  Izaberi
                </v-btn>
              </template>
              <template #no-data>
                <v-alert type="info" class="ma-4">Nema ponuda.</v-alert>
              </template>
            </v-data-table>
          </v-window-item>
        </v-window>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import api from '@/utils/axiosInstance'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const inquiryId = Number(route.params.inquiryId)

const err = ref('')
const tab = ref('HOTEL')
const rows = ref([])

// grupe po tipu ponude
const hotels = computed(() => rows.value.filter(r => r.offerType === 'HOTEL'))
const transport = computed(() => rows.value.filter(r => r.offerType === 'BUS' || r.offerType === 'AIRLINE'))
const tours = computed(() => rows.value.filter(r => r.offerType === 'GUIDE' || r.offerType === 'OTHER'))

// izbori
const picks = ref({ hotel: null, transport: null, tour: null })

// kolone
const hHotel = [
  { title: 'Naslov', key: 'title' },
  { title: 'Cena', key: 'priceTotal' },
  { title: 'Hotel', key: 'hotelName' },
  { title: 'Board', key: 'board' },
  { title: '', key: 'actions', sortable: false, width: 120 }
]
const hTransport = [
  { title: 'Naslov', key: 'title' },
  { title: 'Kompanija', key: 'transportCompany' },
  { title: 'Relacija', key: 'toLocation' },
  { title: 'Cena', key: 'priceTotal' },
  { title: '', key: 'actions', sortable: false, width: 120 }
]
const hTour = [
  { title: 'Naslov', key: 'title' },
  { title: 'Jezik', key: 'guideLanguage' },
  { title: 'Trajanje(h)', key: 'durationHours' },
  { title: 'Cena', key: 'priceTotal' },
  { title: '', key: 'actions', sortable: false, width: 120 }
]

// dozvola dugmeta
const canProceed = computed(() => !!(picks.value.hotel || picks.value.transport || picks.value.tour))

// ✔ formiraj listu izabranih ID-jeva
const selectedIds = computed(() =>
  [picks.value.hotel?.id, picks.value.transport?.id, picks.value.tour?.id]
    .filter(Boolean)
    .join(',')
)

// ✔ router-link objekat (po imenu rute), sa query paramima
const nextLink = computed(() => ({
  name: 'op-arrangements-new',
  query: { offerIds: selectedIds.value, inquiryId }
}))

// učitavanje ponuda za upit
async function load() {
  try {
    const { data } = await api.get(`/offers/inquiries/${inquiryId}/offers`)
    rows.value = data
  } catch (e) {
    const d = e?.response?.data
    err.value = d?.error || d?.errors?.[0]?.message || 'Greška pri učitavanju'
  }
}
onMounted(load)
</script>
