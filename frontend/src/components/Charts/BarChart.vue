<template>
  <div style="height:300px">
    <div v-if="!chartData || !chartData.datasets || chartData.datasets.length === 0" class="d-flex align-center justify-center h-100">
      <v-alert type="info" variant="tonal">No data available for chart</v-alert>
    </div>
    <Bar v-else :data="chartData" :options="options" />
  </div>
</template>

<script setup>
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js'
import { watch } from 'vue'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  chartData: { type: Object, required: true }
})

const options = {
  responsive: true,
  maintainAspectRatio: false
}

// Debug logging
watch(() => props.chartData, (newData) => {
  console.log('BarChart received data:', newData)
}, { immediate: true, deep: true })
</script>
