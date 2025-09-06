<template>
<v-container>
<h2>Analitika</h2>
<v-row>
<v-col cols="12" md="3"><v-card class="pa-4" title="Avg time to READY" subtitle="{{ kpi.avgTimeToReady || '-' }}" /></v-col>
<v-col cols="12" md="3"><v-card class="pa-4" title="Supplier response rate" subtitle="{{ kpi.responseRate || '-' }}" /></v-col>
<v-col cols="12" md="3"><v-card class="pa-4" title="Approval turnaround" subtitle="{{ kpi.approvalTurnaround || '-' }}" /></v-col>
<v-col cols="12" md="3"><v-card class="pa-4" title="Rework rate" subtitle="{{ kpi.reworkRate || '-' }}" /></v-col>
</v-row>
</v-container>
</template>


<script setup>
import axios from '@/utils/axiosInstance'
import { ref, onMounted } from 'vue'


const kpi = ref({})


onMounted(async () => {
try {
const { data } = await axios.get('/analytics/arrangements/kpis')
kpi.value = data
} catch {
// fallback if analytics backend not yet implemented
kpi.value = { avgTimeToReady: '—', responseRate: '—', approvalTurnaround: '—', reworkRate: '—' }
}
})
</script>