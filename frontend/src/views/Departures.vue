<template>
<v-container>
<h2>Polasci za aranžman #{{ arrangementId }}</h2>
<v-row>
<v-col cols="12" md="4">
<v-card class="pa-4">
<v-text-field label="Datum polaska" type="date" v-model="form.startDate" />
<v-text-field label="Datum povratka" type="date" v-model="form.endDate" :disabled="dayTrip" />
<v-text-field label="Kapacitet" type="number" v-model.number="form.capacity" />
<v-btn color="primary" class="mt-2" @click="create"
      :disabled="dayTrip && items.length > 0">Kreiraj polazak</v-btn>
<div v-if="dayTrip && items.length > 0" class="text-caption mt-1">
  Jednodnevni aranžman može imati samo jedan polazak.
  Izmeni postojeći ako je potrebno.
 </div></v-card>
</v-col>
<v-col cols="12" md="8">
<v-data-table :headers="headers" :items="items">

<template #item.actions="{ item }">
    <v-btn :to="{ name: 'op-itinerary', params: { departureId: item.id } }"
        size="small" prepend-icon="mdi-file-document">Itinerer</v-btn>
</template>

</v-data-table>
</v-col>
</v-row>
</v-container>
</template>

<script setup>
import axios from '@/utils/axiosInstance'
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const arrangementId = Number(route.params.arrangementId)
const headers = [
  { title:'ID', key:'id' },
  { title:'Start', key:'startDate' },
  { title:'End', key:'endDate' },
  { title:'Kapacitet', key:'capacity' },
  { title:'Akcije', key:'actions', sortable:false }
]
const items = ref([])

const arrangement = ref(null)
const dayTrip = computed(() => arrangement.value?.type === 'DAY_TRIP')

// prefill iz query
const form = ref({
  startDate: String(route.query.startDate || ''),
  endDate: String(route.query.endDate || ''),
  capacity: Number(route.query.capacity || 50)
})

watch(() => form.value.startDate, (v) => {
  if (dayTrip.value) form.value.endDate = v || ''
})

// “nazad” URL (npr. /op/arrangements/new?... )
const returnTo = route.query.returnTo ? decodeURIComponent(String(route.query.returnTo)) : null

const load = async () => {
  const { data } = await axios.get(`/departures/by-arrangement/${arrangementId}`)
  items.value = data
}

const loadArrangement = async () => {
  const { data } = await axios.get(`/arrangements/${arrangementId}`)
  arrangement.value = data
}

const create = async () => {
  await axios.post(`/departures/${arrangementId}`, {
     startDate: form.value.startDate,
    endDate: dayTrip.value ? form.value.startDate : form.value.endDate,
    capacity: Number(form.value.capacity || 0)
  })
  await load()
  // posle kreiranja — vrati nazad, ako je traženo
  if (returnTo) router.push(returnTo)
  else form.value = { startDate:'', endDate:'', capacity:50 }
}

onMounted(async () => {
  await Promise.all([loadArrangement(), load()])
  // Ako dođemo bez query, preflekuj iz tipa aranžmana
  if (dayTrip.value && form.value.startDate && !form.value.endDate) {
    form.value.endDate = form.value.startDate
  }
})
</script>
