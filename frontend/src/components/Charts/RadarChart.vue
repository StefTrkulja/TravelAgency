<script setup>
import { Chart as ChartJS, Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler } from 'chart.js'
import { Radar } from 'vue-chartjs'
import { ref, watch } from 'vue'

ChartJS.register(Title, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler)

const props = defineProps({
  labels: { type: Array, required: true },
  values: { type: Array, required: true }
})

const chartData = ref({
  labels: props.labels,
  datasets: [
    {
      label: 'Average Ratings',
      data: props.values.map(v => Number(v) || 0),
      backgroundColor: 'rgba(66, 165, 245, 0.2)',
      borderColor: '#42A5F5',
      pointBackgroundColor: '#42A5F5'
    }
  ]
})

const options = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    r: {
      beginAtZero: true,
      max: 5,
      ticks: { stepSize: 1 }
    }
  }
}

watch(
  () => [props.labels, props.values],
  () => {
    chartData.value = {
      labels: props.labels,
      datasets: [
        {
          label: 'Average Ratings',
          data: props.values.map(v => Number(v) || 0),
          backgroundColor: 'rgba(66, 165, 245, 0.2)',
          borderColor: '#42A5F5',
          pointBackgroundColor: '#42A5F5'
        }
      ]
    }
  },
  { deep: true }
)
</script>

<template>
  <Radar :data="chartData" :options="options" style="height:400px" />
</template>
