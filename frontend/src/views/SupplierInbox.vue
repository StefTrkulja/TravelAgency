<template>
  <v-container>
    <h2>Moji upiti i ponude</h2>
    <v-row>
      <v-col cols="12" md="6">
        <v-card class="pa-3">
          <h3>Upiti</h3>
          <v-data-table :headers="inqHdr" :items="inquiries" :items-per-page="10">
            <template #item.actions="{ item }">
              <v-btn size="small" :to="`/sup/offer/new?inquiryId=${item.id}`" color="primary">Odgovori</v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="pa-3">
          <h3>Moje ponude</h3>
          <v-data-table :headers="offHdr" :items="offers" :items-per-page="10" />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import api from '@/utils/axiosInstance'
import { ref, onMounted } from 'vue'

const inquiries = ref([])
const offers = ref([])

const inqHdr = [
  { title:'ID', key:'id' },
  { title:'Destinacija', key:'destination' },
  { title:'Od', key:'dateFrom' },
  { title:'Do', key:'dateTo' },
  { title:'Status', key:'status' },
  { title:'', key:'actions', sortable:false }
]
const offHdr = [
  { title:'ID', key:'id' },
  { title:'Tip', key:'offerType' },
  { title:'Naslov', key:'title' },
  { title:'Cena', key:'priceTotal' },
  { title:'Status', key:'status' }
]

async function load() {
  const { data } = await api.get('/offers/my')
  inquiries.value = data.inquiries
  offers.value = data.offers
}
onMounted(load)
</script>
