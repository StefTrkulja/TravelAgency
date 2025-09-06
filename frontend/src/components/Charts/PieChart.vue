<template>
  <PieChartGenerator :chart-data="chartData" :chart-options="chartOptions" />
</template>

<script setup>
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js'
import { defineComponent } from 'vue'
import { Pie } from 'vue-chartjs'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

const props = defineProps({
  chartData: { type: Object, required: true },
  chartOptions: { type: Object, required: false, default: () => ({ responsive: true }) }
})

const PieChartGenerator = defineComponent({
  name: 'PieChartGenerator',
  extends: Pie,
  props: ['chartData', 'chartOptions']
})
</script>
