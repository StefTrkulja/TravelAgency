<template>
  <v-container class="py-6 operator-tickets-container">
    <!-- Header + Filters -->
    <div class="tickets-header animate-fade-in">
      <div class="header-content">
        <v-icon size="32" color="var(--warm-orange)" class="mr-3">mdi-ticket-account</v-icon>
        <div>
          <h1 class="page-title font-heading">Operator Tickets</h1>
          <p class="page-subtitle">Manage and track customer support tickets</p>
        </div>
      </div>
      
      <div class="filters-section">
        <v-select
          v-model="filters.statusId"
          :items="statusOptions"
          item-title="name"
          item-value="id"
          label="Filter by Status"
          clearable
          density="comfortable"
          variant="outlined"
          class="filter-item"
          :loading="loading.statuses"
          :disabled="loading.statuses"
          @update:model-value="fetchTickets"
          prepend-inner-icon="mdi-filter-outline"
        />
        <v-select
          v-model="filters.category"
          :items="categoryOptions"
          label="Filter by Category"
          clearable
          density="comfortable"
          variant="outlined"
          class="filter-item"
          @update:model-value="fetchTickets"
          prepend-inner-icon="mdi-tag-outline"
        />
        <v-select
          v-model="filters.priority"
          :items="priorityOptions"
          label="Filter by Priority"
          clearable
          density="comfortable"
          variant="outlined"
          class="filter-item"
          @update:model-value="fetchTickets"
          prepend-inner-icon="mdi-flag-outline"
        />
      </div>
    </div>

    <!-- Table -->
    <v-card class="tickets-table-card" elevation="0">
      <v-data-table
        :headers="headers"
        :items="tickets"
        :loading="loading.tickets"
        item-key="id"
        class="operator-table"
        density="comfortable"
        :items-per-page="15"
      >
        <template #loading>
          <v-skeleton-loader type="table-row@5" />
        </template>

        <template #item.subject="{ item }">
          <div class="subject-cell">
            <div class="subject-title">{{ item.subject }}</div>
            <div class="subject-meta">
              <v-chip size="x-small" variant="text" class="ticket-id">#{{ item.id }}</v-chip>
              <span class="meta-separator">•</span>
              <span class="created-date">{{ formatDate(item.createdAt) }}</span>
            </div>
          </div>
        </template>

        <template #item.category="{ item }">
          <v-chip 
            size="small" 
            variant="tonal" 
            class="category-chip"
            :color="getCategoryColor(item.category)"
          >
            {{ item.category }}
          </v-chip>
        </template>

        <template #item.priority="{ item }">
          <v-chip 
            size="small" 
            :color="priorityColor(item.priority)" 
            variant="flat"
            class="priority-chip"
          >
            <v-icon size="16" class="mr-1">{{ getPriorityIcon(item.priority) }}</v-icon>
            {{ item.priority || '—' }}
          </v-chip>
        </template>

        <template #item.statusName="{ item }">
          <v-chip 
            size="small" 
            variant="outlined"
            class="status-chip"
            :class="`status-${getStatusCode(item)?.toLowerCase()}`"
          >
            <v-icon size="16" class="mr-1">{{ getStatusIcon(item) }}</v-icon>
            {{ item.statusName || item.statusCode || item.status?.name }}
          </v-chip>
        </template>

        <template #item.assigneeUsername="{ item }">
          <div class="assignee-cell">
            <v-avatar v-if="item.assigneeUsername" size="24" class="mr-2">
              <v-icon size="16">mdi-account</v-icon>
            </v-avatar>
            <span v-if="item.assigneeUsername" class="assignee-name">{{ item.assigneeUsername }}</span>
            <span v-else class="unassigned-text">
              <v-icon size="16" class="mr-1">mdi-account-off</v-icon>
              Unassigned
            </span>
          </div>
        </template>

        <template #item.actions="{ item }">
          <div class="row-actions">
            <v-btn
              v-if="canAccept(item)"
              color="primary"
              size="small"
              variant="elevated"
              class="accept-btn"
              :loading="acceptingId === item.id"
              @click="accept(item)"
              prepend-icon="mdi-check"
            >
              Accept
            </v-btn>
            <v-btn
              v-else
              variant="outlined"
              size="small"
              class="view-btn"
              @click="viewDetails(item)"
              prepend-icon="mdi-eye-outline"
            >
              View Details
            </v-btn>
          </div>
        </template>

        <template #no-data>
          <div class="no-data-state">
            <v-icon size="64" color="grey lighten-2">mdi-ticket-outline</v-icon>
            <h3 class="mt-4 mb-2">No tickets found</h3>
            <p class="text-medium-emphasis">Try adjusting your filters or check back later.</p>
          </div>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script>
import axiosInstance from '@/utils/axiosInstance';
import { store } from '@/utils/store';

export default {
  name: 'OperatorTicketsView',
  data() {
    return {
      headers: [
        { title: 'Subject', key: 'subject', sortable: true },
        { title: 'Category', key: 'category', sortable: true },
        { title: 'Priority', key: 'priority', sortable: true },
        { title: 'Status', key: 'statusName', sortable: true },
        { title: 'Assignee', key: 'assigneeUsername', sortable: true },
        { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
      ],

      // važna promena: čuvamo RAW i filtrirano odvojeno
      ticketsRaw: [],
      statuses: [],

      filters: {
        statusId: null,
        category: null,
        priority: null,
      },

      categoryOptions: ['Accommodation', 'Transport', 'Finance', 'Support', 'Other'],
      priorityOptions: ['Low', 'Medium', 'High', 'Critical'],

      loading: { tickets: false, statuses: false },
      acceptingId: null,
    };
  },
  computed: {
    statusOptions() {
      return this.statuses;
    },
    // FRONT-END FILTERING
    tickets() {
      const { statusId, category, priority } = this.filters;

      return this.ticketsRaw.filter(it => {
        // status match: poredi po id (ako ima) ili po nazivu/kodu
        const okStatus = !statusId
          ? true
          : (it.statusId === statusId) ||
            (it.status?.id === statusId);

        const okCat = !category ? true : String(it.category || '').toLowerCase() === String(category).toLowerCase();
        const okPr  = !priority ? true : String(it.priority || '').toLowerCase() === String(priority).toLowerCase();

        return okStatus && okCat && okPr;
      });
    },
  },
  async created() {
    await Promise.all([this.fetchStatuses(), this.fetchTickets()]);
  },
  methods: {
    // Normalizuj status iz item-a
    getStatusCode(item) {
      // Vrati uvek UPPER kod ako postoji
      if (item.statusCode) return String(item.statusCode).toUpperCase();
      if (item.status?.code) return String(item.status.code).toUpperCase();
      // fallback na ime
      if (item.statusName) return String(item.statusName).toUpperCase();
      if (item.status?.name) return String(item.status.name).toUpperCase();
      return null;
    },

    async fetchStatuses() {
      try {
        this.loading.statuses = true;
        const { data } = await axiosInstance.get('/status');
        this.statuses = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error('Failed to load statuses', e);
        this.statuses = [];
      } finally {
        this.loading.statuses = false;
      }
    },

    async fetchTickets() {
      try {
        this.loading.tickets = true;
        const username = store.username;

        // Ako želiš back da vrati SAMO “dodeljene meni” ILI “pending”,
        // ostavi ovo. Ne oslanjamo se na back filtere po status/category/priority.
        const params = {
          includePending: true,
          assignee: username,
          // NE šaljemo front filtere — filtriraćemo na klijentu
        };

        const { data } = await axiosInstance.get('/complaint/operator', { params });

        // očekivani shape:
        // { id, subject, category, priority, createdAt,
        //   statusId, statusCode, statusName, status?, assigneeUsername }
        this.ticketsRaw = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error('Failed to load operator tickets', e);
        this.ticketsRaw = [];
      } finally {
        this.loading.tickets = false;
      }
    },

    async accept(item) {
      try {
        this.acceptingId = item.id;
        await axiosInstance.post(`/complaint/accept`, {
          complaintId: item.id,
          assigneeUsername: store.username,
        });
        await this.fetchTickets();
      } catch (e) {
        console.error('Accept failed', e);
      } finally {
        this.acceptingId = null;
      }
    },

    // Accept dugme treba da se vidi kad je pending i nema assignee
    canAccept(item) {
      const code = this.getStatusCode(item); // uzmi iz status/ime/kod
      const isPending = (code === 'PENDING') || item.statusId === 1;
      return isPending && !item.assigneeUsername;
    },

    viewDetails(item) {
  const statusCode = this.getStatusCode(item);
  
  // Ako je status "NEW", idi na Manager/NewTicketDetails
  if (statusCode === 'NEW') {
    this.$router.push(`/operator/triage/${item.id}`);
  } else {
    // Za sve ostale statuse (PENDING, IN_PROGRESS, itd.), idi na standardni operator view
    this.$router.push({ name: 'OperatorTicketDetails', params: { id: item.id } });
  }
},
    getStatusIcon(item) {
      const status = this.getStatusCode(item)?.toLowerCase();
      switch(status) {
        case 'open': return 'mdi-ticket-outline';
        case 'new': return 'mdi-new-box';
        case 'in_progress': return 'mdi-progress-clock';
        case 'resolved': return 'mdi-check-circle-outline';
        case 'closed': return 'mdi-lock-outline';
        default: return 'mdi-help-circle-outline';
      }
    },
    getPriorityIcon(priority) {
      if (!priority) return 'mdi-flag-outline';
      const p = String(priority).toLowerCase();
      switch(p) {
        case 'critical': return 'mdi-fire';
        case 'high': return 'mdi-flag';
        case 'medium': return 'mdi-flag-outline';
        case 'low': return 'mdi-flag-variant-outline';
        default: return 'mdi-flag-outline';
      }
    },
    getCategoryColor(category) {
      if (!category) return 'default';
      const colors = {
        'technical': 'primary',
        'billing': 'warning',
        'general': 'info',
        'complaint': 'error'
      };
      return colors[category.toLowerCase()] || 'default';
    },
    priorityColor(p) {
      if (!p) return undefined;
      const k = String(p).toLowerCase();
      if (k === 'critical') return 'red';
      if (k === 'high') return 'deep-orange';
      if (k === 'medium') return 'amber';
      if (k === 'low') return 'green';
      return undefined;
    },
    formatDate(d) {
      if (!d) return '—';
      try { return new Date(d).toLocaleString(); } catch { return String(d); }
    },
  },
};
</script>


<style scoped lang="scss">
.operator-tickets-container {
  min-height: 100vh;
  background: linear-gradient(135deg, 
    rgba(244, 244, 245, 0.95) 0%, 
    rgba(255, 251, 235, 0.95) 100%);
}

.tickets-header {
  margin-bottom: 2rem;
  animation: slideInDown 0.7s ease-out;

  .header-content {
    display: flex;
    align-items: center;
    margin-bottom: 1.5rem;

    .page-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--warm-brown);
      margin: 0;
      background: linear-gradient(135deg, #8B4513, #D2691E);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .page-subtitle {
      color: var(--warm-text);
      margin: 0;
      font-size: 1rem;
      opacity: 0.8;
    }
  }

  .filters-section {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;

    @media (max-width: 768px) {
      flex-direction: column;
    }

    .filter-item {
      min-width: 200px;
      flex: 1;
      max-width: 250px;

      @media (max-width: 768px) {
        min-width: 100%;
        max-width: 100%;
      }

      :deep(.v-field) {
        background: rgba(255, 255, 255, 0.9);
        border-radius: 12px;
        transition: all 0.3s ease;

        &:hover {
          background: rgba(255, 255, 255, 1);
          
          box-shadow: 0 4px 12px rgba(212, 115, 10, 0.15);
        }
      }

      :deep(.v-field--focused) {
        box-shadow: 0 0 0 2px rgba(212, 115, 10, 0.2);
      }
    }
  }
}

.tickets-table-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(212, 115, 10, 0.1);
  overflow: hidden;
  animation: slideInUp 0.8s ease-out;

  :deep(.v-data-table) {
    background: transparent;

    .v-data-table__thead {
      background: linear-gradient(135deg, 
        rgba(212, 115, 10, 0.1) 0%, 
        rgba(245, 158, 11, 0.05) 100%);

      th {
        color: var(--warm-brown) !important;
        font-weight: 600;
        font-size: 0.875rem;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        border-bottom: 2px solid rgba(212, 115, 10, 0.2);
        padding: 16px 12px;
      }
    }

    .v-data-table__tbody {
      tr {
        transition: all 0.3s ease;

        &:hover {
          background: rgba(212, 115, 10, 0.05);
          
          box-shadow: 0 2px 8px rgba(212, 115, 10, 0.1);
        }

        td {
          padding: 16px 12px;
          border-bottom: 1px solid rgba(212, 115, 10, 0.1);
        }
      }
    }
  }
}

.subject-cell {
  .subject-title {
    font-weight: 600;
    color: var(--warm-brown);
    margin-bottom: 4px;
    font-size: 0.95rem;
  }

  .subject-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: var(--warm-text);
    opacity: 0.7;

    .ticket-id {
      background: linear-gradient(135deg, 
        rgba(212, 115, 10, 0.1), 
        rgba(245, 158, 11, 0.1));
      color: var(--warm-orange);
      font-weight: 600;
    }

    .meta-separator {
      color: rgba(212, 115, 10, 0.4);
    }

    .created-date {
      font-size: 0.75rem;
    }
  }
}

.category-chip {
  font-weight: 500;
  border-radius: 8px;
  
  &.v-chip--variant-tonal {
    background: rgba(212, 115, 10, 0.1) !important;
    color: var(--warm-orange) !important;
  }
}

.priority-chip {
  font-weight: 600;
  border-radius: 8px;
  
  .v-icon {
    margin-right: 4px;
  }
}

.status-chip {
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;

  &.status-open {
    border-color: #10B981;
    color: #10B981;
    background: rgba(16, 185, 129, 0.1);
  }

  &.status-in_progress {
    border-color: #F59E0B;
    color: #F59E0B;
    background: rgba(245, 158, 11, 0.1);
  }

  &.status-resolved {
    border-color: #6366F1;
    color: #6366F1;
    background: rgba(99, 102, 241, 0.1);
  }

  &.status-closed {
    border-color: #6B7280;
    color: #6B7280;
    background: rgba(107, 114, 128, 0.1);
  }

  .v-icon {
    margin-right: 4px;
  }
}

.assignee-cell {
  display: flex;
  align-items: center;

  .assignee-name {
    font-weight: 500;
    color: var(--warm-brown);
  }

  .unassigned-text {
    color: var(--warm-text);
    opacity: 0.6;
    font-style: italic;
    display: flex;
    align-items: center;
    font-size: 0.875rem;

    .v-icon {
      opacity: 0.5;
    }
  }
}

.row-actions {
  display: flex;
  gap: 8px;

  .accept-btn {
    background: linear-gradient(135deg, #D4730A, #F59E0B);
    color: white;
    border-radius: 8px;
    font-weight: 600;
    transition: all 0.3s ease;

    &:hover {
      
      box-shadow: 0 4px 12px rgba(212, 115, 10, 0.3);
    }

    .v-icon {
      margin-right: 4px;
    }
  }

  .view-btn {
    border: 2px solid rgba(212, 115, 10, 0.3);
    color: var(--warm-orange);
    border-radius: 8px;
    font-weight: 500;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(212, 115, 10, 0.1);
      border-color: var(--warm-orange);
      
    }

    .v-icon {
      margin-right: 4px;
    }
  }
}

.no-data-state {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--warm-text);

  h3 {
    color: var(--warm-brown);
    font-weight: 600;
  }

  .v-icon {
    opacity: 0.3;
  }
}

// Animation keyframes
@keyframes slideInDown {
  from {
    opacity: 0;
    /* transform: translateY(...) uklonjeno za bolje UX */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.6s ease-out;
}

// Responsive design
@media (max-width: 768px) {
  .operator-tickets-container {
    padding: 1rem;
  }

  .tickets-header {
    .header-content {
      .page-title {
        font-size: 1.5rem;
      }
    }
  }

  .row-actions {
    flex-direction: column;
    gap: 4px;

    .accept-btn,
    .view-btn {
      width: 100%;
      min-width: auto;
    }
  }
}
</style>
