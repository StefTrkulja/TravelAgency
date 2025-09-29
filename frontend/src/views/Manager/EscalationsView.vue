<!-- src/views/EscalationsView.vue -->
<template>
  <v-container class="page-container">
    <!-- Warm-themed Header -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-icon">
          <v-icon size="32" color="white">mdi-alert-octagon-outline</v-icon>
        </div>
        <div class="header-text">
          <h1 class="page-title">Escalations Management</h1>
          <p class="page-subtitle">Monitor and resolve escalated cases</p>
        </div>
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

        <!-- Compensations Card -->
        <v-col cols="12" md="4">
          <v-card 
            class="navigation-card compensations-card cursor-pointer" 
            @click="goCompensations()"
            elevation="2"
          >
            <v-card-text class="navigation-card-content">
              <div class="nav-icon-container">
                <v-icon size="32" color="var(--warm-orange)">mdi-cash-multiple</v-icon>
              </div>
              <div class="nav-text-content">
                <h3 class="nav-title">Compensations</h3>
                <p class="nav-subtitle">Manage customer compensations</p>
              </div>
              <v-icon color="var(--warm-orange-light)" class="nav-arrow">mdi-chevron-right</v-icon>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Manager Tickets Card -->
        <v-col cols="12" md="4">
          <v-card 
            class="navigation-card tickets-card cursor-pointer" 
            @click="goManagerTickets()"
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

    <!-- Enhanced Filters Card -->
    <v-card class="filters-card">
      <div class="filters-header">
        <h3 class="filters-title">
          <v-icon>mdi-filter-variant</v-icon>
          Filter Escalations
        </h3>
      </div>
      <div class="filters-content">
        <div class="filters-row">
          <div class="filter-item">
            <v-select
              v-model="filters.statusId"
              :items="statusOptions"
              item-title="name"
              item-value="id"
              label="Status"
              clearable
              density="comfortable"
              variant="outlined"
              :loading="loading.statuses"
              :disabled="loading.statuses"
              prepend-inner-icon="mdi-bookmark-outline"
            />
          </div>
          <div class="filter-item">
            <v-select
              v-model="filters.assignee"
              :items="operatorOptions"
              label="Assigned Manager"
              clearable
              density="comfortable"
              variant="outlined"
              :loading="loading.operators"
              :disabled="loading.operators"
              prepend-inner-icon="mdi-account-circle-outline"
            />
          </div>
          <div class="filter-actions">
            <v-btn 
              color="primary" 
              class="primary-btn"
              prepend-icon="mdi-magnify"
              @click="fetchEscalations"
            >
              Search
            </v-btn>
            <v-btn 
              variant="outlined" 
              class="clear-btn"
              prepend-icon="mdi-filter-off"
              @click="clearFilters"
            >
              Clear
            </v-btn>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Enhanced Escalations Table -->
    <v-card class="escalations-card">
      <v-data-table
        :headers="headers"
        :items="rows"
        :loading="loading.escalations"
        item-key="id"
        density="comfortable"
        class="warm-table"
      >
        <template #loading>
          <v-skeleton-loader type="table-row@5" />
        </template>

        <!-- Case ID -->
        <template #item.id="{ item }">
          <div class="case-id">
            #{{ item.id }}
          </div>
        </template>

        <!-- Assigned Manager -->
        <template #item.assigneeUsername="{ item }">
          <div class="manager-info">
            <v-icon size="16" class="mr-1">mdi-account-tie</v-icon>
            <span v-if="item.assigneeUsername" class="manager-name">{{ item.assigneeUsername }}</span>
            <span v-else class="unassigned">Unassigned</span>
          </div>
        </template>

        <!-- Escalation Reason -->
        <template #item.reason="{ item }">
          <v-chip 
            size="small" 
            variant="tonal"
            :color="getReasonColor(item.reason)"
            class="reason-chip"
          >
            <v-icon size="14" class="mr-1">{{ getReasonIcon(item.reason) }}</v-icon>
            {{ item.reason || item.escalationReason || 'Not specified' }}
          </v-chip>
        </template>

        <!-- Date Escalated -->
        <template #item.dateEscalated="{ item }">
          <div class="date-info">
            <v-icon size="14" class="mr-1">mdi-clock-outline</v-icon>
            {{ formatDate(item.dateEscalated || item.escalatedAt) }}
          </div>
        </template>

        <!-- Status -->
        <template #item.statusName="{ item }">
          <v-chip 
            size="small" 
            variant="tonal"
            :color="getStatusColor(item.statusName)"
            class="status-chip"
          >
            <v-icon size="14" class="mr-1">{{ getStatusIcon(item.statusName) }}</v-icon>
            {{ item.statusName || item.status?.name || item.statusCode || 'Unknown' }}
          </v-chip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="actions-container">
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
            <v-icon size="64" color="grey lighten-2">mdi-alert-circle-outline</v-icon>
            <h3 class="mt-4 mb-2">No escalations found</h3>
            <p class="text-medium-emphasis">Try adjusting your filters or check back later.</p>
          </div>
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
    /* ==================== NAVIGATION ==================== */
    goAnalytics() {
      this.$router.push({ name: 'AnalyticsView' })
    },
    goCompensations() {
      this.$router.push({ name: 'CompensationsView' })
    },
    goManagerTickets() {
      this.$router.push({ name: 'ManagerTicketsView' })
    },

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

    clearFilters() {
      this.filters = {
        statusId: null,
        assignee: null,
      }
    },

    getReasonColor(reason) {
      switch (String(reason || '').toLowerCase()) {
        case 'sla violation': 
        case 'sla_violation': return 'error'
        case 'customer complaint':
        case 'customer_complaint': return 'warning'
        case 'complexity':
        case 'technical issue':
        case 'technical_issue': return 'info'
        default: return 'primary'
      }
    },

    getReasonIcon(reason) {
      switch (String(reason || '').toLowerCase()) {
        case 'sla violation':
        case 'sla_violation': return 'mdi-clock-alert'
        case 'customer complaint':
        case 'customer_complaint': return 'mdi-account-alert'
        case 'complexity': return 'mdi-puzzle-outline'
        case 'technical issue':
        case 'technical_issue': return 'mdi-wrench'
        default: return 'mdi-alert-outline'
      }
    },

    getStatusColor(status) {
      switch (String(status || '').toLowerCase()) {
        case 'open':
        case 'escalated': return 'error'
        case 'in progress':
        case 'in_progress': return 'warning'
        case 'resolved':
        case 'closed': return 'success'
        default: return 'grey'
      }
    },

    getStatusIcon(status) {
      switch (String(status || '').toLowerCase()) {
        case 'open':
        case 'escalated': return 'mdi-alert-circle'
        case 'in progress':
        case 'in_progress': return 'mdi-progress-clock'
        case 'resolved':
        case 'closed': return 'mdi-check-circle'
        default: return 'mdi-help-circle'
      }
    },

    goTickets()        { this.$router.push({ name: 'ManagerTicketsView' }) },
    goCompensations()  { this.$router.push({ name: 'CompensationsView' }) },
    goAnalytics()      { this.$router.push({ name: 'AnalyticsView' }) },
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

.escalations-card {
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

  .case-id {
    font-weight: 700;
    color: var(--warm-primary);
    font-size: 1rem;
    background: var(--warm-light);
    padding: 4px 8px;
    border-radius: 6px;
    display: inline-block;
    border: 1px solid rgba(212, 115, 10, 0.2);
  }

  .manager-info {
    display: flex;
    align-items: center;

    .manager-name {
      font-weight: 600;
      color: #333;
    }

    .unassigned {
      color: #999;
      font-style: italic;
    }
  }

  .reason-chip {
    border-radius: 20px !important;
    font-weight: 600 !important;
    font-size: 0.8rem !important;
    text-transform: capitalize !important;

    :deep(.v-chip__content) {
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
    }
  }

  .date-info {
    display: flex;
    align-items: center;
    color: #666;
    font-size: 0.9rem;
  }

  .status-chip {
    border-radius: 20px !important;
    font-weight: 600 !important;
    font-size: 0.8rem !important;
    text-transform: capitalize !important;

    :deep(.v-chip__content) {
      display: flex !important;
      align-items: center !important;
      gap: 4px !important;
    }
  }

  .actions-container {
    display: flex;
    gap: 8px;
    justify-content: flex-end;

    .action-btn {
      border-radius: 10px !important;
      text-transform: none !important;
      font-weight: 600 !important;
      font-size: 0.8rem !important;
      padding: 0 12px !important;
      height: 32px !important;
      min-width: 100px !important;
      transition: all 0.3s ease !important;

      &:hover {
        
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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

    &.compensations-card:hover {
      background: linear-gradient(135deg, var(--warm-cream), #e8f8e8);
    }

    &.tickets-card:hover {
      background: linear-gradient(135deg, var(--warm-cream), #f0f0f8);
    }
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
      min-width: 80px !important;
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

  .manager-info .manager-name {
    color: #e0e0e0;
  }

  .date-info {
    color: #b0b0b0;
  }
}
</style>
