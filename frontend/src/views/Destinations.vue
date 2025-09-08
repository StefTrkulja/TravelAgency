<template>
  <v-container>
    <h2>Destinacije</h2>
    <v-row>
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <v-text-field label="Naziv" v-model="form.name" :rules="[v => !!v || 'Obavezno']" />
          <v-text-field label="Država" v-model="form.country" :rules="[v => !!v || 'Obavezno']" />
          <v-alert v-if="error" type="error" class="mb-2">{{ error }}</v-alert>
          <v-btn color="primary" :loading="saving" @click="save">Sačuvaj</v-btn>
        </v-card>
      </v-col>

      <v-col cols="12" md="8">
        <v-data-table
          class="elevation-1"
          :headers="headers"
          :items="items"
          :items-per-page="10"
        >
          <template #item.actions="{ item }">
            <v-btn
              icon
              color="error"
              @click="remove(item.id)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import axios from '@/utils/axiosInstance'
import { store } from '@/utils/store'
import { ref, onMounted } from 'vue'

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Naziv', key: 'name' },
  { title: 'Država', key: 'countryName' },
  { title: 'Akcije', key: 'actions', sortable: false }
]

const items = ref([])
const form = ref({ name: '', country: '' })
const error = ref('')
const saving = ref(false)

const load = async () => {
  const { data } = await axios.get('/destinations')
  items.value = data.map(d => ({
    ...d,
    countryName: d.country?.name ?? d.country ?? ''
  }))
}

const save = async () => {
  error.value = ''
  if (!form.value.name || !form.value.country) {
    error.value = 'Naziv i država su obavezni'
    return
  }
  saving.value = true
  try {
    await axios.post('/destinations', {
      ...form.value,
      createdByUsername: store.username
    })
    form.value = { name: '', country: '' }
    await load()
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri čuvanju'
  } finally {
    saving.value = false
  }
}

const remove = async (id) => {
  if (!confirm('Da li ste sigurni da želite da obrišete destinaciju?')) return
  try {
    await axios.delete(`/destinations/${id}`)
    await load()
  } catch (e) {
    error.value = e?.response?.data?.error || 'Greška pri brisanju'
  }
}

onMounted(load)
</script>
