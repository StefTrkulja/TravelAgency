<template>
  <v-container>
    <h2>Napravi ponudu</h2>

    <v-form v-model="valid" class="mt-4">
      <v-row>
        <v-col cols="12" md="4">
          <v-text-field
            label="Inquiry ID"
            v-model.number="inquiryId"
            type="number"
            :rules="[r.required]"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            label="Tip ponude"
            :items="types"
            v-model="form.offerType"
            :rules="[r.required]"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            label="Cena (ukupno)"
            type="number"
            v-model.number="form.priceTotal"
            :rules="[r.nonneg]"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field label="Valuta" v-model="form.currency" />
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            label="Kapacitet"
            type="number"
            v-model.number="form.capacityTotal"
            :rules="[r.nonneg]"
          />
        </v-col>

        <v-col cols="12" md="4">
          <v-text-field
            label="Naslov (kratak opis)"
            v-model="form.title"
          />
        </v-col>

        <v-col cols="12" md="6">
          <v-text-field
            label="Vazi od"
            type="date"
            v-model="form.availabilityStart"
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field
            label="Vazi do"
            type="date"
            v-model="form.availabilityEnd"
          />
        </v-col>

        <v-col cols="12">
          <v-textarea label="Uslovi / napomene" v-model="form.terms" />
        </v-col>

        <!-- TIP-SPECIFIČNA POLJA -->
        <template v-if="form.offerType === 'HOTEL'">
          <v-col cols="12" md="6">
            <v-text-field
              label="Naziv hotela"
              v-model="form.hotelName"
              :rules="[r.required]"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              label="Zvezdice"
              type="number"
              v-model.number="form.hotelStars"
              :rules="[r.nonneg]"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select
              label="Pansion"
              :items="['RO','BB','HB','FB','AI']"
              v-model="form.board"
              :rules="[r.required]"
            />
          </v-col>
        </template>

        <template v-if="form.offerType === 'BUS' || form.offerType === 'AIRLINE'">
          <v-col cols="12" md="6">
            <v-text-field
              label="Prevoznik"
              v-model="form.transportCompany"
              :rules="[r.required]"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              label="Od (grad/tačka)"
              v-model="form.fromLocation"
              :rules="[r.required]"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field
              label="Do (grad/tačka)"
              v-model="form.toLocation"
              :rules="[r.required]"
            />
          </v-col>
        </template>

        <template v-if="form.offerType === 'GUIDE' || form.offerType === 'TOUR' || form.offerType==='OTHER'">
          <v-col cols="12" md="4">
            <v-text-field label="Ime vodiča / naziv ture" v-model="form.guideName" />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field label="Jezik" v-model="form.guideLanguage" />
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              label="Trajanje (h)"
              type="number"
              v-model.number="form.durationHours"
              :rules="[r.nonneg]"
            />
          </v-col>
        </template>
      </v-row>

      <div class="mt-3 d-flex ga-2">
        <v-btn color="primary" :disabled="!valid" :loading="loading" @click="submit">
          Pošalji
        </v-btn>
        <v-btn variant="text" @click="reset">Očisti</v-btn>
      </div>

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
const msg = ref('')
const err = ref('')
const types = ['HOTEL','AIRLINE','BUS','GUIDE','TOUR','OTHER']

const inquiryId = ref(null)
const form = ref({
  offerType: 'HOTEL',
  title: '',
  terms: '',
  priceTotal: 0,
  currency: 'EUR',
  capacityTotal: 0,

  availabilityStart: '',
  availabilityEnd: '',

  // hotel
  hotelName: '', hotelStars: 0, board: '',

  // transport
  transportCompany: '', fromLocation: '', toLocation: '',

  // tours / guide
  guideName: '', guideLanguage: '', durationHours: 0
})

const r = {
  required: v => !!v || 'Obavezno',
  nonneg: v => v === null || v === undefined || Number(v) >= 0 || 'Mora biti ≥ 0'
}

onMounted(() => {
  if (route.query.inquiryId) inquiryId.value = Number(route.query.inquiryId)
})

function reset () {
  msg.value = ''; err.value = ''
  form.value = { ...form.value, title:'', terms:'', priceTotal:0, capacityTotal:0 }
}

async function submit () {
  err.value=''; msg.value=''; loading.value=true
  try {
    const payload = { inquiryId: Number(inquiryId.value), ...form.value }

    // transportMode derivacija
    if (payload.offerType === 'AIRLINE') payload.transportMode = 'PLANE'
    if (payload.offerType === 'BUS') payload.transportMode = 'BUS'

    // 🧹 OBRIŠI tip-specifična polja koja ne važe, da ne šalješ "" u ENUM
    if (payload.offerType !== 'HOTEL') {
      delete payload.board
      delete payload.hotelName
      delete payload.hotelStars
    }
    if (payload.offerType !== 'AIRLINE' && payload.offerType !== 'BUS') {
      delete payload.transportCompany
      delete payload.fromLocation
      delete payload.toLocation
      delete payload.transportMode
    }
    if (!['GUIDE','TOUR','OTHER'].includes(payload.offerType)) {
      delete payload.guideName
      delete payload.guideLanguage
      delete payload.durationHours
    }

    // (opciono) koristi ISO datume 'YYYY-MM-DD'
    if (payload.availabilityStart) payload.availabilityStart = payload.availabilityStart.slice(0,10)
    if (payload.availabilityEnd)   payload.availabilityEnd   = payload.availabilityEnd.slice(0,10)

    await api.post('/offers/submit', payload)
    msg.value = 'Ponuda je poslata.'
  } catch (e) {
    const d = e?.response?.data
    err.value = d?.error || d?.errors?.[0]?.message || 'Greška'
  } finally {
    loading.value=false
  }
}

</script>
