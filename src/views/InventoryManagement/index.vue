<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { inventoryTransactionsGetService } from '@/api/inventory'
import {Refresh, Search} from "@element-plus/icons-vue";

// 响应式数据
const inventoryTransactionPageList = ref([])
const total = ref(0)
const loading = ref(false) // 增加加载状态
const transactionTypeOptions = ref([
  { value: 'IN', label: '入库' },
  { value: 'OUT', label: '出库' }
])

// 分页参数（使用深层响应式更安全）
const inventoryTransactionPage = ref({
  page: 1,
  pageSize: 10,
  transactionType: '',
  startDate: '',
  endDate: ''
})

// 日期范围处理
const dateRange = computed({
  get() {
    const { startDate, endDate } = inventoryTransactionPage.value
    return startDate && endDate ? [startDate, endDate] : []
  },
  set(newRange) {
    inventoryTransactionPage.value.startDate = newRange?.[0] || ''
    inventoryTransactionPage.value.endDate = newRange?.[1] || ''
  }
})

// ECharts 实例
let chartInstance = null

// 数据获取（增加防抖处理）
let fetchTimer = null
const getTransactions = async () => {
  loading.value = true
  try {
    clearTimeout(fetchTimer)
    fetchTimer = setTimeout(async () => {
      const { data } = await inventoryTransactionsGetService({
        ...inventoryTransactionPage.value,
        page: inventoryTransactionPage.value.page,
        pageSize: inventoryTransactionPage.value.pageSize
      })
      inventoryTransactionPageList.value = data.records
      total.value = data.total
      updateChart()
    }, 300)
  } catch (e) {
    ElMessage.error('数据获取失败，请检查网络或稍后重试')
  } finally {
    loading.value = false
  }
}

// 图表处理（封装成独立函数）
const initChart = () => {
  if (!chartInstance) {
    chartInstance = echarts.init(document.getElementById('chart'))
    window.addEventListener('resize', () => chartInstance?.resize())
  }
}

const updateChart = () => {
  if (!chartInstance) initChart()

  // 空数据提示
  if (inventoryTransactionPageList.value.length === 0) {
    chartInstance.setOption({
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#909399',
          fontSize: 16
        }
      }
    })
    return
  }

  // 数据处理逻辑
  const batchMap = new Map()
  const allDates = new Set()

  inventoryTransactionPageList.value.forEach(transaction => {
    const date = transaction.transactionTime.split(' ')[0]
    allDates.add(date)

    if (!batchMap.has(transaction.batchNo)) {
      batchMap.set(transaction.batchNo, {
        dates: new Set(),
        data: new Map(),
        total: 0
      })
    }

    const batchData = batchMap.get(transaction.batchNo)
    const change = transaction.transactionType === 'IN'
        ? transaction.quantity
        : -transaction.quantity
    batchData.total = Math.max(batchData.total + change, 0) // 确保库存不为负
    batchData.data.set(date, batchData.total)
  })

  // 生成图表数据
  const sortedDates = [...allDates].sort()
  const colors = ['#5470C6', '#91CC75', '#FAC858', '#EE6666', '#73C0DE']
  const series = []

  batchMap.forEach((batchData, batchNo) => {
    const dataPoints = sortedDates.map(date =>
        batchData.data.has(date) ? batchData.data.get(date) : null
    )

    series.push({
      name: batchNo,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      itemStyle: { color: colors[series.length % colors.length] },
      lineStyle: { width: 2 },
      data: dataPoints,
      connectNulls: true,
      endLabel: {
        show: true,
        formatter: '{a}',
        color: '#606266'
      }
    })
  })

  // 图表配置
  chartInstance.setOption({
    title: {
      text: '批次库存趋势',
      left: 'center',
      textStyle: {
        color: '#303133',
        fontSize: 18
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(50,50,50,0.9)',
      borderColor: '#666',
      axisPointer: { type: 'cross' }
    },
    legend: {
      type: 'scroll',
      bottom: 10,
      pageIconColor: '#409EFF',
      pageTextStyle: { color: '#606266' },
      textStyle: { color: '#303133' }
    },
    grid: {
      top: 80,
      left: 50,
      right: 30,
      bottom: 80,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: sortedDates,
      axisLabel: {
        color: '#606266',
        rotate: 30,
        formatter: value => value.slice(5)
      }
    },
    yAxis: {
      type: 'value',
      min: 0,
      axisLabel: { color: '#606266' }
    },
    series
  }, true)
}

// 生命周期
onMounted(() => {
  initChart()
  getTransactions()
})

onUnmounted(() => {
  window.removeEventListener('resize', () => chartInstance?.resize())
  chartInstance?.dispose()
})

// 重置查询条件
const resetQuery = () => {
  inventoryTransactionPage.value = {
    page: 1,
    pageSize: 10,
    transactionType: '',
    startDate: '',
    endDate: ''
  }
  getTransactions()
}
</script>

<template>
  <div class="container">
    <!-- 查询条件 -->
    <el-card shadow="never" class="search-box">
      <el-form :inline="true" class="responsive-form">
        <el-form-item label="交易类型">
          <el-select
              v-model="inventoryTransactionPage.transactionType"
              clearable
              placeholder="全部类型"
              style="width: 120px"
          >
            <el-option
                v-for="item in transactionTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="时间范围">
          <el-date-picker
              v-model="dateRange"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
              style="width: 280px"
          />
        </el-form-item>

        <el-form-item class="form-actions">
          <el-button
              type="primary"
              @click="getTransactions"
              :icon="Search"
          >
            查询
          </el-button>
          <el-button
              @click="resetQuery"
              :icon="Refresh"
          >
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据可视化 -->
    <el-card shadow="never" class="chart-card">
      <div id="chart" style="height: 420px"></div>
    </el-card>

    <!-- 数据表格 -->
    <el-card shadow="never">
      <el-table
          :data="inventoryTransactionPageList"
          stripe
          border
          v-loading="loading"
          style="width: 100%"
          :header-cell-style="{ background: '#f5f7fa' }"
      >
        <el-table-column prop="transactionId" label="流水号" width="120" align="center" />
        <el-table-column prop="batchNo" label="批次号" width="180" />
        <el-table-column prop="transactionType" label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag
                :type="row.transactionType === 'IN' ? 'success' : 'danger'"
                effect="plain"
            >
              {{ row.transactionType === 'IN' ? '入库' : '出库' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="120" align="right">
          <template #default="{ row }">
            <span :class="row.transactionType === 'IN' ? 'text-success' : 'text-danger'">
              {{ row.transactionType === 'IN' ? '+' : '-' }}{{ row.quantity }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="transactionTime" label="交易时间" width="160" />
        <el-table-column prop="notes" label="备注" min-width="180" show-overflow-tooltip />
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
            v-model:current-page="inventoryTransactionPage.page"
            v-model:page-size="inventoryTransactionPage.pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="getTransactions"
            @current-change="getTransactions"
            background
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.container {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.search-box {
  margin-bottom: 16px;
  border-radius: 8px;
}

.responsive-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.form-actions {
  margin-left: auto;
}

.chart-card {
  margin: 16px 0;
  border-radius: 8px;
}

.pagination {
  padding: 16px 0;
  display: flex;
  justify-content: flex-end;
}


@media (max-width: 768px) {
  .responsive-form {
    width: 100%;
    margin-right: 0;
  }

  .form-actions {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
}
</style>