<template>
  <v-container>
    <h2>Pošalji upite dobavljačima</h2>

    <v-form v-model="valid">
      <v-autocomplete
        label="Destinacija"
        :items="destOptions"
        item-title="name"
        item-value="id"
        v-model="form.destinationId"
        :rules="[v => !!v || 'Obavezno']"
        :loading="loadingDest"
        @focus="loadDest"
      />

      <v-text-field label="Datum od" type="date" v-model="form.dateFrom" :rules="[v => !!v || 'Obavezno']" />
      <v-text-field label="Datum do" type="date" v-model="form.dateTo" :rules="[v => !!v || 'Obavezno']" />

      <v-textarea label="Napomena (opciono)" v-model="form.notes" auto-grow />

      <v-alert v-if="error" type="error" class="mt-3">{{ error }}</v-alert>
      <v-alert v-if="okMsg" type="success" class="mt-3">{{ okMsg }}</v-alert>

      <v-btn color="primary" class="mt-3" :loading="loading" :disabled="!valid" @click="send">
        Pošalji
      </v-btn>
    </v-form>
  </v-container>
</template>

<script setup>
import api from '@/utils/axiosInstance'
import { ref } from 'vue'

const valid = ref(false)
const loading = ref(false)
const loadingDest = ref(false)
const error = ref('')
const okMsg = ref('')

const form = ref({ destinationId: null, dateFrom: '', dateTo: '', notes: '' })

const destOptions = ref([])
async function loadDest() {
  if (destOptions.value.length) return
  loadingDest.value = true
  try {
    const { data } = await api.get('/destinations')
    destOptions.value = data
  } finally { loadingDest.value = false }
}

async function send() {
  error.value = ''; okMsg.value = ''; loading.value = true
  try {
    const payload = {
      destinationId: Number(form.value.destinationId),
      dateFrom: form.value.dateFrom, // DATEONLY
      dateTo: form.value.dateTo,
      notes: form.value.notes || ''
    }
    if (!payload.destinationId) throw new Error('Odaberi destinaciju')
    if (!payload.dateFrom || !payload.dateTo) throw new Error('Datumi su obavezni')

    await api.post('/offers/inquiries', payload) // ★ bez supplierIds
    okMsg.value = 'Upit uspešno poslat.'
    form.value = { destinationId: null, dateFrom: '', dateTo: '', notes: '' }
  } catch (e) {
    const d = e?.response?.data
    error.value = d?.error || d?.errors?.[0]?.message || e.message || 'Greška'
  } finally { loading.value = false }
}
</script>
