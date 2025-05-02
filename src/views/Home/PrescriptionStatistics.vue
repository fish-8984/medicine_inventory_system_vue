<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  prescriptionsCountService
} from "@/api/prescriptions.js";
import {prescriptionMedicinesTotalPriceService} from "@/api/prescriptionMedicines.js";
import {inventoryCountService, inventoryTransactionsSummaryService} from "@/api/inventory.js";

// 状态统计
const counts = ref({
  pending: 0,
  processing: 0,
  done: 0
})

// 总收入
const totalIncome = ref(0)

// 库存统计
const inStock = ref(0)
const outStock = ref(0)

// 库存总数
const inventoryCount = ref(0)
// 时间范围选项
const timeRangeOptions = [
  { label: '今日', value: 'today' },
  { label: '近7天', value: '7days' },
  { label: '近30天', value: '30days' }
]
const selectedRange = ref('today')

// 生成日期参数
const getDateParams = () => {
  const now = new Date()
  const start = new Date()

  switch (selectedRange.value) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      return {
        startDate: start.toISOString(),
        endDate: now.toISOString()
      }
    case '7days':
      start.setDate(now.getDate() - 7)
      break
    case '30days':
      start.setDate(now.getDate() - 30)
      break
  }

  start.setHours(0, 0, 0, 0)
  return {
    startDate: start.toISOString(),
    endDate: now.toISOString()
  }
}

// 获取数据
const fetchData = async () => {
  try {
    const dateParams = getDateParams()

    // 并行请求
    const [statusRes, incomeRes, inventoryRes, inventoryResCount] = await Promise.all([
      prescriptionsCountService(dateParams),
      prescriptionMedicinesTotalPriceService(dateParams),
      inventoryTransactionsSummaryService({
        startTime: dateParams.startDate,
        endTime: dateParams.endDate
      }),
      inventoryCountService()
    ])

    counts.value = {
      pending: statusRes.data.pendingCount,
      processing: statusRes.data.processingCount,
      done: statusRes.data.doneCount
    }

    totalIncome.value = incomeRes.data.totalIncome || 0

    // 库存统计
    const {stockIn, stockOut } = inventoryRes.data
    inStock.value = stockIn || 0
    outStock.value = stockOut || 0

    // 库存总数
    inventoryCount.value = inventoryResCount.data || 0
  } catch (error) {
    ElMessage.error('数据加载失败')
  }
}

const handleSearch = () => fetchData()

onMounted(fetchData)
</script>

<template>
  <div class="dashboard-container">
    <div class="filter-container">
      <el-radio-group
          v-model="selectedRange"
          @change="handleSearch"
      >
        <el-radio-button
            v-for="item in timeRangeOptions"
            :key="item.value"
            :label="item.value"
        >
          {{ item.label }}
        </el-radio-button>
      </el-radio-group>
    </div>

    <div class="stats-grid">
      <!-- 状态统计 -->
      <el-card class="stat-item">
        <h3>待发药</h3>
        <div class="number">{{ counts.pending }}</div>
      </el-card>

      <el-card class="stat-item">
        <h3>发药中</h3>
        <div class="number">{{ counts.processing }}</div>
      </el-card>

      <el-card class="stat-item">
        <h3>已取药</h3>
        <div class="number">{{ counts.done }}</div>
      </el-card>

      <!-- 总收入 -->
      <el-card class="stat-item highlight">
        <h3>总收入</h3>
        <div class="number">¥{{ totalIncome.toFixed(2) }}</div>
      </el-card>
      <!-- 库存统计 -->
      <el-card class="stat-item">
        <h3>库存总数</h3>
        <div class="number">{{ inventoryCount }}</div>
      </el-card>

      <el-card class="stat-item">
        <h3>药品入库</h3>
        <div class="number">{{ inStock }}</div>
      </el-card>

      <el-card class="stat-item">
        <h3>药品出库</h3>
        <div class="number">{{ outStock }}</div>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  padding: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  transition: transform 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-5px);
}

.stat-item.highlight {
  background: #f0f9eb;
  border-color: #e1f3d8;
}

.stat-item.highlight .number {
  color: #67c23a;
}

.stat-item h3 {
  color: #666;
  margin-bottom: 10px;
  font-size: 16px;
}

.stat-item .number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.filter-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, .1);
  margin-bottom: 20px;
}
</style>