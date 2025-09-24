<template>
  <v-container class="py-6">
    <!-- Header + Filters -->
    <div class="tickets-header">
      <h1 class="page-title">Operator Tickets</h1>
      <v-spacer />
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
          @update:model-value="fetchTickets"
        />
        <v-select
          v-model="filters.category"
          :items="categoryOptions"
          label="Category"
          clearable
          density="comfortable"
          variant="outlined"
          class="filter-item"
          @update:model-value="fetchTickets"
        />
        <v-select
          v-model="filters.priority"
          :items="priorityOptions"
          label="Priority"
          clearable
          density="comfortable"
          variant="outlined"
          class="filter-item"
          @update:model-value="fetchTickets"
        />
      </div>
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

        <template #item.subject="{ item }">
          <div class="cell-title">
            <div class="subject">{{ item.subject }}</div>
            <div class="meta">
              <span>#{{ item.id }}</span>
              <span>&middot;</span>
              <span>{{ formatDate(item.createdAt) }}</span>
            </div>
          </div>
        </template>

        <template #item.category="{ item }">
          <v-chip size="small" variant="tonal">{{ item.category }}</v-chip>
        </template>

        <template #item.priority="{ item }">
          <v-chip size="small" :color="priorityColor(item.priority)" variant="flat">
            {{ item.priority || '—' }}
          </v-chip>
        </template>

        <template #item.statusName="{ item }">
          <v-chip size="small" variant="outlined">
            {{ item.statusName || item.statusCode || item.status.name }}
          </v-chip>
        </template>

        <template #item.assigneeUsername="{ item }">
          <span v-if="item.assigneeUsername">{{ item.assigneeUsername }}</span>
          <span v-else class="text-medium-emphasis">Unassigned</span>
        </template>

        <template #item.actions="{ item }">
          <div class="row-actions">
            <v-btn
              v-if="canAccept(item)"
              color="primary"
              size="small"
              :loading="acceptingId === item.id"
              @click="accept(item)"
            >
              Accept
            </v-btn>
            <v-btn
              v-else
              variant="outlined"
              size="small"
              class="btn-outline"
              @click="viewDetails(item)"
            >
              View details
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
    formatDate(d) {
      if (!d) return '—';
      try { return new Date(d).toLocaleString(); } catch { return String(d); }
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
  },
};
</script>


<style scoped>
.tickets-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
.page-title { margin: 0; font-size: 1.4rem; font-weight: 800; }
.filters { display: flex; gap: 8px; }
.filter-item { min-width: 180px; }

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
