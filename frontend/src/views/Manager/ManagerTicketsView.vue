<template>
  <v-container class="py-6">
    <!-- Header + Filters -->
    <div class="tickets-header">
      <h1 class="page-title">Operator Tickets</h1>
      <v-spacer />
    </div>

    <!-- Actions u novom redu -->
    <div class="header-actions">
      <v-btn variant="outlined" class="btn-outline" @click="goEscalations">Escalations</v-btn>
      <v-btn variant="outlined" class="btn-outline" @click="goCompensations">Compensations</v-btn>
      <v-btn variant="outlined" class="btn-outline" @click="goAnalytics">Analytics</v-btn>
    </div>

    <!-- Filters ispod actions -->
    <div class="filters">
      <v-select
        v-model="filters.statusId"
        :items="statusOptions"
        item-title="name"
        item-value="id"
        label="Status"
        clearable
        density="comfortable"
        variant="outlined"
        class="filter-item"
        :loading="loading.statuses"
        :disabled="loading.statuses"
      />
      <v-select
        v-model="filters.category"
        :items="categoryOptions"
        label="Category"
        clearable
        density="comfortable"
        variant="outlined"
        class="filter-item"
      />
      <v-select
        v-model="filters.priority"
        :items="priorityOptions"
        label="Priority"
        clearable
        density="comfortable"
        variant="outlined"
        class="filter-item"
      />
    </div>

    <!-- Table -->
    <v-card elevation="1">
      <v-data-table
        :headers="headers"
        :items="tickets"
        :loading="loading.tickets"
        item-key="id"
        class="operator-table"
        density="comfortable"
      >
        <template #loading>
          <v-skeleton-loader type="table-row@5" />
        </template>

        <!-- Subject + meta -->
        <template #item.subject="{ item }">
          <div class="cell-title">
            <div class="subject">{{ item.subject || '—' }}</div>
            <div class="meta">
              <span>#{{ item.id }}</span>
              <span>&middot;</span>
              <span>{{ formatDate(item.createdAt) }}</span>
            </div>
          </div>
        </template>

        <!-- Passenger -->
        <template #item.passenger="{ item }">
          {{ item.passenger || '—' }}
        </template>

        <!-- Assigned Operator -->
        <template #item.assigneeUsername="{ item }">
          <span v-if="item.assigneeUsername">{{ item.assigneeUsername }}</span>
          <span v-else class="text-medium-emphasis">Unassigned</span>
        </template>

        <!-- Category -->
        <template #item.category="{ item }">
          <v-chip size="small" variant="tonal">
            {{ item.category || '—' }}
          </v-chip>
        </template>

        <!-- Status -->
        <template #item.statusName="{ item }">
          <v-chip size="small" variant="outlined">
            {{ item.statusName || item.status?.name || item.statusCode || '—' }}
          </v-chip>
        </template>

        <!-- Priority -->
        <template #item.priority="{ item }">
          <v-chip size="small" :color="priorityColor(item.priority)" variant="flat">
            {{ item.priority || '—' }}
          </v-chip>
        </template>

        <!-- Date Created -->
        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <!-- Actions: samo View -->
        <template #item.actions="{ item }">
          <div class="row-actions">
            <v-btn
              variant="outlined"
              size="small"
              class="btn-outline"
              @click="viewDetails(item)"
            >
              View
            </v-btn>
          </div>
        </template>

        <template #no-data>
          <v-alert type="info" variant="tonal" title="No tickets to show">
            Try changing filters.
          </v-alert>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import axiosInstance from '@/utils/axiosInstance'
import { store } from '@/utils/store'

export default {
  data() {
    return {
      headers: [
        { title: 'Case ID',            key: 'id',               sortable: true },
        { title: 'Subject',            key: 'subject',          sortable: true, width: 240 },
        { title: 'Passenger',          key: 'createdByUsername',        sortable: true },
        { title: 'Assigned Operator',  key: 'assigneeUsername', sortable: true },
        { title: 'Category',           key: 'category',         sortable: true },
        { title: 'Status',             key: 'statusName',       sortable: true },
        { title: 'Priority',           key: 'priority',         sortable: true },
        { title: 'Date Created',       key: 'createdAt',        sortable: true },
        { title: 'Actions',            key: 'actions',          sortable: false, align: 'end', width: 90 },
      ],

      // raw lista sa BE
      ticketsRaw: [],
      // options
      statuses: [],
      operatorOptions: [],
      categoryOptions: ['Accommodation', 'Transport', 'Finance', 'Support', 'Other'],
      priorityOptions: ['Low', 'Medium', 'High', 'Critical'],

      // filter state
      filters: {
        statusId: null,
        category: null,
        priority: null,
      },

      loading: { tickets: false, statuses: false, operators: false },
    }
  },

  computed: {
    statusOptions() {
      return this.statuses
    },
    // Klijentsko filtriranje
    tickets() {
      const { statusId, category, priority } = this.filters
      return this.ticketsRaw.filter(it => {
        const okStatus = !statusId || it.statusId === statusId || it.status?.id === statusId
        const okCat    = !category || String(it.category || '').toLowerCase() === String(category).toLowerCase()
        const okPr     = !priority || String(it.priority || '').toLowerCase() === String(priority).toLowerCase()
        return okStatus && okCat && okPr
      })
    },
  },

  async created() {
    await Promise.all([this.fetchStatuses(), this.fetchOperators(), this.fetchTickets()])
  },

  methods: {
    /* ===== GET ===== */
    async fetchStatuses() {
      try {
        this.loading.statuses = true
        const { data } = await axiosInstance.get('/status')
        this.statuses = Array.isArray(data) ? data : []
      } catch (e) {
        console.error('Failed to load statuses', e)
        this.statuses = []
      } finally {
        this.loading.statuses = false
      }
    },

    async fetchOperators() {
      try {
        this.loading.operators = true
        const { data } = await axiosInstance.get('/user/operators') // prilagodi ako je drugi endpoint
        this.operatorOptions = Array.isArray(data) ? data.map(u => u.username) : []
      } catch (e) {
        console.error('Failed to load operators', e)
        this.operatorOptions = []
      } finally {
        this.loading.operators = false
      }
    },

    async fetchTickets() {
      try {
        this.loading.tickets = true
        // Operator view: povuci moje + pending (prilagodi po potrebi)
        const params = {
          includePending: true,
          assignee: store.username,
        }
        const { data } = await axiosInstance.get('/complaint/manager-tickets', { params })
        // očekuje: id, subject, passenger, assigneeUsername, category, statusId/statusName, priority, createdAt
        console.log
        this.ticketsRaw = Array.isArray(data) ? data : []
      } catch (e) {
        console.error('Failed to load operator tickets', e)
        this.ticketsRaw = []
      } finally {
        this.loading.tickets = false
      }
    },

    /* ===== Actions ===== */
    viewDetails(item) {
      this.$router.push({ name: 'ManagerTicketDetails', params: { id: item.id } })
    },

    /* ===== Helpers ===== */
    formatDate(d) {
      if (!d) return '—'
      try { return new Date(d).toLocaleString() } catch { return String(d) }
    },
    priorityColor(p) {
      if (!p) return undefined
      const k = String(p).toLowerCase()
      if (k === 'critical') return 'red'
      if (k === 'high')     return 'deep-orange'
      if (k === 'medium')   return 'amber'
      if (k === 'low')      return 'green'
      return undefined
    },
    goEscalations() {
      this.$router.push({ name: 'EscalationsView' })
    },
    goCompensations() {
      this.$router.push({ name: 'CompensationsView' })
    },
  },
}
</script>

<style scoped>
.tickets-header { display: flex; align-items: center; margin-bottom: 12px; }
.page-title { margin: 0; font-size: 1.4rem; font-weight: 800; }
.filters { display: flex; gap: 8px; flex-wrap: wrap; }
.filter-item { min-width: 180px; }

.operator-table :deep(thead th) { font-weight: 700; }
.cell-title .subject { font-weight: 700; }
.cell-title .meta { font-size: 0.8rem; color: rgba(0,0,0,0.54); display: flex; gap: 6px; }
.row-actions { display: flex; justify-content: flex-end; gap: 8px; }
.btn-outline {
  text-transform: none;
  border-radius: 10px !important;
  border: 1.5px solid rgba(0,0,0,0.38) !important;
}
.tickets-header {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 12px; /* razmak pre filtera */
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px; /* razmak pre tabele */
}

</style>
