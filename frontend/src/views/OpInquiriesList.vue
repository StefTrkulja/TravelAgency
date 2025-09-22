<template>
  <v-container>
    <h2>Moji upiti</h2>

    <v-text-field
      v-model="q"
      class="mb-2"
      label="Pretraga (destinacija, napomena)"
      prepend-icon="mdi-magnify"
      clearable
    />

    <v-data-table :headers="headers" :items="filtered" :loading="loading">
      <template #item.destination="{ item }">
        <div>{{ item.destination?.name || `#${item.destinationId}` }}</div>
      </template>

      <template #item.dateRange="{ item }">
        <div>{{ item.dateFrom }} → {{ item.dateTo }}</div>
      </template>

      <template #item.status="{ item }">
        <v-chip size="small" :color="item.offerCount ? 'success' : 'warning'" variant="flat">
          {{ item.offerCount ? `Ponuda: ${item.offerCount}` : 'Bez ponuda' }}
        </v-chip>
      </template>

      <template #item.actions="{ item }">
        <v-btn
          color="primary"
          size="small"
          :to="`/op/inquiries/${item.id}/offers`"
          prepend-icon="mdi-eye"
        >
          Pogledaj ponude
        </v-btn>
      </template>

      <template #no-data>
        <v-alert type="info" class="ma-4">
          Još nemaš upita. Pošalji prvi na stranici “Pošalji upite dobavljačima”.
        </v-alert>
      </template>
    </v-data-table>
  </v-container>
</template>

<script setup>
import api from '@/utils/axiosInstance'
import { ref, computed, onMounted } from 'vue'

const headers = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Destinacija', key: 'destination' },
  { title: 'Period', key: 'dateRange' },
  { title: 'Napomena', key: 'notes' },
  { title: 'Status', key: 'status', width: 130 },
  { title: '', key: 'actions', sortable: false, width: 170 }
]

const loading = ref(false)
const rows = ref([])
const q = ref('')

const filtered = computed(() => {
  if (!q.value) return rows.value
  const qq = q.value.toLowerCase()
  return rows.value.filter(r =>
    (r.destination?.name || '').toLowerCase().includes(qq) ||
    (r.notes || '').toLowerCase().includes(qq)
  )
})

async function load() {
  loading.value = true
  try {
    // očekivani backend: GET /api/offers/inquiries  (operator vidi svoje)
    const { data } = await api.get('/offers/inquiries')
    rows.value = data
  } finally { loading.value = false }
}

onMounted(load)
</script>
