<template>
<v-container>
<v-row>
<v-col cols="12" md="8">
<v-card class="mb-4" v-if="arr">
<v-card-title>
{{ arr.title }}
<v-chip class="ml-3" color="primary" variant="tonal">{{ arr.status }}</v-chip>
</v-card-title>
<v-card-text>
<div><strong>Destinacija:</strong> {{ arr.destination?.name }}</div>
<div><strong>Tip:</strong> {{ arr.type }}</div>
<div><strong>Prevoz:</strong> {{ arr.transportType }} | <strong>Smeštaj:</strong> {{ arr.accommodationType }}</div>
<div class="mt-2">{{ arr.summary }}</div>
</v-card-text>
<v-card-actions>
<v-btn :to="`/op/departures/${arr.id}`" prepend-icon="mdi-calendar">Polasci/Itinerer</v-btn>
</v-card-actions>
</v-card>

<v-card>
<v-card-title>Izbor ponuda po kategorijama</v-card-title>
<v-card-text>
<v-row>
<v-col cols="12" md="4">
<v-select label="Transport ponuda" :items="offersBy('TRANSPORT')" item-title="titleOrType" item-value="id" v-model="sel.TRANSPORT" />
</v-col>
<v-col cols="12" md="4">
<v-select label="Smeštaj ponuda" :items="offersBy('ACCOMMODATION')" item-title="titleOrType" item-value="id" v-model="sel.ACCOMMODATION" />
</v-col>
<v-col cols="12" md="4">
<v-select label="Tura/Vodič ponuda" :items="offersBy('TOUR')" item-title="titleOrType" item-value="id" v-model="sel.TOUR" />
</v-col>
</v-row>
<v-btn color="primary" @click="saveSelections">Sačuvaj izbor</v-btn>
</v-card-text>
</v-card>
</v-col>

<v-col cols="12" md="4">
<v-card>
<v-card-title>Akcije</v-card-title>
<v-card-text>
<v-btn class="mb-2" block :to="'/op/inquiries'" prepend-icon="mdi-send">Pošalji upite</v-btn>
<v-btn class="mb-2" block color="success" :disabled="arr?.status!=='READY'" @click="sendForApproval">Pošalji na odobrenje</v-btn>
</v-card-text>
</v-card>


<v-card class="mt-4">
<v-card-title>Ponude (RECEIVED)</v-card-title>
<v-card-text>
<v-list density="compact">
<v-list-item v-for="o in offers" :key="o.id" :title="o.title || o.offerType" :subtitle="`status: ${o.status}`" />
</v-list>
</v-card-text>
</v-card>
</v-col>
</v-row>
</v-container>
</template>

<script setup>
import axios from '@/utils/axiosInstance'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'


const route = useRoute()
const id = Number(route.params.id)
const arr = ref(null)
const offers = ref([])
const sel = ref({ TRANSPORT:null, ACCOMMODATION:null, TOUR:null })


const titleOrType = (o) => o.title || o.offerType
const offersBy = (cat) => offers.value
.filter(o => (cat==='TRANSPORT' ? ['BUS','AIRLINE'].includes(o.offerType) : cat==='ACCOMMODATION' ? ['HOTEL'].includes(o.offerType) : ['TOUR','GUIDE'].includes(o.offerType)))
.map(o => ({ ...o, titleOrType: titleOrType(o) }))


onMounted(async () => {
const { data } = await axios.get(`/arrangements/${id}`)
arr.value = data
const { data: off } = await axios.get(`/offers/for-arrangement/${id}`)
offers.value = off
})

const saveSelections = async () => {
for (const cat of Object.keys(sel.value)) {
if (!sel.value[cat]) continue
await axios.post(`/arrangements/${id}/select-offer`, { category: cat, offerId: sel.value[cat] })
}
const { data } = await axios.get(`/arrangements/${id}`)
arr.value = data
}


const sendForApproval = async () => {
await axios.post('/approvals/send', { arrangementId: id })
const { data } = await axios.get(`/arrangements/${id}`)
arr.value = data
}
</script>