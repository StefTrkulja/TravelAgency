<template>
  <v-container class="py-6">
    <!-- Header -->
    <div class="tickets-header">
      <h1 class="page-title">All Compensations</h1>
      <v-spacer />
    </div>
    <div class="header-actions">
      <v-btn variant="outlined" class="btn-outline" @click="goTickets">Tickets</v-btn>
      <v-btn variant="outlined" class="btn-outline" @click="goEscalations">Escalations</v-btn>
      <v-btn variant="outlined" class="btn-outline" @click="goAnalytics">Analytics</v-btn>
    </div>

    <!-- Filters -->
    <div class="filters">
      <v-select v-model="filters.statusName" :items="statusOptions" item-title="name" item-value="name" label="Status"
        clearable density="comfortable" variant="outlined" class="filter-item" />
      <v-select v-model="filters.type" :items="typeOptions" label="Type" clearable density="comfortable"
        variant="outlined" class="filter-item" />
      <v-text-field v-model="filters.dateFrom" label="From" type="date" density="comfortable" variant="outlined"
        class="filter-item" />
      <v-text-field v-model="filters.dateTo" label="To" type="date" density="comfortable" variant="outlined"
        class="filter-item" />
    </div>

    <!-- Table -->
    <v-card elevation="1">
      <v-data-table :headers="headers" :items="rows" :loading="loading.compensations" item-key="id"
        class="operator-table" density="comfortable">
        <template #loading><v-skeleton-loader type="table-row@6" /></template>

        <template #item.subject="{ item }">
          <div class="cell-title">
            <div class="subject">{{ item.subject || '—' }}</div>
            <div class="meta">
              <span>Case #{{ item.complaintId ?? item.id }}</span>
            </div>
          </div>
        </template>

        <template #item.type="{ item }">
          <v-chip size="small" variant="tonal">{{ item.type || '—' }}</v-chip>
        </template>

        <template #item.amount="{ item }">
          <span v-if="item.amount != null">{{ formatAmount(item.amount, item.currency, item.type) }}</span>
          <span v-else-if="item.value != null">{{ item.value }}</span>
          <span v-else>—</span>
        </template>

        <template #item.dateProposed="{ item }">
          {{ formatDate(item.dateProposed || item.createdAt) }}
        </template>

        <template #item.statusName="{ item }">
          <v-chip size="small" variant="outlined">
            {{ item.statusName || item.status?.name || item.statusCode || '—' }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="row-actions">
            <v-btn variant="outlined" size="small" class="btn-outline" @click="approve(item)">Approve</v-btn>
            <v-btn variant="outlined" size="small" class="btn-outline" @click="reject(item)">Reject</v-btn>
            <v-btn variant="outlined" size="small" class="btn-outline" @click="viewTicket(item)">View Ticket</v-btn>
          </div>
        </template>

        <template #no-data>
          <v-alert type="info" variant="tonal" title="No compensations to show">Try changing filters.</v-alert>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="2200">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script>
import axiosInstance from '@/utils/axiosInstance'

const USE_MOCK = false // koristi backend

export default {
  name: 'CompensationsView',
  data() {
    return {
      headers: [
        { title: 'Subject', key: 'subject', sortable: false, width: 240 },
        { title: 'Passenger', key: 'passenger', sortable: true, width: 180 },
        { title: 'Proposed By', key: 'proposedBy', sortable: true, width: 150 },
        { title: 'Type', key: 'type', sortable: true, width: 120 },
        { title: 'Amount/Value', key: 'amount', sortable: true, width: 140 },
        { title: 'Date Proposed', key: 'dateProposed', sortable: true, width: 160 },
        { title: 'Status', key: 'statusName', sortable: true, width: 120 },
        { title: 'Actions', key: 'actions', sortable: false, align: 'end', width: 220 },
      ],
      compensationsRaw: [],
      statuses: [
        { id: 1, name: 'Proposed', code: 'PROPOSED' },
        { id: 2, name: 'Approved', code: 'APPROVED' },
        { id: 3, name: 'Rejected', code: 'REJECTED' },
      ],
      operatorOptions: ['mark', 'sarah', 'john', 'julia', 'pavel'],
      typeOptions: ['REFUND', 'VOUCHER', 'DISCOUNT'],
      filters: { assignee: null, statusName: null, type: null, dateFrom: null, dateTo: null },
      loading: { compensations: false },
      snackbar: { show: false, text: '', color: 'success' },
    }
  },

  computed: {
    statusOptions() { return this.statuses },
    rows() {
      const f = this.filters
      const from = f.dateFrom ? new Date(f.dateFrom) : null
      const to = f.dateTo ? new Date(f.dateTo) : null

      return this.compensationsRaw.filter(it => {
        const okAssignee =
          !f.assignee ||
          String(it.assigneeUsername || '').toLowerCase() === String(f.assignee).toLowerCase()

        const statusName = (it.statusName || it.status?.name || '').toString()
        const okStatus =
          !f.statusName ||
          statusName.toLowerCase().includes(String(f.statusName).toLowerCase())

        const okType =
          !f.type ||
          (it.type && String(it.type).toUpperCase() === String(f.type).toUpperCase())

        const d = it.dateProposed || it.createdAt
        const dd = d ? new Date(d) : null
        const okFrom = !from || (dd && dd >= from)
        const okTo = !to || (dd && dd <= new Date(to.getTime() + 24 * 60 * 60 * 1000 - 1))

        return okAssignee && okStatus && okType && okFrom && okTo
      })
    },
  },

  async created() {
    await this.fetchCompensations()
  },

  methods: {
    async fetchCompensations() {
      try {
        this.loading.compensations = true
        if (USE_MOCK) {
          this.compensationsRaw = this.mockData()
        } else {
          const resp = await axiosInstance.get('/compensation/all')
          const payload = resp?.data
          console.log('Fetched compensations:', payload)
          const list = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : [])
          this.compensationsRaw = list.map(this.normalizeRow)
        }
      } catch (e) {
        console.error('Failed to load compensations', e)
        this.compensationsRaw = []
      } finally {
        this.loading.compensations = false
      }
    },

    // === Normalizacija ===
    normalizeRow(it) {
      const currency = this.normalizeCurrency(it.currency ?? 'EUR')
      const amount = it.amount ?? it.amountValue ?? null

      return {
        id: it.id,
        complaintId: it.complaintId ?? it.ticketId ?? it.caseId ?? it.id,
        subject: it.subject ?? it.complaint?.subject ?? it.title ?? it.reason ?? null,
        passenger: it.complaint.createdByUsername ?? it.passengerName ?? it.passenger ?? null,
        proposedBy: it.complaint.assigneeUsername ?? it.createdBy ?? it.operatorUsername ?? null,
        assigneeUsername: it.complaint.assigneeUsername ?? it.assignee ?? it.managerUsername ?? null,
        type: it.type ?? it.compensationType ?? null, // DISCOUNT | VOUCHER | REFUND | ...
        amount,
        currency,
        value: it.value ?? null,
        statusId: it.statusId ?? it.status?.id ?? it.complaint?.statusId ?? null,
        statusName: it.status ?? it.status?.name ?? it.complaint?.status?.name ?? it.statusCode ?? null,
        dateProposed: it.dateProposed ?? it.createdAt ?? null,
        status: it.status ?? null,
        _raw: it,
      }
    },

    normalizeCurrency(cur) {
      if (!cur) return null
      const s = String(cur).trim()
      if (s === '€') return 'EUR'
      if (s === '$') return 'USD'
      if (s.toUpperCase() === 'DIN' || s === 'дин' || s.toUpperCase() === 'RSD') return 'RSD'
      if (s === '%') return '%'
      return s.toUpperCase()
    },

    isIsoCurrency(cur) {
      return /^[A-Z]{3}$/.test(cur || '')
    },

    // === Akcije ===
    async approve(item) {
      if (USE_MOCK) return this.toast(`Approved #${item.id}`)
      await axiosInstance.post(`/compensation/${item.id}/approve`)
      this.toast('Compensation approved.'); await this.fetchCompensations()
    },
    async reject(item) {
      if (USE_MOCK) return this.toast(`Rejected #${item.id}`)
      await axiosInstance.post(`/compensation/${item.id}/reject`)
      this.toast('Compensation rejected.'); await this.fetchCompensations()
    },
    viewTicket(item) {
      const id = item.complaintId ?? item.id
      this.$router.push({ name: 'ManagerTicketDetails', params: { id } })
    },

    // === Helpers ===
    formatDate(d) { if (!d) return '—'; try { return new Date(d).toLocaleString() } catch { return String(d) } },
    formatAmount(amount, currency, type) {
      const cur = this.normalizeCurrency(currency)
      // Percent-like
      if (String(type).toUpperCase() === 'DISCOUNT' || cur === '%') {
        const n = Number(amount)
        return Number.isFinite(n) ? `${n}%` : `${amount}%`
      }
      // Currency-like
      const n = Number(amount)
      if (this.isIsoCurrency(cur) && Number.isFinite(n)) {
        try {
          return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(n)
        } catch { /* fallthrough */ }
      }
      // Fallback
      return [Number.isFinite(n) ? n : amount, cur].filter(Boolean).join(' ')
    },
    toast(text, color = 'success') { this.snackbar = { show: true, text, color } },

    goTickets()        { this.$router.push({ name: 'ManagerTicketsView' }) },
    goEscalations()  { this.$router.push({ name: 'EscalationsView' }) },
    goAnalytics()      { this.$router.push({ name: 'Analytics' }) },
    // === MOCK (ako zatreba) ===
    mockData() {
      const rows = [
        { id: 1027, complaintId: 1027, subject: 'Refund for overcharge', passenger: 'Monish Mcclochan', proposedBy: 'Mark Brown', type: 'PROPOSED', amount: 120, currency: 'EUR', dateProposed: '2025-09-25', statusName: 'Funding', assigneeUsername: 'mark' },
        { id: 1030, complaintId: 1030, subject: 'Lost baggage transfer', passenger: 'Marco Botton', proposedBy: 'Sarah Collins', type: 'APPROVED', amount: 80, currency: 'EUR', dateProposed: '2025-09-23', statusName: 'Approved', assigneeUsername: 'sarah' },
        { id: 1032, complaintId: 1032, subject: 'Tour guide missing', passenger: 'Nellie Liberty', proposedBy: 'John Doe', type: 'DISCOUNT', amount: 15, currency: '%', dateProposed: '2025-09-22', statusName: 'Funding', assigneeUsername: 'john' },
      ]
      return rows.map(this.normalizeRow)
    },
  },
}
</script>

<style scoped>
.tickets-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.page-title {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 800;
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.filter-item {
  min-width: 200px;
}

.operator-table :deep(thead th) {
  font-weight: 700;
}

.cell-title .subject {
  font-weight: 700;
}

.cell-title .meta {
  font-size: .8rem;
  color: rgba(0, 0, 0, .54);
  display: flex;
  gap: 6px;
}

.row-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.header-actions { display: flex; gap: 8px; margin-bottom: 12px; }

.btn-outline {
  text-transform: none;
  border-radius: 10px !important;
  border: 1.5px solid rgba(0, 0, 0, .38) !important;
}
</style>
