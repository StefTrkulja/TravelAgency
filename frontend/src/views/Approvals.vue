<template>
<v-container>
<h2>Odobrenja</h2>
<v-data-table :headers="headers" :items="items">
<template #item.actions="{ item }">
<v-btn color="success" size="small" @click="decide(item.id,'APPROVED')">Odobri</v-btn>
<v-btn color="warning" size="small" class="ml-1" @click="decide(item.id,'CHANGES_REQUESTED')">Vrati na izmene</v-btn>
<v-btn color="error" size="small" class="ml-1" @click="decide(item.id,'REJECTED')">Odbij</v-btn>
</template>
</v-data-table>
</v-container>
</template>

<script setup>
import axios from '@/utils/axiosInstance'
import { ref, onMounted } from 'vue'


const headers = [ { title:'ID', key:'id' }, { title:'Arrangement', key:'arrangementId' }, { title:'Decision', key:'decision' }, { title:'Created', key:'createdAt' }, { title:'Akcije', key:'actions', sortable:false } ]
const items = ref([])


const load = async () => { const { data } = await axios.get('/approvals'); items.value = data }
const decide = async (id, decision) => { await axios.post('/approvals/decide', { approvalRequestId: id, decision }); load() }


onMounted(load)
</script>