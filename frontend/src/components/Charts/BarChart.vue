<template>
  <div style="height:300px">
    <Bar :data="chartData" :options="options" />
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

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  chartData: { type: Object, required: true }
})

const options = {
  responsive: true,
  maintainAspectRatio: false
}
</script>
