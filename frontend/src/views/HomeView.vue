<template>
  <!-- App bar -->
  <v-app-bar density="comfortable" color="primary" dark flat>
    <v-app-bar-nav-icon @click="drawer = !drawer" />
    <v-toolbar-title class="font-weight-bold">Travel Agency</v-toolbar-title>
    <v-spacer/>

    <div v-if="isLoggedIn" class="mr-4 d-flex align-center ga-2">
      <v-chip label size="small" color="white" text-color="primary" class="font-weight-bold">
        {{ store.username }}
      </v-chip>
      <v-chip label size="small" color="secondary" class="font-weight-bold">
        {{ store.role }}
      </v-chip>
    </div>

    <v-btn v-if="!isLoggedIn" to="/login" variant="elevated" color="secondary" prepend-icon="mdi-login">Login</v-btn>
    <v-btn v-else @click="logout" variant="outlined" prepend-icon="mdi-logout">Logout</v-btn>
  </v-app-bar>

  <!-- Drawer -->
  <v-navigation-drawer v-model="drawer">
    <v-list nav density="compact">
      <v-list-subheader>Navigacija</v-list-subheader>
      <v-list-item to="/" prepend-icon="mdi-home" title="Home" />

      <template v-if="store.role==='OPERATOR'">
        <v-list-item to="/op/arrangements" prepend-icon="mdi-clipboard-list" title="Moji aranžmani" />
        <v-list-item to="/op/inquiries"    prepend-icon="mdi-send"            title="Pošalji upit" />
        <v-list-item to="/op/inquiries/list" prepend-icon="mdi-format-list-bulleted" title="Moji upiti" />
        <v-list-item to="/op/destinations" prepend-icon="mdi-map-marker"      title="Destinacije" />
      </template>

      <template v-else-if="store.role==='SUPPLIER'">
        <v-list-item to="/sup/inbox" prepend-icon="mdi-inbox" title="Zahtevi/Upiti" />
      </template>

      <template v-else-if="store.role==='MANAGER'">
        <v-list-item to="/mgr/approvals" prepend-icon="mdi-check-decagram" title="Odobrenja" />
        <v-list-item to="/analytics" prepend-icon="mdi-chart-line" title="Analitika" />
      </template>

      <!-- ADMIN -->
      <template v-else-if="store.role==='ADMIN'">
        <v-list-item to="/op/arrangements"  prepend-icon="mdi-calendar-text"   title="Aranžmani" />
        <v-list-item to="/op/destinations"  prepend-icon="mdi-map-marker"      title="Destinacije" />
        <v-list-item to="/admin/countries"  prepend-icon="mdi-earth"           title="Države" />
        <v-list-item to="/admin/vouchers"   prepend-icon="mdi-ticket-percent"  title="Vaučeri" />
        <v-list-item to="/mgr/approvals"    prepend-icon="mdi-check-decagram"  title="Odobrenja" />
        <v-list-item to="/analytics"        prepend-icon="mdi-chart-line"      title="Analitika" />
      </template>

      <template v-else>
        <v-divider class="my-2" />
        <v-list-subheader>Explore</v-list-subheader>
        <v-list-item to="/arrangements" prepend-icon="mdi-calendar-text" title="Arrangements" />
      </template>
    </v-list>
  </v-navigation-drawer>

  <!-- ======= MAIN ======= -->
  <v-container class="py-8">
    <!-- ADMIN DASHBOARD -->
    <template v-if="store.role==='ADMIN'">
      <!-- Hero -->
      <v-sheet
        rounded="xl"
        class="pa-8 mb-8 text-white"
        style="background: linear-gradient(135deg,#1e88e5, #42a5f5);"
      >
        <div class="d-flex flex-column flex-md-row align-center justify-space-between ga-4">
          <div>
            <div class="text-h5 text-md-h4 font-weight-bold">Dobrodošli, {{ store.username }}</div>
            <div class="text-body-1 mt-1 opacity-90">
              Centralna kontrolna tabla — brz pristup kreiranju i analitici.
            </div>
          </div>
          <div class="d-flex ga-3 flex-wrap">
            <!-- CTA: Aranžmani -->
            <v-btn
              :to="{ name: 'op-arrangements-new' }"
              color="white"
              text-color="primary"
              prepend-icon="mdi-plus-circle"
            >
              Novi aranžman
            </v-btn>
            <v-btn
              :to="{ name: 'op-arrangements' }"
              variant="outlined"
              color="white"
              prepend-icon="mdi-calendar-text"
              class="ml-2"
            >
              Moji aranžmani
            </v-btn>

            <v-btn to="/op/destinations" variant="outlined" color="white" prepend-icon="mdi-map-marker">
              Destinacije
            </v-btn>
            <v-btn to="/admin/countries" variant="outlined" color="white" prepend-icon="mdi-earth">
              Države
            </v-btn>
            <v-btn to="/admin/vouchers" variant="elevated" color="white" text-color="primary" prepend-icon="mdi-ticket-percent">
              Vaučeri
            </v-btn>
          </div>
        </div>
      </v-sheet>

      <!-- KPI kartice -->
      <v-row class="mb-2">
        <v-col cols="12" md="3">
          <v-card rounded="xl" elevation="0" class="pa-5 kpi-card">
            <div class="d-flex align-start ga-4">
              <v-avatar size="44" color="primary" variant="tonal"><v-icon size="28">mdi-cash-multiple</v-icon></v-avatar>
              <div class="flex-1-1">
                <div class="text-caption text-medium-emphasis">Prihod (30d)</div>
                <div class="text-h6 font-weight-bold mt-1">{{ formatMoney(kpis.revenue30d) }}</div>
                <div class="text-caption text-medium-emphasis mt-1">Zbir potvrđenih rezervacija</div>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card rounded="xl" elevation="0" class="pa-5 kpi-card">
            <div class="d-flex align-start ga-4">
              <v-avatar size="44" color="primary" variant="tonal"><v-icon size="28">mdi-account-group</v-icon></v-avatar>
              <div class="flex-1-1">
                <div class="text-caption text-medium-emphasis">Broj putnika (30d)</div>
                <div class="text-h6 font-weight-bold mt-1">{{ kpis.people30d }}</div>
                <div class="text-caption text-medium-emphasis mt-1">Osobe iz rezervacija</div>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card rounded="xl" elevation="0" class="pa-5 kpi-card">
            <div class="d-flex align-start ga-4">
              <v-avatar size="44" color="primary" variant="tonal"><v-icon size="28">mdi-clipboard-list</v-icon></v-avatar>
              <div class="flex-1-1">
                <div class="text-caption text-medium-emphasis">Aktivnih aranžmana</div>
                <div class="text-h6 font-weight-bold mt-1">{{ kpis.activeArrangements }}</div>
                <div class="text-caption text-medium-emphasis mt-1">Status ACTIVE</div>
              </div>
            </div>
          </v-card>
        </v-col>
        <v-col cols="12" md="3">
          <v-card rounded="xl" elevation="0" class="pa-5 kpi-card">
            <div class="d-flex align-start ga-4">
              <v-avatar size="44" color="primary" variant="tonal"><v-icon size="28">mdi-clock-alert</v-icon></v-avatar>
              <div class="flex-1-1">
                <div class="text-caption text-medium-emphasis">Za odobrenje</div>
                <div class="text-h6 font-weight-bold mt-1">{{ kpis.pendingApprovals }}</div>
                <div class="text-caption text-medium-emphasis mt-1">Status PENDING</div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Quick actions (ISPRAVNO: v-row -> v-col) -->
      <v-row class="mt-2">
        <v-col cols="12" md="3">
          <v-card class="pa-5 action-card" rounded="xl" elevation="0">
            <div class="d-flex align-center ga-4">
              <v-avatar size="44" color="white" variant="flat">
                <v-icon size="28" color="grey-darken-3">mdi-calendar-text</v-icon>
              </v-avatar>
              <div class="flex-1">
                <div class="text-subtitle-1 font-weight-bold">Aranžmani</div>
                <div class="text-body-2 text-medium-emphasis">Pregled i uređivanje</div>
              </div>
            </div>
            <div class="d-flex ga-2 mt-4">
              <v-btn :to="{ name: 'op-arrangements' }" size="small" variant="tonal">Lista</v-btn>
              <v-btn :to="{ name: 'op-arrangements-new' }" size="small" variant="outlined" prepend-icon="mdi-plus">Novi</v-btn>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="pa-5 action-card" rounded="xl" elevation="0" link to="/op/destinations" style="background:#E8F5E9">
            <div class="d-flex align-center ga-4">
              <v-avatar size="44" color="white" variant="flat"><v-icon size="28" color="grey-darken-3">mdi-map-marker</v-icon></v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-bold">Destinacije</div>
                <div class="text-body-2 text-medium-emphasis">Dodaj / uredi</div>
              </div>
              <v-spacer/><v-icon>mdi-chevron-right</v-icon>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="pa-5 action-card" rounded="xl" elevation="0" link to="/admin/countries" style="background:#FFF3E0">
            <div class="d-flex align-center ga-4">
              <v-avatar size="44" color="white" variant="flat"><v-icon size="28" color="grey-darken-3">mdi-earth</v-icon></v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-bold">Države</div>
                <div class="text-body-2 text-medium-emphasis">CRUD država</div>
              </div>
              <v-spacer/><v-icon>mdi-chevron-right</v-icon>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="3">
          <v-card class="pa-5 action-card" rounded="xl" elevation="0" link to="/admin/vouchers" style="background:#FFF8E1">
            <div class="d-flex align-center ga-4">
              <v-avatar size="44" color="white" variant="flat"><v-icon size="28" color="grey-darken-3">mdi-ticket-percent</v-icon></v-avatar>
              <div>
                <div class="text-subtitle-1 font-weight-bold">Vaučeri</div>
                <div class="text-body-2 text-medium-emphasis">Kreiranje i upravljanje</div>
              </div>
              <v-spacer/><v-icon>mdi-chevron-right</v-icon>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Nedavne stavke -->
      <v-row class="mt-6">
        <v-col cols="12" md="7">
          <v-card rounded="xl" elevation="1">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-trending-up</v-icon>
              Najprodavaniji aranžmani (30d)
              <v-spacer/><v-btn size="small" variant="text" to="/analytics">Više</v-btn>
            </v-card-title>
            <v-divider/>
            <v-list v-if="topArrangements.length" lines="two">
              <v-list-item
                v-for="a in topArrangements"
                :key="a.arrangementId"
                :title="a.title"
                :subtitle="`${a.destination} • ${formatMoney(a.totalRevenue)} • ${a.totalReservations} rezerv.`"
              >
                <template #prepend>
                  <v-avatar color="primary" size="36">{{ a.title?.[0] || 'A' }}</v-avatar>
                </template>
              </v-list-item>
            </v-list>
            <v-skeleton-loader v-else type="list-item-two-line@4" class="pa-4"/>
          </v-card>
        </v-col>

        <v-col cols="12" md="5">
          <v-card rounded="xl" elevation="1">
            <v-card-title class="d-flex align-center">
              <v-icon class="mr-2">mdi-bell-ring</v-icon>
              Brzi pregled
            </v-card-title>
            <v-divider/>
            <v-list density="compact">
              <v-list-item :to="'/mgr/approvals'" prepend-icon="mdi-timer-sand" title="Za odobrenje" :subtitle="`${kpis.pendingApprovals} aranžmana čeka odluku`"/>
              <v-list-item :to="'/op/arrangements?status=ACTIVE'" prepend-icon="mdi-check-circle" title="Aktivni aranžmani" :subtitle="`${kpis.activeArrangements} u prodaji`"/>
              <v-list-item :to="'/analytics'" prepend-icon="mdi-chart-line" title="Analitika" subtitle="Grafikoni i trendovi"/>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <!-- OSTALO (iste sekcije kao ranije) -->
    <template v-else>
      <v-row>
        <v-col cols="12">
          <h2>Dobrodošli, {{ store.username || 'gost' }}</h2>
        </v-col>
      </v-row>

      <v-row v-if="store.role==='OPERATOR'">
        <v-col cols="12" md="3">
          <v-card class="pa-4" link to="/op/arrangements" title="Moji aranžmani" subtitle="Kreiranje i uređivanje" />
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4" link to="/op/destinations" title="Destinacije" subtitle="CRUD destinacija" />
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4" link to="/op/inquiries" title="Pošalji upit dobavljaču" subtitle="Destinacija + datumi" />
        </v-col>
        <v-col cols="12" md="3">
          <v-card class="pa-4" link to="/op/inquiries/list" title="Moji upiti" subtitle="Pregled & ponude" />
        </v-col>
      </v-row>

      <v-row v-else-if="store.role==='SUPPLIER'">
        <v-col cols="12" md="6">
          <v-card class="pa-4" to="/sup/inbox" title="Zahtevi/Upiti" subtitle="Odgovori i pošalji ponudu" />
        </v-col>
      </v-row>

      <v-row v-else-if="store.role==='MANAGER'">
        <v-col cols="12" md="6">
          <v-card class="pa-4" to="/mgr/approvals" title="Odobrenja" subtitle="Pregled i odluka" />
        </v-col>
        <v-col cols="12" md="6">
          <v-card class="pa-4" to="/analytics" title="Analitika" subtitle="KPIs" />
        </v-col>
      </v-row>

      <v-row v-else>
        <v-col cols="12"><v-alert type="info">Prijavite se za pristup funkcionalnostima.</v-alert></v-col>
      </v-row>
    </template>
  </v-container>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/utils/axiosInstance'
import { store } from '@/utils/store'

const drawer = ref(false)
const isLoggedIn = computed(() => store.role !== 'guest')

// KPI state
const kpis = ref({
  revenue30d: 0,
  people30d: 0,
  activeArrangements: 0,
  pendingApprovals: 0,
})
const topArrangements = ref([])

function formatMoney(n) {
  const v = Number(n || 0)
  return v.toLocaleString(undefined, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
}

function last30ISO() {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0,10)
}

async function loadAdminData() {
  try {
    const { data } = await api.get('/statistics/arrangements', { params: { from: last30ISO() } })
    const rows = data?.data || data || []
    kpis.value.revenue30d = rows.reduce((s, r) => s + Number(r.totalRevenue || 0), 0)
    kpis.value.people30d  = rows.reduce((s, r) => s + Number(r.totalPeople  || 0), 0)
    topArrangements.value = [...rows].sort((a,b) => Number(b.totalRevenue||0) - Number(a.totalRevenue||0)).slice(0, 5)

    const act = await api.get('/arrangements', { params: { status: 'ACTIVE' } })
    kpis.value.activeArrangements = (act?.data?.data || act?.data || []).length

    try {
      const appr = await api.get('/approvals/pending-count')
      kpis.value.pendingApprovals = appr?.data?.count ?? 0
    } catch { kpis.value.pendingApprovals = 0 }
  } catch (e) {
    console.error('[admin dashboard] load error', e)
  }
}

onMounted(() => {
  if (store.role === 'ADMIN') loadAdminData()
})

async function logout() {
  try { await api.post('/user/logout') } catch {}
  store.clearUser()
}
</script>

<style scoped>
.kpi-card { transition: transform .15s ease, box-shadow .15s ease; }
.kpi-card:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(0,0,0,.08) !important; }
.action-card { transition: transform .15s ease, box-shadow .15s ease; }
.action-card:hover { transform: translateY(-3px); box-shadow: 0 12px 28px rgba(0,0,0,.10) !important; }
.opacity-90 { opacity: .9; }
</style>
