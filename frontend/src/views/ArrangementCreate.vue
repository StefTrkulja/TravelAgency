<template>
    <v-container>
        <h2>Novi aranžman</h2>

        <v-form v-model="valid" class="mt-4">

            <v-select label="Destinacija" :items="destinations" item-title="name" item-value="id" v-model="form.destinationId" />
            <v-text-field label="Naslov" v-model="form.title" />

            <v-textarea label="Sažetak" v-model="form.summary" />
            
            <v-text-field label="Cena po osobi" v-model.number="form.basePricePerPerson" type="number" />
          
            <v-select label="Prevoz" :items="['BUS','PLANE','OWN']" v-model="form.transportType" />
            <v-select label="Smeštaj" :items="['HOTEL','APT','HOSTEL','OTHER']" v-model="form.accommodationType" />
            <v-select label="Tip aranžmana" :items="['DAY_TRIP','MULTI_DAY']" v-model="form.type" />
            
            <v-btn class="mt-4" color="primary" :disabled="!valid" @click="save">Sačuvaj</v-btn>
        </v-form>
    </v-container>
</template>

<script setup>
import api from '@/utils/axiosInstance'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// polja tvoje postojeće forme...
const form = ref({
  destinationId: null,
  title: '',
  summary: '',
  basePricePerPerson: 0,
  transportType: 'BUS',        // ili PLANE/OWN
  accommodationType: 'HOTEL',  // ili APT/HOSTEL/OTHER
  type: 'MULTI_DAY'            // ili DAY_TRIP
})

const creating = ref(false)
const ok = ref(''); const err = ref('')

// 1) pročitamo iz URL-a
const selectedOfferIds = ref([])
onMounted(() => {
  const s = String(route.query.offerIds || '')
  selectedOfferIds.value = s
    .split(',')
    .map(x => Number(x))
    .filter(Number.isFinite)
})

// 2) kreiranje + automatski mapping ponuda
async function createArrangement() {
  err.value = ''; ok.value = ''; creating.value = true
  try {
    const { data } = await api.post('/arrangements', form.value)   // tvoj POST
    const arrangementId = data.id

    // mapiraj ponude (ako ih ima)
    for (const oid of selectedOfferIds.value) {
      await api.post(`/arrangements/${arrangementId}/select-offer`, { offerId: oid })
    }

    ok.value = 'Aranžman kreiran. Ponude su povezane.'
    // vodi odmah na polaske
    router.push(`/op/departures/${arrangementId}`)
  } catch (e) {
    const d = e?.response?.data
    err.value = d?.error || d?.errors?.[0]?.message || 'Greška'
  } finally { creating.value = false }
}
</script>
