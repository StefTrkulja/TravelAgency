<template>
  <v-container class="py-6 compensations-container">
    <!-- Header -->
    <div class="compensations-header animate-fade-in">
      <div class="header-content">
        <v-icon size="32" color="var(--warm-orange)" class="mr-3">mdi-gift-outline</v-icon>
        <div>
          <h1 class="page-title font-heading">Compensations Management</h1>
          <p class="page-subtitle">Review and manage customer compensation requests</p>
        </div>
      </div>
      
      <div class="header-actions">
        <v-btn 
          variant="outlined" 
          class="nav-btn" 
          @click="goTickets"
          prepend-icon="mdi-ticket-account"
        >
          Tickets
        </v-btn>
        <v-btn 
          variant="outlined" 
          class="nav-btn" 
          @click="goEscalations"
          prepend-icon="mdi-arrow-up-bold"
        >
          Escalations
        </v-btn>
        <v-btn 
          variant="outlined" 
          class="nav-btn" 
          @click="goAnalytics"
          prepend-icon="mdi-chart-line"
        >
          Analytics
        </v-btn>
      </div>
    </div>

    <!-- Navigation Cards -->
    <div class="navigation-cards-section mb-6">
      <v-row>
        <!-- Analytics Card -->
        <v-col cols="12" md="4">
          <v-card 
            class="navigation-card analytics-card cursor-pointer" 
            @click="goAnalytics()"
            elevation="2"
          >
            <v-card-text class="navigation-card-content">
              <div class="nav-icon-container">
                <v-icon size="32" color="var(--warm-orange)">mdi-chart-line</v-icon>
              </div>
              <div class="nav-text-content">
                <h3 class="nav-title">Analytics</h3>
                <p class="nav-subtitle">View reports and statistics</p>
              </div>
              <v-icon color="var(--warm-orange-light)" class="nav-arrow">mdi-chevron-right</v-icon>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Escalations Card -->
        <v-col cols="12" md="4">
          <v-card 
            class="navigation-card escalations-card cursor-pointer" 
            @click="goEscalations()"
            elevation="2"
          >
            <v-card-text class="navigation-card-content">
              <div class="nav-icon-container">
                <v-icon size="32" color="var(--warm-orange)">mdi-alert-octagon</v-icon>
              </div>
              <div class="nav-text-content">
                <h3 class="nav-title">Escalations</h3>
                <p class="nav-subtitle">Handle escalated cases</p>
              </div>
              <v-icon color="var(--warm-orange-light)" class="nav-arrow">mdi-chevron-right</v-icon>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Manager Tickets Card -->
        <v-col cols="12" md="4">
          <v-card 
            class="navigation-card tickets-card cursor-pointer" 
            @click="goTickets()"
            elevation="2"
          >
            <v-card-text class="navigation-card-content">
              <div class="nav-icon-container">
                <v-icon size="32" color="var(--warm-orange)">mdi-ticket-account</v-icon>
              </div>
              <div class="nav-text-content">
                <h3 class="nav-title">Manager Tickets</h3>
                <p class="nav-subtitle">View all tickets overview</p>
              </div>
              <v-icon color="var(--warm-orange-light)" class="nav-arrow">mdi-chevron-right</v-icon>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- Filters -->
    <v-card class="filters-card" elevation="0">
      <v-card-title class="card-title">
        <v-icon class="mr-2">mdi-filter-outline</v-icon>
        Filters
      </v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select 
              v-model="filters.statusName" 
              :items="statusOptions" 
              item-title="name" 
              item-value="name" 
              label="Status"
              clearable 
              density="comfortable" 
              variant="outlined" 
              class="filter-item"
              prepend-inner-icon="mdi-flag-outline"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-select 
              v-model="filters.type" 
              :items="typeOptions" 
              label="Compensation Type" 
              clearable 
              density="comfortable"
              variant="outlined" 
              class="filter-item"
              prepend-inner-icon="mdi-tag-outline"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field 
              v-model="filters.dateFrom" 
              label="From Date" 
              type="date" 
              density="comfortable" 
              variant="outlined"
              class="filter-item"
              prepend-inner-icon="mdi-calendar-start"
            />
          </v-col>
          <v-col cols="12" md="3">
            <v-text-field 
              v-model="filters.dateTo" 
              label="To Date" 
              type="date" 
              density="comfortable" 
              variant="outlined"
              class="filter-item"
              prepend-inner-icon="mdi-calendar-end"
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card class="compensations-table-card" elevation="0">
      <v-data-table 
        :headers="headers" 
        :items="rows" 
        :loading="loading.compensations" 
        item-key="id"
        class="compensations-table" 
        density="comfortable"
        :items-per-page="15"
      >
        <template #loading>
          <v-skeleton-loader type="table-row@6" />
        </template>

        <template #item.subject="{ item }">
          <div class="subject-cell">
            <div class="subject-title">{{ item.subject || '—' }}</div>
            <div class="subject-meta">
              <v-chip size="x-small" variant="text" class="case-id-chip">
                Case #{{ item.complaintId ?? item.id }}
              </v-chip>
            </div>
          </div>
        </template>

        <template #item.type="{ item }">
          <v-chip 
            size="small" 
            variant="tonal" 
            class="type-chip"
            :color="getTypeColor(item.type)"
          >
            <v-icon size="16" class="mr-1">{{ getTypeIcon(item.type) }}</v-icon>
            {{ item.type || '—' }}
          </v-chip>
        </template>

        <template #item.amount="{ item }">
          <div class="amount-cell">
            <span v-if="item.amount != null" class="amount-value">
              {{ formatAmount(item.amount, item.currency, item.type) }}
            </span>
            <span v-else-if="item.value != null" class="amount-value">
              {{ item.value }}
            </span>
            <span v-else class="amount-placeholder">—</span>
          </div>
        </template>

        <template #item.dateProposed="{ item }">
          <div class="date-cell">
            <v-icon size="16" class="mr-1" color="var(--warm-orange)">mdi-calendar</v-icon>
            {{ formatDate(item.dateProposed || item.createdAt) }}
          </div>
        </template>

        <template #item.statusName="{ item }">
          <v-chip 
            size="small" 
            variant="outlined"
            class="status-chip"
            :class="`status-${getStatusCode(item)?.toLowerCase()}`"
          >
            <v-icon size="16" class="mr-1">{{ getStatusIcon(item) }}</v-icon>
            {{ item.statusName || item.status?.name || item.statusCode || '—' }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <div class="row-actions">
            <v-btn 
              variant="elevated" 
              size="small" 
              color="success"
              class="action-btn approve-btn" 
              @click="approve(item)"
              prepend-icon="mdi-check"
            >
              Approve
            </v-btn>
            <v-btn 
              variant="outlined" 
              size="small" 
              color="error"
              class="action-btn reject-btn" 
              @click="reject(item)"
              prepend-icon="mdi-close"
            >
              Reject
            </v-btn>
            <v-btn 
              variant="outlined" 
              size="small" 
              class="action-btn view-btn" 
              @click="viewTicket(item)"
              prepend-icon="mdi-eye-outline"
            >
              View Ticket
            </v-btn>
          </div>
        </template>

        <template #no-data>
          <div class="no-data-state">
            <v-icon size="64" color="grey lighten-2">mdi-gift-off-outline</v-icon>
            <h3 class="mt-4 mb-2">No compensations found</h3>
            <p class="text-medium-emphasis">Try adjusting your filters or check back later.</p>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar 
      v-model="snackbar.show" 
      :color="snackbar.color" 
      timeout="2200"
      location="bottom right"
      rounded="lg"
    >
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

    // === Helper functions for template ===
    getTypeColor(type) {
      switch (String(type || '').toUpperCase()) {
        case 'REFUND': return 'success'
        case 'VOUCHER': return 'primary'
        case 'DISCOUNT': return 'warning'
        default: return 'grey'
      }
    },

    getTypeIcon(type) {
      switch (String(type || '').toUpperCase()) {
        case 'REFUND': return 'mdi-cash-refund'
        case 'VOUCHER': return 'mdi-ticket-outline'
        case 'DISCOUNT': return 'mdi-percent'
        default: return 'mdi-gift-outline'
      }
    },

    getStatusCode(status) {
      if (typeof status === 'object' && status?.code) return status.code
      return String(status || '').toUpperCase()
    },

    getStatusIcon(status) {
      const code = this.getStatusCode(status)
      switch (code) {
        case 'PROPOSED': return 'mdi-clock-outline'
        case 'APPROVED': return 'mdi-check-circle'
        case 'REJECTED': return 'mdi-close-circle'
        default: return 'mdi-help-circle-outline'
      }
    },

    goTickets()        { this.$router.push({ name: 'ManagerTicketsView' }) },
    goEscalations()  { this.$router.push({ name: 'EscalationsView' }) },
    goAnalytics()      { this.$router.push({ name: 'AnalyticsView' }) },
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

<style scoped lang="scss">
:root {
  --warm-primary: #D4730A;
  --warm-secondary: #F59E0B;
  --warm-accent: #F97316;
  --warm-light: #FEF3E2;
  --warm-lighter: #FFFBF5;
  --warm-gradient: linear-gradient(135deg, #D4730A 0%, #F59E0B 100%);
  --warm-gradient-light: linear-gradient(135deg, #FEF3E2 0%, #FFFBF5 100%);
}

.page-container {
  padding: 24px;
  background: var(--warm-lighter);
  min-height: 100vh;
}

.page-header {
  background: var(--warm-gradient);
  border-radius: 16px;
  padding: 24px 32px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(212, 115, 10, 0.15);
  animation: slideInFromTop 0.6s ease-out;

  .header-content {
    display: flex;
    align-items: center;
    gap: 16px;

    .header-icon {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 12px;
      padding: 12px;
      backdrop-filter: blur(10px);
    }

    .header-text {
      .page-title {
        color: white;
        font-size: 2rem;
        font-weight: 700;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .page-subtitle {
        color: rgba(255, 255, 255, 0.9);
        font-size: 1.1rem;
        margin: 4px 0 0 0;
        font-weight: 400;
      }
    }
  }
}

.filters-card {
  border-radius: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(212, 115, 10, 0.1);
  animation: slideInFromLeft 0.6s ease-out 0.1s both;

  .filters-header {
    background: var(--warm-gradient-light);
    padding: 20px 24px;
    border-bottom: 1px solid rgba(212, 115, 10, 0.1);

    .filters-title {
      display: flex;
      align-items: center;
      gap: 12px;
      color: var(--warm-primary);
      font-size: 1.2rem;
      font-weight: 600;
      margin: 0;
    }
  }

  .filters-content {
    padding: 24px;

    .filters-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      align-items: flex-end;

      .filter-item {
        min-width: 200px;
        flex: 1;

        :deep(.v-field) {
          border-radius: 12px;
          
          &:hover {
            box-shadow: 0 2px 8px rgba(212, 115, 10, 0.15);
          }
        }

        :deep(.v-field--focused) {
          box-shadow: 0 0 0 2px rgba(212, 115, 10, 0.2);
        }

        :deep(.v-selection-control) {
          .v-selection-control__wrapper {
            color: var(--warm-primary);
          }
        }
      }

      .filter-actions {
        display: flex;
        gap: 12px;
        align-items: flex-end;
        flex-shrink: 0;

        .v-btn {
          border-radius: 12px;
          text-transform: none;
          font-weight: 600;
          min-width: 100px;
          height: 40px;

          &.primary-btn {
            background: var(--warm-gradient) !important;
            color: white;
            box-shadow: 0 4px 12px rgba(212, 115, 10, 0.3);

            &:hover {
              
              box-shadow: 0 6px 20px rgba(212, 115, 10, 0.4);
            }
          }

          &.clear-btn {
            border: 2px solid var(--warm-primary);
            color: var(--warm-primary);

            &:hover {
              background: var(--warm-light);
              
            }
          }
        }
      }
    }
  }
}

.compensations-card {
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(212, 115, 10, 0.1);
  overflow: hidden;
  animation: slideInFromRight 0.6s ease-out 0.2s both;

  :deep(.v-data-table) {
    background: transparent;

    .v-data-table__wrapper {
      border-radius: 0;
    }

    .v-data-table-header {
      background: var(--warm-gradient-light);

      th {
        background: transparent !important;
        color: var(--warm-primary) !important;
        font-weight: 600 !important;
        font-size: 0.9rem !important;
        border-bottom: 2px solid rgba(212, 115, 10, 0.2) !important;
        padding: 16px 12px !important;

        .v-data-table-header__content {
          font-weight: 600;
        }
      }
    }

    tbody tr {
      transition: all 0.3s ease;

      &:hover {
        background: var(--warm-light) !important;
        
        box-shadow: 0 4px 12px rgba(212, 115, 10, 0.1);
      }

      td {
        padding: 16px 12px !important;
        border-bottom: 1px solid rgba(212, 115, 10, 0.1) !important;
        vertical-align: middle !important;
      }
    }
  }

  .compensation-subject {
    font-weight: 600;
    color: var(--warm-primary);
    font-size: 0.95rem;
  }

  .compensation-passenger {
    font-weight: 500;
    color: #333;
  }

  .compensation-proposer {
    color: #666;
    font-size: 0.9rem;
  }

  .type-chip {
    border-radius: 20px !important;
    font-weight: 600 !important;
    font-size: 0.8rem !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    min-width: 90px !important;
    justify-content: center !important;

    :deep(.v-chip__content) {
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
    }
  }

  .amount-display {
    font-weight: 700;
    font-size: 1rem;
    color: var(--warm-primary);
    background: var(--warm-light);
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid rgba(212, 115, 10, 0.2);
  }

  .status-chip {
    border-radius: 20px !important;
    font-weight: 600 !important;
    font-size: 0.8rem !important;
    text-transform: uppercase !important;
    letter-spacing: 0.5px !important;
    min-width: 100px !important;
    justify-content: center !important;

    :deep(.v-chip__content) {
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
    }

    &.status-proposed {
      background: #FFF3E0 !important;
      color: #F57C00 !important;
      border: 1px solid #FFB74D !important;
    }

    &.status-approved {
      background: #E8F5E8 !important;
      color: #2E7D32 !important;
      border: 1px solid #81C784 !important;
    }

    &.status-rejected {
      background: #FFEBEE !important;
      color: #C62828 !important;
      border: 1px solid #E57373 !important;
    }
  }

  .actions-container {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    flex-wrap: wrap;

    .action-btn {
      border-radius: 10px !important;
      text-transform: none !important;
      font-weight: 600 !important;
      font-size: 0.8rem !important;
      padding: 0 12px !important;
      height: 32px !important;
      min-width: 80px !important;
      transition: all 0.3s ease !important;

      &:hover {
        
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      &.approve-btn {
        background: var(--warm-gradient) !important;
        color: white !important;
        border: none !important;

        &:hover {
          box-shadow: 0 4px 12px rgba(212, 115, 10, 0.4) !important;
        }
      }

      &.reject-btn {
        border: 2px solid #f44336 !important;
        color: #f44336 !important;

        &:hover {
          background: #ffebee !important;
        }
      }

      &.view-btn {
        border: 2px solid var(--warm-primary) !important;
        color: var(--warm-primary) !important;

        &:hover {
          background: var(--warm-light) !important;
        }
      }
    }
  }

  .no-data-state {
    text-align: center;
    padding: 48px 24px;
    color: #666;

    h3 {
      color: var(--warm-primary);
      font-weight: 600;
    }

    .v-icon {
      color: rgba(212, 115, 10, 0.3) !important;
    }
  }
}

// Animations
@keyframes slideInFromTop {
  from {
    opacity: 0;
    /* transform: translateY(...) uklonjeno za bolje UX */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInFromLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInFromRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Navigation Cards */
.navigation-cards-section {
  .navigation-card {
    background: linear-gradient(135deg, var(--warm-cream), var(--warm-cream-light));
    border: 1px solid var(--warm-orange-light);
    border-radius: 12px !important;
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 8px 25px rgba(212, 115, 10, 0.15) !important;
      border-color: var(--warm-orange);
    }

    .navigation-card-content {
      display: flex;
      align-items: center;
      padding: 1.5rem !important;
      gap: 1rem;
    }

    .nav-icon-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 48px;
    }

    .nav-text-content {
      flex: 1;
      
      .nav-title {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--warm-dark);
        margin: 0 0 0.25rem 0;
      }

      .nav-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }
    }

    .nav-arrow {
      opacity: 0.7;
      transition: all 0.3s ease;
    }

    &:hover .nav-arrow {
      opacity: 1;
      transform: translateX(4px);
    }

    &.analytics-card:hover {
      background: linear-gradient(135deg, var(--warm-cream), #e8f4f8);
    }

    &.escalations-card:hover {
      background: linear-gradient(135deg, var(--warm-cream), #f8e8e8);
    }

    &.tickets-card:hover {
      background: linear-gradient(135deg, var(--warm-cream), #f0f0f8);
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Responsive design
@media (max-width: 768px) {
  .page-container {
    padding: 16px;
  }

  .page-header {
    padding: 20px 24px;
    margin-bottom: 20px;

    .header-content {
      gap: 12px;

      .header-text .page-title {
        font-size: 1.6rem;
      }
    }
  }

  /* Navigation Cards Mobile */
  .navigation-cards-section {
    .navigation-card {
      .navigation-card-content {
        padding: 1rem !important;
        
        .nav-text-content {
          .nav-title {
            font-size: 1rem;
          }

          .nav-subtitle {
            font-size: 0.8rem;
          }
        }
      }
    }
  }

  .filters-content {
    padding: 20px;

    .filters-row {
      flex-direction: column;

      .filter-item {
        min-width: 100%;
      }

      .filter-actions {
        width: 100%;
        justify-content: stretch;

        .v-btn {
          flex: 1;
        }
      }
    }
  }

  .actions-container {
    justify-content: center;

    .action-btn {
      min-width: 70px !important;
      font-size: 0.75rem !important;
    }
  }
}

// Dark mode support
@media (prefers-color-scheme: dark) {
  :root {
    --warm-lighter: #1a1a1a;
    --warm-light: #2d2d2d;
  }

  .page-container {
    background: var(--warm-lighter);
  }

  .compensation-subject,
  .compensation-passenger {
    color: #e0e0e0;
  }

  .compensation-proposer {
    color: #b0b0b0;
  }
}
</style>
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;

