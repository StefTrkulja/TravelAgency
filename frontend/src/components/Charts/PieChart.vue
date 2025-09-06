<template>
  <div style="height:300px">
    <Pie :data="chartData" :options="options" />
  </div>
</template>

<script setup>
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement)

const props = defineProps({
  chartData: { type: Object, required: true }
})

const options = {
  responsive: true,
  maintainAspectRatio: false
}
</script>
