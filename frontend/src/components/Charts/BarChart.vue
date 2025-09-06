<template>
  <BarChartGenerator :chart-data="chartData" :chart-options="chartOptions" />
</template>

<script setup>
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js'
import { defineComponent } from 'vue'
import { Bar } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

const props = defineProps({
  chartData: { type: Object, required: true },
  chartOptions: { type: Object, required: false, default: () => ({ responsive: true }) }
})

const BarChartGenerator = defineComponent({
  name: 'BarChartGenerator',
  extends: Bar,
  props: ['chartData', 'chartOptions']
})
</script>
