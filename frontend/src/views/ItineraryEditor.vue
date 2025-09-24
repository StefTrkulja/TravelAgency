<template>
  <v-container>
    <h2 class="mb-4">Itinerer — polazak #{{ departureId }}</h2>

    <v-row>
      <!-- FORM -->
      <v-col cols="12" md="4">
        <v-card class="pa-4">
          <v-form v-model="valid">
            <v-row dense>
              <v-col cols="6">
                <v-text-field
                  label="Dan"
                  type="number"
                  v-model.number="form.dayNo"
                  :disabled="dayTrip"
                  :rules="[r.required, r.positive]"
                  @change="suggestDate"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Datum"
                  type="date"
                  v-model="form.date"
                  :disabled="dayTrip"
                  :rules="[r.required]"
                />
              </v-col>

              <v-col cols="6">
                <v-text-field
                  label="Od"
                  type="time"
                  v-model="form.startTime"
                  :rules="[r.required]"
                />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Do"
                  type="time"
                  v-model="form.endTime"
                  :rules="[r.required, timeOrderRule]"
                />
              </v-col>

              <!-- Aktivnost iz biblioteke – auto-popunjava polja -->
              <v-col cols="12">
             <v-autocomplete
                label="Aktivnost (opciono)"
                :items="activityOptions"
                :item-title="itemLabel"
                item-value="id"
                v-model="selectedActivityId"
                :loading="loadingActs"
                @focus="loadActivities"
                clearable
                hint="Izaberi da bi se popunili naslov/opis/lokacija"
                persistent-hint
              />

              </v-col>

              <v-col cols="12">
                <v-text-field
                  label="Naslov"
                  v-model="form.title"
                  :rules="[r.required, r.min3]"
                />
              </v-col>

              <v-col cols="12">
                <v-textarea
                  label="Opis (opciono)"
                  v-model="form.description"
                  auto-grow
                />
              </v-col>

              <v-col cols="12">
                <v-text-field
                  label="Lokacija (opciono)"
                  v-model="form.location"
                />
              </v-col>
            </v-row>

            <v-alert
              v-if="error"
              type="error"
              density="comfortable"
              class="mt-2"
            >{{ error }}</v-alert>
            <v-alert
              v-if="ok"
              type="success"
              density="comfortable"
              class="mt-2"
            >{{ ok }}</v-alert>

            <div class="mt-3 d-flex ga-2">
              <v-btn color="primary" :disabled="!valid" :loading="saving" @click="create">
                Dodaj stavku
              </v-btn>
              <v-btn variant="text" @click="resetForm">Očisti</v-btn>
            </div>
          </v-form>
        </v-card>
      </v-col>

      <!-- TABELA -->
      <v-col cols="12" md="8">
        <v-card>
          <v-card-title class="px-4 pt-4">Stavke u itinereru</v-card-title>
          <v-data-table
            :headers="headers"
            :items="items"
            :loading="loading"
            item-key="id"
            :sort-by="[{ key: 'dayNo', order: 'asc' }, { key: 'startTime', order: 'asc' }]"
            class="px-2 pb-2"
          >
            <template #item.dayNo="{ item }">
              <v-chip color="primary" variant="flat" size="small">{{ item.dayNo }}</v-chip>
            </template>

            <template #item.actions="{ item }">
              <v-btn size="small" icon="mdi-pencil" @click="openEdit(item)" />
              <v-btn size="small" icon="mdi-delete" @click="remove(item)" />
            </template>

            <template #no-data>
              <v-alert type="info" class="ma-4">Još nema stavki. Dodaj prvu sa leve strane.</v-alert>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- EDIT DIALOG -->
    <v-dialog v-model="editDlg" max-width="640">
      <v-card>
        <v-card-title>Izmena stavke</v-card-title>
        <v-card-text>
          <v-form v-model="editValid">
            <v-row dense>
              <v-col cols="4"><v-text-field label="Dan" type="number" v-model.number="edit.dayNo" :rules="[r.required, r.positive]" /></v-col>
              <v-col cols="8"><v-text-field label="Datum" type="date" v-model="edit.date" :rules="[r.required]" /></v-col>
              <v-col cols="6"><v-text-field label="Od" type="time" v-model="edit.startTime" :rules="[r.required]" /></v-col>
              <v-col cols="6"><v-text-field label="Do" type="time" v-model="edit.endTime" :rules="[r.required, timeOrderRuleEdit]" /></v-col>
              <v-col cols="12"><v-text-field label="Naslov" v-model="edit.title" :rules="[r.required, r.min3]" /></v-col>
              <v-col cols="12"><v-textarea label="Opis" v-model="edit.description" auto-grow /></v-col>
              <v-col cols="12"><v-text-field label="Lokacija" v-model="edit.location" /></v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="editDlg=false">Otkaži</v-btn>
          <v-btn color="primary" :disabled="!editValid" :loading="saving" @click="update">Sačuvaj</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script setup>
import api from '@/utils/axiosInstance'
import { ref, onMounted, watchEffect, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const departureId = Number(route.params.departureId)

const headers = [
  { title: 'Dan', key: 'dayNo', width: 70 },
  { title: 'Datum', key: 'date' },
  { title: 'Od', key: 'startTime' },
  { title: 'Do', key: 'endTime' },
  { title: 'Naslov', key: 'title', width: 280 },
  { title: 'Lokacija', key: 'location', width: 220 },
  { title: '', key: 'actions', sortable: false, width: 100 }
]

const items   = ref([])
const loading = ref(false)
const saving  = ref(false)
const valid   = ref(false)
const ok      = ref('')
const error   = ref('')

// forma
const form = ref({
  dayNo: 1,
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  title: '',
  description: ''
})

// pravila
const r = {
  required: v => !!v || 'Obavezno',
  min3: v => !v || v.length >= 3 || 'Min 3 slova',
  positive: v => (Number(v) > 0) || 'Mora biti > 0'
}

// >>> OVO JE BILO POGREŠNO – sada je ispravno:
const timeOrderRule = () => {
  const s = form.value.startTime
  const e = form.value.endTime
  if (!s || !e) return true                // ne greši dok oba nisu popunjena
  return s < e || 'Vreme OD mora biti pre DO'
}

const timeOrderRuleEdit = () => {
  const s = edit.value.startTime
  const e = edit.value.endTime
  if (!s || !e) return true
  return s < e || 'Vreme OD mora biti pre DO'
}

// aktivnosti (biblioteka)
const activityOptions   = ref([])
const selectedActivityId = ref(null)
const loadingActs = ref(false)

// lepši label u slučaju da backend vraća `title` ili `activityTitle`
const itemLabel = (it) => it?.name || it?.title || it?.activityTitle || `Aktivnost #${it?.id ?? ''}`

async function loadActivities () {
  if (activityOptions.value.length) return
  loadingActs.value = true
  try {
    const { data } = await api.get('/activities')   // ako nema rute – ostaje prazno (opciono)
    activityOptions.value = Array.isArray(data) ? data : []
  } catch (_) {
    activityOptions.value = []                      // fallback bez greške u UI
  } finally {
    loadingActs.value = false
  }
}

// kada izabere aktivnost – popuni naslov/opis/lokaciju (samo ako polja nisu već uneta)
watchEffect(() => {
  const id = selectedActivityId.value
  if (!id) return
  const a = activityOptions.value.find(x => x.id === id)
  if (a) {
    if (!form.value.title)       form.value.title       = a.name || a.title || a.activityTitle || ''
    if (!form.value.description) form.value.description = a.description || ''
    if (!form.value.location)    form.value.location    = a.location || ''
  }
})

// polazak
const departure = ref(null)
const dayTrip = computed(() =>
  !!departure.value &&
  departure.value.startDate &&
  departure.value.endDate &&
  departure.value.startDate === departure.value.endDate
)

async function loadDeparture() {
  try {
    const { data } = await api.get(`/departures/${departureId}`)
    departure.value = data
  } catch (_) { /* ignore */ }
}

// predlog datuma na osnovu dana (startDate + (dayNo-1))
// >>> imala si check na nepostojeći `dateStart` – uklonjeno.
function suggestDate() {
  if (!departure.value?.startDate) return
  try {
    const base = new Date(departure.value.startDate)
    const d = new Date(base)
    d.setDate(base.getDate() + Number(form.value.dayNo || 1) - 1)
    form.value.date = d.toISOString().slice(0, 10)
  } catch (_) { /* ignore */ }
}

async function load () {
  loading.value = true
  try {
    const { data } = await api.get(`/itineraries/by-departure/${departureId}`)
    items.value = data
  } finally { loading.value = false }
}

function resetForm() {
  form.value = { dayNo: 1, date: '', startTime: '', endTime: '', location: '', title: '', description: '' }
  selectedActivityId.value = null
  ok.value = ''; error.value = ''
}

async function create () {
  error.value = ''; ok.value = ''
  saving.value = true
  try {
    await api.post(`/itineraries/${departureId}`, form.value)
    ok.value = 'Stavka dodata.'
    resetForm()
    await load()
    if (dayTrip.value && departure.value?.startDate) {
      // kod jednodnevnog – odmah pripremi opet isti datum i dan 1
      form.value.dayNo = 1
      form.value.date  = departure.value.startDate
    }
  } catch (e) {
    const d = e?.response?.data
    error.value = d?.error || d?.errors?.[0]?.message || e.message || 'Greška'
  } finally { saving.value = false }
}

// edit / delete
const editDlg   = ref(false)
const edit      = ref({})
const editValid = ref(false)

function openEdit(item) {
  edit.value = { ...item }
  editDlg.value = true
}

async function update() {
  saving.value = true
  try {
    await api.put(`/itineraries/${edit.value.id}`, edit.value)
    editDlg.value = false
    await load()
  } finally { saving.value = false }
}

async function remove(item) {
  await api.delete(`/itineraries/${item.id}`)
  await load()
}

onMounted(async () => {
  await Promise.all([loadDeparture(), load()])
  // dayTrip: zakucaj dan i datum čim učita polazak
  if (dayTrip.value && departure.value?.startDate) {
    form.value.dayNo = 1
    form.value.date  = departure.value.startDate
  } else {
    // ako nije day trip, predloži datum za dan 1
    suggestDate()
  }
})
</script>
