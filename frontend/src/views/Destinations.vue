<template>
  <v-container>
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2 class="mb-1">Destinacije</h2>
        <div class="text-body-2 text-medium-emphasis">Upravljanje destinacijama i vezom na države</div>
      </div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Nova destinacija</v-btn>
    </div>

    <v-text-field
      v-model="search"
      prepend-inner-icon="mdi-magnify"
      label="Pretraga naziva…"
      class="mb-3"
      density="comfortable"
      clearable
    />

    <v-alert v-if="err" type="error" class="mb-3">{{ err }}</v-alert>
    <v-alert v-if="ok" type="success" class="mb-3">{{ ok }}</v-alert>

    <v-data-table
      :headers="headers"
      :items="filteredItems"
      :items-per-page="10"
      item-key="id"
      class="elevation-1"
    >
      <template #item.country="{ item }">
        {{ item.country?.name || '—' }}
      </template>

      <template #item.actions="{ item }">
        <v-btn size="small" variant="text" prepend-icon="mdi-pencil" @click="openEdit(item)">Uredi</v-btn>
        <v-btn size="small" color="error" variant="text" prepend-icon="mdi-delete" @click="remove(item)">Obriši</v-btn>
      </template>

      <template #no-data>
        <v-alert type="info" class="ma-4">Nema podataka.</v-alert>
      </template>
    </v-data-table>

    <!-- Dialog create / edit -->
    <v-dialog v-model="dialog.open" max-width="640">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-map-marker</v-icon>
          {{ dialog.mode === 'create' ? 'Nova destinacija' : 'Uredi destinaciju' }}
        </v-card-title>

        <v-card-text>
          <v-form ref="formRef" v-model="formValid">
            <v-text-field
              v-model="form.name"
              :rules="[v => !!v || 'Naziv je obavezan']"
              label="Naziv destinacije"
              density="comfortable"
              variant="outlined"
              class="mb-3"
              autofocus
            />

            <v-select
              v-model="form.countryId"
              :items="countries"
              item-title="name"
              item-value="id"
              label="Država"
              :rules="[v => !!v || 'Država je obavezna']"
              density="comfortable"
              variant="outlined"
              class="mb-1"
              :loading="loadingCountries"
            />

            <div class="text-caption text-medium-emphasis">
              
            </div>

            <v-alert v-if="dialogErr" type="error" class="mt-3">{{ dialogErr }}</v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="closeDialog">Odustani</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">
            Sačuvaj
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from '@/utils/axiosInstance'

const headers = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Naziv', key: 'name' },
  { title: 'Država', key: 'country' },
  { title: '', key: 'actions', sortable: false, width: 180 }
]

const items = ref([])
const countries = ref([])
const loadingCountries = ref(false)

const search = ref('')
const err = ref('')
const ok = ref('')

const dialog = ref({ open: false, mode: 'create' })
const form = ref({ id: null, name: '', countryId: null })
const formRef = ref(null)
const formValid = ref(false)
const dialogErr = ref('')
const saving = ref(false)

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(x => String(x.name).toLowerCase().includes(q))
})

async function loadDestinations() {
  err.value = ''
  try {
    const { data } = await axios.get('/destinations')
    // očekujemo da backend vraća include: country
    items.value = (data || []).map(d => ({
      ...d,
      countryId: d.countryId ?? d.country?.id ?? null
    }))
  } catch (e) {
    err.value = e?.response?.data?.error || 'Greška pri učitavanju destinacija'
  }
}

async function loadCountries() {
  loadingCountries.value = true
  try {
    const { data } = await axios.get('/countries')
    countries.value = data || []
  } catch (e) {
    err.value = e?.response?.data?.error || 'Greška pri učitavanju država'
  } finally {
    loadingCountries.value = false
  }
}

function openCreate() {
  dialog.value = { open: true, mode: 'create' }
  form.value = { id: null, name: '', countryId: null }
  dialogErr.value = ''
}

function openEdit(row) {
  dialog.value = { open: true, mode: 'edit' }
  form.value = {
    id: row.id,
    name: row.name || '',
    countryId: row.country?.id || row.countryId || null
  }
  dialogErr.value = ''
}

function closeDialog() {
  dialog.value.open = false
  saving.value = false
  dialogErr.value = ''
}

async function save() {
  dialogErr.value = ''
  const okValid = await formRef.value?.validate()
  if (!okValid?.valid) return

  saving.value = true
  try {
    const payload = {
      name: (form.value.name || '').trim(),
      countryId: Number(form.value.countryId) || null
    }

    if (dialog.value.mode === 'create') {
      await axios.post('/destinations', payload)
      ok.value = 'Destinacija kreirana.'
    } else {
      await axios.put(`/destinations/${form.value.id}`, payload)
      ok.value = 'Destinacija ažurirana.'
    }

    await loadDestinations()
    closeDialog()
  } catch (e) {
    const msg = e?.response?.data?.error || 'Greška pri čuvanju destinacije'
    dialogErr.value = msg
  } finally {
    saving.value = false
  }
}

async function remove(row) {
  if (!confirm(`Obrisati destinaciju "${row.name}"?`)) return
  err.value = ''
  ok.value = ''
  try {
    await axios.delete(`/destinations/${row.id}`)
    ok.value = 'Destinacija obrisana.'
    await loadDestinations()
  } catch (e) {
    err.value = e?.response?.data?.error || 'Greška pri brisanju'
  }
}

onMounted(async () => {
  await Promise.all([loadCountries(), loadDestinations()])
})
</script>

<style scoped>
/* sitno poliranje */
</style>
