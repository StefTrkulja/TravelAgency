<template>
  <v-container>
    <h2>Napravi ponudu</h2>
    <v-form v-model="valid">
      <v-text-field label="Inquiry ID" v-model.number="inquiryId" type="number" :rules="[v=>!!v||'Obavezno']"/>
      <v-select label="Tip" :items="types" v-model="form.offerType" :rules="[v=>!!v||'Obavezno']"/>
      <v-text-field label="Naslov" v-model="form.title"/>
      <v-textarea label="Uslovi" v-model="form.terms"/>
      <v-text-field label="Cena (EUR)" type="number" v-model.number="form.priceTotal"/>

      <v-btn color="primary" :disabled="!valid" :loading="loading" @click="submit">Pošalji</v-btn>
      <v-alert v-if="msg" type="success" class="mt-3">{{ msg }}</v-alert>
      <v-alert v-if="err" type="error" class="mt-3">{{ err }}</v-alert>
    </v-form>
  </v-container>
</template>

<script setup>
import api from '@/utils/axiosInstance'
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const valid = ref(false)
const loading = ref(false)
const msg = ref(''); const err = ref('')
const types = ['HOTEL','AIRLINE','BUS','GUIDE','OTHER']

const inquiryId = ref(null)
const form = ref({ offerType:'HOTEL', title:'', terms:'', priceTotal:0 })

onMounted(() => { if (route.query.inquiryId) inquiryId.value = Number(route.query.inquiryId) })

async function submit() {
  err.value=''; msg.value=''; loading.value=true
  try {
    await api.post('/offers/submit', { inquiryId: Number(inquiryId.value), ...form.value })
    msg.value = 'Ponuda je poslata.'
  } catch(e) {
    const d = e?.response?.data; err.value = d?.error || d?.errors?.[0]?.message || 'Greška'
  } finally { loading.value=false }
}
</script>
