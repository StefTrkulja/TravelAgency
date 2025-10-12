<template>
  <div class="app-bg">
    <v-container class="page py-8">

      <!-- Header -->
      <div class="topbar d-flex align-center justify-space-between mb-8">
        <div>
          <h2 class="text-h5 text-md-h4 font-weight-bold mb-1">Vaučeri</h2>
          <p class="text-medium-emphasis mb-0">Kreiranje i upravljanje voucherima</p>
        </div>
        <v-btn color="primary" variant="tonal" prepend-icon="mdi-refresh" @click="load" :loading="loading">
          Osvježi
        </v-btn>
      </div>

      <!-- GLAVNI RED: forma + lista -->
      <v-row class="ga-8" align="start">
        <!-- Lijevo: kreiranje / edit -->
        <v-col cols="12" md="5" lg="4">
          <v-card rounded="xl" elevation="2" class="card pa-6">
            <div class="d-flex align-center ga-2 mb-4">
              <v-avatar size="40" color="primary" variant="tonal">
                <v-icon>mdi-ticket-percent</v-icon>
              </v-avatar>
              <div class="text-subtitle-1 font-weight-bold">
                {{ form.id ? 'Uredi vaučer' : 'Novi vaučer' }}
              </div>
            </div>

            <v-text-field
              v-model="form.code"
              label="Kod"
              :rules="[v => !!v || 'Kod je obavezan']"
              prepend-inner-icon="mdi-key-variant"
              variant="outlined"
              density="comfortable"
              class="mb-4"
              @blur="normalizeCode"
            />

            <v-select
              v-model="form.discountType"
              :items="discountTypes"
              item-title="label"
              item-value="value"
              label="Tip popusta"
              prepend-inner-icon="mdi-percent-outline"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            />

            <v-text-field
              v-model.number="form.discountValue"
              label="Vrijednost popusta"
              type="number"
              :hint="form.discountType==='PERCENT' ? '0–100 (%)' : 'Iznos u valuti'"
              persistent-hint
              prepend-inner-icon="mdi-cash"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            />

            <div class="grid-2 mb-4">
              <v-text-field v-model="form.validFrom" type="date" label="Važi od" prepend-inner-icon="mdi-calendar-start" variant="outlined" density="comfortable" />
              <v-text-field v-model="form.validTo" type="date" label="Važi do" prepend-inner-icon="mdi-calendar-end" variant="outlined" density="comfortable" />
            </div>

            <v-text-field
              v-model="form.userUsername"
              label="Korisnik (username) — opcionalno"
              prepend-inner-icon="mdi-account"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            />

            <v-text-field
              v-model.number="form.reservationId"
              label="Rezervacija ID — opcionalno"
              prepend-inner-icon="mdi-clipboard-text"
              variant="outlined"
              density="comfortable"
              class="mb-4"
            />

            <v-alert v-if="err" type="error" variant="tonal" class="mb-4">{{ err }}</v-alert>
            <v-alert v-if="ok" type="success" variant="tonal" class="mb-4">{{ ok }}</v-alert>

            <div class="d-flex flex-wrap ga-2">
              <v-btn color="primary" :loading="saving" @click="saveVoucher">
                {{ form.id ? 'Sačuvaj izmjene' : 'Kreiraj vaučer' }}
              </v-btn>
              <v-btn variant="text" @click="resetForm" :disabled="saving">Poništi</v-btn>
              <v-btn variant="outlined" color="secondary" prepend-icon="mdi-dice-5" @click="generateCode" :disabled="saving">
                Generiši kod
              </v-btn>
            </div>
          </v-card>
        </v-col>

        <!-- Desno: lista -->
        <v-col cols="12" md="7" lg="8">
          <v-card rounded="xl" elevation="2" class="card list-card">
            <div class="filters d-flex align-center ga-3 px-6 py-4">
              <v-text-field v-model="q.search" placeholder="Pretraga koda…" clearable variant="outlined" density="comfortable" class="flex-1" prepend-inner-icon="mdi-magnify" @keyup.enter="load" />
              <v-text-field v-model="q.validOn" type="date" label="Važeći na datum" variant="outlined" density="comfortable" style="max-width:220px" prepend-inner-icon="mdi-calendar" />
              <v-select v-model="q.isUsed" :items="usedFilter" item-title="label" item-value="value" label="Iskorišten" variant="outlined" density="comfortable" style="max-width:220px" prepend-inner-icon="mdi-check-decagram-outline" />
              <v-btn @click="load" :loading="loading" prepend-icon="mdi-filter" color="primary" variant="tonal">Filtriraj</v-btn>
            </div>

            <v-divider />

            <v-data-table
              :headers="headers"
              :items="items"
              :loading="loading"
              :items-per-page="10"
              item-key="id"
              class="elevation-0 px-2 pb-2"
            >
              <template #item.discount="{ item }">
                <v-chip size="small" variant="flat" color="primary">
                  <template v-if="item.discountType==='PERCENT'">{{ Number(item.discountValue) }}%</template>
                  <template v-else>{{ Number(item.discountValue).toLocaleString() }}</template>
                </v-chip>
              </template>

              <template #item.validity="{ item }">
                <v-chip size="small" variant="tonal">{{ item.validFrom || '—' }} → {{ item.validTo || '—' }}</v-chip>
              </template>

              <template #item.boundTo="{ item }">
                <div class="text-caption d-flex ga-1">
                  <v-chip v-if="item.userUsername" size="x-small" variant="tonal" prepend-icon="mdi-account">{{ item.userUsername }}</v-chip>
                  <v-chip v-if="item.reservationId" size="x-small" variant="tonal" prepend-icon="mdi-clipboard-text">#{{ item.reservationId }}</v-chip>
                  <span v-if="!item.userUsername && !item.reservationId" class="text-medium-emphasis">—</span>
                </div>
              </template>

              <template #item.isUsed="{ item }">
                <v-chip :color="item.isUsed ? 'green' : 'grey'" size="small" variant="flat">{{ item.isUsed ? 'DA' : 'NE' }}</v-chip>
              </template>

              <template #item.actions="{ item }">
                <div class="d-flex ga-1">
                  <v-btn icon variant="text" @click="startEdit(item)" :title="'Uredi'"><v-icon>mdi-pencil</v-icon></v-btn>
                  <v-btn icon variant="text" color="red" @click="remove(item)" :title="'Obriši'"><v-icon>mdi-delete</v-icon></v-btn>
                  <v-btn icon variant="tonal" :color="item.isUsed ? 'orange' : 'primary'" @click="toggleUsed(item)">
                    <v-icon>{{ item.isUsed ? 'mdi-undo' : 'mdi-check' }}</v-icon>
                  </v-btn>
                </div>
              </template>

              <template #no-data>
                <v-alert type="info" variant="tonal" class="ma-6">Nema vouchera.</v-alert>
              </template>
            </v-data-table>
          </v-card>
        </v-col>
      </v-row>

    </v-container>
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/axiosInstance'
import { store } from '@/utils/store'

const headers = [
  { title: 'ID', key: 'id', width: 80 },
  { title: 'Kod', key: 'code' },
  { title: 'Popust', key: 'discount' },
  { title: 'Period', key: 'validity' },
  { title: 'Vezan za', key: 'boundTo' },
  { title: 'Iskorišten', key: 'isUsed', width: 120 },
  { title: '', key: 'actions', sortable: false, width: 240 },
]

const discountTypes = [
  { label: 'Procenat (%)', value: 'PERCENT' },
  { label: 'Iznos (AMOUNT)', value: 'AMOUNT' },
]

const usedFilter = [
  { label: 'Svi', value: undefined },
  { label: 'Iskorišteni', value: true },
  { label: 'Neiskorišteni', value: false },
]

const form = ref({
  id: null,
  code: '',
  discountType: 'PERCENT',
  discountValue: null,
  validFrom: '',
  validTo: '',
  userUsername: '',
  reservationId: null,
})

const items = ref([])
const loading = ref(false)
const saving = ref(false)
const err = ref('')
const ok = ref('')

const q = ref({ search: '', validOn: '', isUsed: undefined })

const discountRules = computed(() => [
  v => v !== null && v !== undefined && v !== '' || 'Obavezno',
  v => {
    const n = Number(v)
    if (!Number.isFinite(n) || n <= 0) return 'Mora biti > 0'
    if (form.value.discountType === 'PERCENT' && n > 100) return 'Maksimalno 100%'
    return true
  }
])

function normalizeCode() {
  if (form.value.code) form.value.code = String(form.value.code).trim().toUpperCase()
}

function resetForm() {
  form.value = {
    id: null,
    code: '',
    discountType: 'PERCENT',
    discountValue: null,
    validFrom: '',
    validTo: '',
    userUsername: '',
    reservationId: null,
  }
  err.value = ''
  ok.value = ''
}

async function load() {
  loading.value = true
  err.value = ''
  try {
    const params = {}
    if (q.value.search) params.search = q.value.search
    if (q.value.validOn) params.validOn = q.value.validOn
    if (q.value.isUsed !== undefined) params.isUsed = q.value.isUsed
    // include user, reservation radi tabele
    params.include = 'user,reservation'
    const { data } = await api.get('/vouchers', { params })
    items.value = data
  } catch (e) {
    err.value = e?.response?.data?.error || 'Greška pri učitavanju'
  } finally {
    loading.value = false
  }
}

async function saveVoucher() {
  err.value = ''
  ok.value = ''
  // proste provjere
  if (!form.value.code) {
    err.value = 'Kod je obavezan'
    return
  }
  const n = Number(form.value.discountValue)
  if (!Number.isFinite(n) || n <= 0) {
    err.value = 'Vrijednost popusta mora biti broj > 0'
    return
  }
  if (form.value.discountType === 'PERCENT' && n > 100) {
    err.value = 'Procenat ne može biti > 100'
    return
  }
  if (form.value.validFrom && form.value.validTo && form.value.validFrom > form.value.validTo) {
    err.value = 'Datum “Važi od” mora biti prije “Važi do”'
    return
  }

  saving.value = true
  try {
    const payload = {
      code: form.value.code,
      discountType: form.value.discountType,
      discountValue: form.value.discountValue,
      validFrom: form.value.validFrom || null,
      validTo: form.value.validTo || null,
      userUsername: form.value.userUsername || null,
      reservationId: form.value.reservationId ?? null,
    }

    if (form.value.id) {
      await api.put(`/vouchers/${form.value.id}`, payload)
      ok.value = 'Vaučer izmijenjen.'
    } else {
      await api.post('/vouchers', payload)
      ok.value = 'Vaučer kreiran.'
    }
    await load()
    resetForm()
  } catch (e) {
    err.value = e?.response?.data?.error || 'Greška pri čuvanju'
  } finally {
    saving.value = false
  }
}

function startEdit(row) {
  form.value = {
    id: row.id,
    code: row.code,
    discountType: row.discountType,
    discountValue: Number(row.discountValue),
    validFrom: row.validFrom || '',
    validTo: row.validTo || '',
    userUsername: row.userUsername || '',
    reservationId: row.reservationId ?? null,
  }
  err.value = ''
  ok.value = ''
}

async function remove(row) {
  if (!confirm(`Obrisati vaučer "${row.code}"?`)) return
  try {
    await api.delete(`/vouchers/${row.id}`)
    await load()
  } catch (e) {
    err.value = e?.response?.data?.error || 'Greška pri brisanju'
  }
}

async function toggleUsed(row) {
  // jednostavan flip: PUT sa isUsed = !isUsed
  try {
    await api.put(`/vouchers/${row.id}`, { isUsed: !row.isUsed, reservationId: row.isUsed ? null : row.reservationId ?? null })
    await load()
  } catch (e) {
    err.value = e?.response?.data?.error || 'Greška pri izmjeni'
  }
}

function generateCode() {
  // jednostavan generator
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase()
  form.value.code = `VCH-${ts}-${rand}`.replace(/[^A-Z0-9-]/g, '')
}

onMounted(load)
</script>


<style scoped>
.app-bg {
  background: linear-gradient(180deg, #f7f9fc 0%, #ffffff 120px);
  min-height: 100vh;
}
.page { max-width: 1440px; }
.card { overflow: hidden; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.filters {
  position: sticky; top: 0; z-index: 2; background: white;
  border-top-left-radius: 16px; border-top-right-radius: 16px;
  box-shadow: 0 1px 0 rgba(0,0,0,.06);
}
.topbar { padding-inline: .25rem; }
</style>