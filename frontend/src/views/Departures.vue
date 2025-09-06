<template>
<v-container>
<h2>Polasci za aranžman #{{ arrangementId }}</h2>
<v-row>
<v-col cols="12" md="4">
<v-card class="pa-4">
<v-text-field label="Datum polaska" type="date" v-model="form.startDate" />
<v-text-field label="Datum povratka" type="date" v-model="form.endDate" />
<v-text-field label="Kapacitet" type="number" v-model.number="form.capacity" />
<v-btn color="primary" class="mt-2" @click="create">Kreiraj polazak</v-btn>
</v-card>
</v-col>
<v-col cols="12" md="8">
<v-data-table :headers="headers" :items="items">
<template #item.actions="{ item }">
<v-btn :to="`/op/itinerary/${item.id}`" size="small" prepend-icon="mdi-file-document">Itinerer</v-btn>
</template>
</v-data-table>
</v-col>
</v-row>
</v-container>
</template>

<script setup>
import axios from '@/utils/axiosInstance'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'


const route = useRoute()
const arrangementId = Number(route.params.arrangementId)
const headers = [ { title:'ID', key:'id' }, { title:'Start', key:'startDate' }, { title:'End', key:'endDate' }, { title:'Kapacitet', key:'capacity' }, { title:'Akcije', key:'actions', sortable:false } ]
const items = ref([])
const form = ref({ startDate:'', endDate:'', capacity:50 })


const load = async () => {
const { data } = await axios.get(`/departures/by-arrangement/${arrangementId}`)
items.value = data
}


const create = async () => {
await axios.post(`/departures/${arrangementId}`, form.value)
form.value = { startDate:'', endDate:'', capacity:50 }
load()
}

onMounted(load)
</script>