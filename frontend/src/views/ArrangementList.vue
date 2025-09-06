<template>
    <v-container>
        <v-row class="mb-2">
            <v-col cols="6"><h2>Moji aranžmani</h2></v-col>
            <v-col cols="6" class="text-right"><v-btn color="primary" to="/op/arrangements/new">Novi</v-btn></v-col>
        </v-row>

        <v-data-table :headers="headers" :items="items" :loading="loading">
            <template #item.actions="{ item }">
                <v-btn size="small" :to="`/op/arrangements/${item.id}`" icon="mdi-eye" />
                <v-btn size="small" :to="`/op/departures/${item.id}`" icon="mdi-calendar" />
            </template>
        </v-data-table>
    </v-container>
</template>


<script setup>
import axios from '@/utils/axiosInstance'
import { ref, onMounted } from 'vue'


const headers = [
    { title: 'ID', key: 'id' },
    { title: 'Naslov', key: 'title' },
    { title: 'Tip', key: 'type' },
    { title: 'Status', key: 'status' },
    { title: 'Akcije', key: 'actions', sortable: false }
]
const items = ref([])
const loading = ref(false)


onMounted(async () => {
    loading.value = true
    const { data } = await axios.get('/arrangements')
    items.value = data
    loading.value = false
})
</script>