<template>
  <v-container class="py-8">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <h2 class="text-h5 font-weight-bold">Države</h2>
        <div class="text-medium-emphasis">CRUD država za destinacije</div>
      </div>
      <div class="d-flex ga-2">
        <v-text-field
          v-model="search"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-magnify"
          placeholder="Pretraga po nazivu…"
          style="min-width: 260px"
          @keyup.enter="load"
        />
        <v-btn variant="tonal" prepend-icon="mdi-refresh" @click="load">Osvježi</v-btn>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Nova država</v-btn>
      </div>
    </div>

    <v-alert v-if="err" type="error" class="mb-3">{{ err }}</v-alert>
    <v-alert v-if="ok" type="success" class="mb-3">{{ ok }}</v-alert>

    <v-data-table
      :headers="headers"
      :items="itemsFiltered"
      :items-per-page="10"
      item-key="id"
      class="rounded-xl"
    >
      <template #item.actions="{ item }">
        <v-btn size="x-small" variant="outlined" class="mr-1" @click="openEdit(item)">
          Uredi
        </v-btn>
        <v-btn size="x-small" color="error" variant="tonal" @click="askDelete(item)">
          Obriši
        </v-btn>
      </template>

      <template #no-data>
        <v-alert type="info" class="ma-6">Nema država. Dodaj prvu klikom na “Nova država”.</v-alert>
      </template>
    </v-data-table>

    <!-- Create / Edit dialog -->
    <v-dialog v-model="dlg" max-width="540">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-earth</v-icon>
          {{ editing?.id ? 'Uredi državu' : 'Nova država' }}
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-form v-model="formValid" @submit.prevent="save">
            <v-text-field
              v-model="form.name"
              label="Naziv države"
              :rules="[rRequired]"
              autofocus
              clearable
            />
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="closeDlg">Odustani</v-btn>
          <v-btn color="primary" :disabled="!formValid" :loading="saving" @click="save">
            Sačuvaj
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirm -->
    <v-dialog v-model="confirmDlg" max-width="520">
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2" color="error">mdi-alert</v-icon>
          Brisanje države
        </v-card-title>
        <v-card-text>
          Da li sigurno želiš obrisati državu
          <b>{{ toDelete?.name }}</b>? Ova akcija je nepovratna.
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="confirmDlg=false">Odustani</v-btn>
          <v-btn color="error" :loading="deleting" @click="doDelete">Obriši</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snack" timeout="2500">{{ snackMsg }}</v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/axiosInstance'
import { store } from '@/utils/store'

// jednostavno guard-ovanje (opciono)
if (store.role !== 'ADMIN') {
  // ovdje možeš preusmjeriti ili samo ostaviti prikaz bez akcija
}

const headers = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Naziv', key: 'name' },
  { title: '', key: 'actions', width: 160, sortable: false }
]

const items = ref([])
const search = ref('')
const err = ref('')
const ok = ref('')

// dialog/form state
const dlg = ref(false)
const form = ref({ name: '' })
const formValid = ref(false)
const saving = ref(false)
const editing = ref(null)

// delete state
const confirmDlg = ref(false)
const toDelete = ref(null)
const deleting = ref(false)

// snackbar
const snack = ref(false)
const snackMsg = ref('')
function notify(msg) { snackMsg.value = msg; snack.value = true }

const itemsFiltered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter(c => String(c.name).toLowerCase().includes(q))
})

const rRequired = v => (!!v && String(v).trim().length > 0) || 'Obavezno polje'

async function load() {
  err.value = ''; ok.value = ''
  try {
    const { data } = await api.get('/countries')
    items.value = Array.isArray(data?.data) ? data.data : data
  } catch (e) {
    const d = e?.response?.data
    err.value = d?.error || d?.message || 'Greška pri učitavanju država'
  }
}

function openCreate() {
  editing.value = null
  form.value = { name: '' }
  dlg.value = true
}

function openEdit(item) {
  editing.value = item
  form.value = { name: item.name }
  dlg.value = true
}

function closeDlg() {
  dlg.value = false
  saving.value = false
  formValid.value = false
}

async function save() {
  if (!formValid.value) return
  saving.value = true
  err.value = ''; ok.value = ''

  try {
    if (editing.value?.id) {
      await api.put(`/countries/${editing.value.id}`, { name: form.value.name })
      ok.value = 'Država ažurirana'
      notify(ok.value)
    } else {
      await api.post('/countries', { name: form.value.name })
      ok.value = 'Država kreirana'
      notify(ok.value)
    }
    closeDlg()
    await load()
  } catch (e) {
    const d = e?.response?.data
    err.value = d?.error || d?.message || 'Greška pri čuvanju države'
  } finally {
    saving.value = false
  }
}

function askDelete(item) {
  toDelete.value = item
  confirmDlg.value = true
}

async function doDelete() {
  deleting.value = true
  err.value = ''; ok.value = ''
  try {
    await api.delete(`/countries/${toDelete.value.id}`)
    ok.value = 'Država obrisana'
    notify(ok.value)
    confirmDlg.value = false
    await load()
  } catch (e) {
    const d = e?.response?.data
    err.value = d?.error || d?.message || 'Greška pri brisanju države'
  } finally {
    deleting.value = false
  }
}

onMounted(load)
</script>

<style scoped>
/* suptilno uljepšavanje */
</style>
