<template>
  <v-container>
    <v-row class="mb-2">
      <v-col cols="6"><h2>Moji aranžmani</h2></v-col>
    </v-row>

    <v-alert v-if="err" type="error" class="mb-3">{{ err }}</v-alert>
    <v-alert v-if="ok" type="success" class="mb-3">{{ ok }}</v-alert>

    <v-data-table :headers="headers" :items="items" :loading="loading" item-key="id">
      <template #item.status="{ item }">
        <v-chip :color="statusColor(item.status)" variant="flat" size="small">
          {{ item.status }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          size="x-small"
          variant="outlined"
          :to="{ name:'op-arrangements-detail', params:{ id: item.id } }"
        >
          Otvori
        </v-btn>

        <!-- Pošalji na odobrenje (READY) -->
        <v-btn
          v-if="item.status==='READY'"
          size="x-small"
          color="primary"
          class="ml-2"
          :loading="busyId===item.id"
          @click="sendForApproval(item)"
        >
          Pošalji na odobrenje
        </v-btn>

        <!-- Ugasi (ACTIVE -> INACTIVE) -->
        <v-btn
          v-if="item.status==='ACTIVE'"
          size="x-small"
          color="warning"
          class="ml-2"
          :loading="busyId===item.id"
          @click="deactivate(item)"
        >
          Ugasi
        </v-btn>

        <!-- Obriši (DRAFT) -->
        <v-btn
          v-if="item.status==='DRAFT'"
          size="x-small"
          color="error"
          variant="tonal"
          class="ml-2"
          :loading="busyId===item.id"
          @click="removeArr(item)"
        >
          Obriši
        </v-btn>

        <v-chip v-else-if="item.status==='PENDING'" size="x-small" class="ml-2">Na odobrenju…</v-chip>
      </template>

      <template #no-data>
        <v-alert type="info" class="ma-4">Nema aranžmana.</v-alert>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup>
import axios from '@/utils/axiosInstance'
import { ref, onMounted } from 'vue'

const headers = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Naslov', key: 'title' },
  { title: 'Tip', key: 'type', width: 120 },
  { title: 'Status', key: 'status', width: 140 },
  { title: 'Akcije', key: 'actions', sortable: false, width: 360 }
]

const items = ref([])
const loading = ref(false)
const busyId = ref(null)
const err = ref('')
const ok = ref('')

const load = async () => {
  err.value = ''; ok.value = ''
  loading.value = true
  try {
    const { data } = await axios.get('/arrangements')
    items.value = data
  } catch (e) {
    const d = e?.response?.data
    err.value = d?.error || d?.errors?.[0]?.message || 'Greška pri učitavanju'
  } finally {
    loading.value = false
  }
}

function statusColor(s) {
  switch (s) {
    case 'DRAFT': return 'grey'
    case 'READY': return 'blue'
    case 'PENDING': return 'orange'
    case 'ACTIVE': return 'green'
    case 'CHANGES_REQUESTED': return 'red'
    case 'INACTIVE': return 'grey-darken-1'
    default: return 'grey'
  }
}

async function sendForApproval(item) {
  err.value = ''; ok.value = ''
  if (!confirm(`Poslati aranžman #${item.id} na odobrenje?`)) return
  try {
    busyId.value = item.id
    await axios.post('/approvals/send', { arrangementId: item.id })
    ok.value = `Aranžman #${item.id} poslat na odobrenje.`
    await load()
  } catch (e) {
    const d = e?.response?.data
    err.value = d?.error || d?.errors?.[0]?.message || 'Greška pri slanju na odobrenje'
  } finally {
    busyId.value = null
  }
}

async function deactivate(item) {
  err.value = ''; ok.value = ''
  if (!confirm(`Ugasiti aranžman #${item.id}? Biće prebačen u INACTIVE.`)) return
  try {
    busyId.value = item.id
    // očekuje se backend ruta koja menja status u INACTIVE
    await axios.post(`/arrangements/${item.id}/deactivate`)
    ok.value = `Aranžman #${item.id} je ugašen.`
    await load()
  } catch (e) {
    const d = e?.response?.data
    err.value = d?.error || d?.errors?.[0]?.message || 'Greška pri gašenju aranžmana'
  } finally {
    busyId.value = null
  }
}

async function removeArr(item) {
  err.value = ''; ok.value = ''
  if (!confirm(`Obrisati DRAFT aranžman #${item.id}?`)) return
  try {
    busyId.value = item.id
    await axios.delete(`/arrangements/${item.id}`)
    ok.value = `Aranžman #${item.id} obrisan.`
    await load()
  } catch (e) {
    const d = e?.response?.data
    err.value = d?.error || d?.errors?.[0]?.message || 'Greška pri brisanju'
  } finally {
    busyId.value = null
  }
}

onMounted(load)
</script>
