<script setup>
import { ref, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { fetchPrediction, getBatchInfo, getAlertInfo } from '@/api/forecast.js'

const batchNo = ref('')
const periods = ref(30)
const predictData = ref([])
const alertLevel = ref(null)
const minQuantity = ref(0)
const chartDom = ref(null)
let myChart = null

onUnmounted(() => {
  if (myChart) {
    myChart.dispose()
    myChart = null
  }
})
const loading = ref(false)

const fetchData = async () => {
    loading.value = true
  try {
    const [prediction, batchInfo] = await Promise.all([
      fetchPrediction(batchNo.value, periods.value),
      getBatchInfo(batchNo.value)
    ])

    predictData.value = prediction

    if (batchInfo.medicine_id) {
      const alertInfo = await getAlertInfo(batchInfo.medicine_id)
      minQuantity.value = alertInfo.min_quantity
      alertLevel.value = alertInfo.alert_level
    }

    renderChart()
  } catch (error) {
  } finally {
    loading.value = false
  }
}


const renderChart = () => {
  if (!predictData.value.length || !chartDom.value) return

  if (!myChart) {
    myChart = echarts.init(chartDom.value)
  }

  const option = {
    title: {
      text: '库存趋势预测',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    xAxis: {
      type: 'category',
      data: predictData.value.map(i => i.date),
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      min: value => Math.min(value.min, minQuantity.value)
    },
    dataZoom: [{
      type: 'slider',
      show: true,
      xAxisIndex: 0,
      start: 0,
      end: 100
    }],
    series: [
      {
        name: '库存量',
        type: 'line',
        data: predictData.value.map(i => i.stock),
        smooth: true,
        lineStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.02)' }
          ])
        }
      },
      {
        name: '安全库存',
        type: 'line',
        markLine: {
          silent: true,
          lineStyle: {
            color: '#F56C6C',
            type: 'dashed'
          },
          data: [{ yAxis: minQuantity.value }]
        }
      }
    ],
    grid: {
      containLabel: true,
      left: '3%',
      right: '3%',
      bottom: '15%'
    }
  }

  myChart.setOption(option)
}
</script>

<template>
  <div class="prediction-container">
    <el-card shadow="never" >
      <el-form :inline="true">
        <el-form-item label="药品批次号">
          <el-input
              v-model="batchNo"
              placeholder="输入批次号"
              clearable
              @keyup.enter="fetchData"
          />
        </el-form-item>

        <el-form-item label="预测天数">
          <el-input-number
              v-model="periods"
              :min="7"
              :max="90"
              controls-position="right"
          />
        </el-form-item>

        <el-form-item>
          <el-button
              type="primary"
              @click="fetchData"
              :disabled="!batchNo"
          >
            开始预测
          </el-button>
        </el-form-item>

        <el-form-item v-if="alertLevel" label="预警等级">
          <el-tag :type="{
            low: 'warning',
            medium: '',
            high: 'danger'
          }[alertLevel]">
            {{ alertLevel?.toUpperCase() }}
          </el-tag>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" style="margin-top: 20px" v-loading="loading">
      <div v-if="predictData.length" ref="chartDom" style="height: 500px"></div>
      <el-empty v-else description="暂无数据" />
    </el-card>
  </div>
</template>

<style scoped>
.prediction-container {
  padding: 20px;
  background-color: #f5f7fa;
}

:deep(.el-card) {
  border-radius: 8px;
}

:deep(.el-form--inline .el-form-item) {
  margin-right: 30px;
  margin-bottom: 0;
}
</style>