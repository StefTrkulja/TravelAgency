<!-- src/views/EscalationsView.vue -->
<template>
  <v-container class="py-6">
    <!-- Header -->
    <div class="tickets-header">
      <h1 class="page-title">Escalations</h1>
      <v-spacer />
    </div>

    <!-- (opciono) brze akcije / navigacija -->
    <div class="header-actions">
      <v-btn variant="outlined" class="btn-outline" @click="goTickets">Tickets</v-btn>
      <v-btn variant="outlined" class="btn-outline" @click="goCompensations">Compensations</v-btn>
      <v-btn variant="outlined" class="btn-outline" @click="goAnalytics">Analytics</v-btn>
    </div>

    <!-- Filters -->
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
        v-model="filters.assignee"
        :items="operatorOptions"
        label="Assigned Operator"
        clearable
        density="comfortable"
        variant="outlined"
        class="filter-item"
        :loading="loading.operators"
        :disabled="loading.operators"
      />
    </div>

    <!-- Table -->
    <v-card elevation="1">
      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading.escalations"
        item-key="id"
        class="operator-table"
        density="comfortable"
      >
        <template #loading>
          <v-skeleton-loader type="table-row@5" />
        </template>
        <!-- Assigned Operator -->
        <template #item.assigneeUsername="{ item }">
          <span v-if="item.assigneeUsername">{{ item.assigneeUsername }}</span>
          <span v-else class="text-medium-emphasis">Unassigned</span>
        </template>

        <!-- Reason -->
        <template #item.reason="{ item }">
          <v-chip size="small" variant="tonal">
            {{ item.reason || item.escalationReason || '—' }}
          </v-chip>
        </template>

        <!-- Date Escalated -->
        <template #item.dateEscalated="{ item }">
          {{ formatDate(item.dateEscalated || item.escalatedAt) }}
        </template>

        <!-- Status -->
        <template #item.statusName="{ item }">
          <v-chip size="small" variant="outlined">
            {{ item.statusName || item.status?.name || item.statusCode || '—' }}
          </v-chip>
        </template>

        <!-- Action -->
        <template #item.actions="{ item }">
          <div class="row-actions">
            <v-btn
              variant="outlined"
              size="small"
              class="btn-outline"
              @click="viewTicket(item)"
            >
              View
            </v-btn>
          </div>
        </template>

        <template #no-data>
          <v-alert type="info" variant="tonal" title="No escalations to show">
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
        { title: 'Case ID',           key: 'id',               sortable: true, width: 110 },
        { title: 'Assigned Manager', key: 'assigneeUsername', sortable: true, width: 180 },
        { title: 'Escalation Reason', key: 'reason',           sortable: false, width: 220 },
        { title: 'Date Escalated',    key: 'dateEscalated',    sortable: true, width: 180 },
        { title: 'Status',            key: 'status',       sortable: true, width: 140 },
        { title: 'Action',            key: 'actions',          sortable: false, align: 'end', width: 90 },
      ],

      escalationsRaw: [],     // full dataset sa BE
      statuses: [],           // [{id,name,code...}]
      operatorOptions: [],    // ['stefan','marko',...]
      filters: {
        statusId: null,
        assignee: null,
      },

      loading: { escalations: false, statuses: false, operators: false },
    }
  },

  computed: {
    statusOptions() {
      return this.statuses
    },

    // front-end filterovanje
    rows() {
      const { statusId, assignee } = this.filters
      return this.escalationsRaw.filter(it => {
        const okStatus = !statusId || it.statusId === statusId || it.status?.id === statusId
        const okAssignee = !assignee || String(it.assigneeUsername || '').toLowerCase() === String(assignee).toLowerCase()
        return okStatus && okAssignee
      })
    },
  },

  async created() {
    // sve GET-ove radimo paralelno
    await Promise.all([this.fetchStatuses(), this.fetchOperators(), this.fetchEscalations()])
  },

  methods: {
    /* ==================== API ==================== */
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
        const { data } = await axiosInstance.get('/user/operators')
        this.operatorOptions = Array.isArray(data) ? data.map(u => u.username) : []
      } catch (e) {
        console.error('Failed to load operators', e)
        this.operatorOptions = []
      } finally {
        this.loading.operators = false
      }
    },

    async fetchEscalations() {
  try {
    this.loading.escalations = true

    const resp = await axiosInstance.get('/escalation/manager-escalations')
    const payload = resp?.data
		console.log('Fetched escalations:', payload);
    // podrži oba oblika:
    // 1) [ {...}, {...} ]
    // 2) { data: [ {...}, {...} ], ... }
    const list = Array.isArray(payload)
      ? payload
      : (Array.isArray(payload?.data) ? payload.data : [])

      console.log('Normalized escalation list:', list);
    // (opciono) normalizuj polja za tabelu
    this.escalationsRaw = list.map(it => ({
      id: it.id,
      assigneeUsername: it.managerUsername ?? it.assignee ?? null,
      reason: it.reason ?? it.escalationReason ?? null,
      dateEscalated: it.dateEscalated ?? it.escalatedAt ?? it.createdAt ?? null,
      statusName: it.statusName ?? it.status?.name ?? it.statusCode ?? null,
      status: it.status ?? null, // zadrži ako negde koristiš
      complaintId: it.complaintId ?? it.ticketId ?? null,
      // ...preslikaj još šta ti treba
    }))
  } catch (e) {
    console.error('Failed to load escalations', e)
    this.escalationsRaw = []
  } finally {
    this.loading.escalations = false
  }
}
,

    /* ==================== Actions ==================== */
    viewTicket(item) {
      console.log('Viewing ticket', item)
      this.$router.push({ name: 'ManagerTicketDetails', params: { id: item.complaintId } })
    },

    /* ==================== Helpers ==================== */
    formatDate(d) {
      if (!d) return '—'
      try { return new Date(d).toLocaleString() } catch { return String(d) }
    },

    goTickets()        { this.$router.push({ name: 'ManagerTicketsView' }) },
    goCompensations()  { this.$router.push({ name: 'CompensationsView' }) },
    goAnalytics()      { this.$router.push({ name: 'Analytics' }) },
  },
}
</script>

<style scoped>
.tickets-header { display: flex; align-items: center; margin-bottom: 12px; }
.page-title { margin: 0; font-size: 1.4rem; font-weight: 800; }

.header-actions { display: flex; gap: 8px; margin-bottom: 12px; }

.filters { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
.filter-item { min-width: 220px; }

.operator-table :deep(thead th) { font-weight: 700; }
.cell-title .subject { font-weight: 700; }
.cell-title .meta {
  font-size: 0.8rem; color: rgba(0,0,0,0.54); display: flex; gap: 6px;
}
.row-actions { display: flex; justify-content: flex-end; gap: 8px; }

.btn-outline {
  text-transform: none;
  border-radius: 10px !important;
  border: 1.5px solid rgba(0,0,0,0.38) !important;
}
</style>
