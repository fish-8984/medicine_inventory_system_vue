<script setup>
import {ref, onMounted, watch, nextTick, onUnmounted, onBeforeUnmount} from 'vue'
import * as echarts from 'echarts'
import { inventoryGetService } from "@/api/inventory.js";
import {useTimerStore} from "@/stores/index.js";

// 数据状态
const loading = ref(false)
const inventoryPageList = ref([])
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

// 显示控制
const showChart = ref(false)

// 搜索条件
const searchParams = ref({
  batchNo: "",
  id: null
})

// ECharts实例
let chartInstance = null

// 获取库存数据
const fetchInventory = async () => {
  try {
    loading.value = true
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      ...searchParams.value
    }
    const res = await inventoryGetService(params)
    inventoryPageList.value = res.data.records
    pagination.value.total = res.data.total

    // 更新图表
    updateChart()
  } finally {
    loading.value = false
  }
}

// 初始化图表
const initChart = () => {
  const chartDom = document.getElementById('inventory-chart')
  chartInstance = echarts.init(chartDom)

  const option = {
    title: {
      text: '库存数量分析',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: []
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: '当前库存',
      type: 'bar',
      data: []
    }]
  }

  chartInstance.setOption(option)
}

// 更新图表数据
const updateChart = () => {
  const xData = inventoryPageList.value.map(item => item.batchNo)
  const yData = inventoryPageList.value.map(item => item.currentQuantity)

  chartInstance.setOption({
    xAxis: {
      data: xData
    },
    series: [{
      data: yData
    }]
  })
}

// 切换显示
const toggleDisplay = () => {
  showChart.value = !showChart.value
}

// 监听图表显示状态变化
watch(showChart, (newVal) => {
  if (newVal && chartInstance) {
    nextTick(() => {
      chartInstance.resize()
    })
  }
})

// 重置搜索
const resetSearch = () => {
  searchParams.value = { batchNo: "", id: null }
  fetchInventory()
}

// 分页变化处理
const handlePaginationChange = (newPage) => {
  pagination.value.page = newPage
  fetchInventory()
}
const timerStore = useTimerStore()

onMounted(() => {
  initChart()
  fetchInventory()
  timerStore.startTimer(fetchInventory, 10000)
})

onBeforeUnmount(() => {
  timerStore.stopTimer()
})

// 销毁图表实例
onUnmounted(() => {
  if (chartInstance) {
    chartInstance.dispose()
  }
})
</script>

<template>
  <div class="inventory-container">
    <!-- 搜索表单 -->
    <el-card shadow="never" class="search-box">
      <el-form :inline="true">
        <el-form-item label="批次号">
          <el-input
              v-model="searchParams.batchNo"
              placeholder="请输入批次号"
              clearable
          />
        </el-form-item>
        <el-form-item label="库存ID">
          <el-input
              v-model.number="searchParams.id"
              placeholder="请输入库存ID"
              clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchInventory">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button @click="toggleDisplay" type="success">
            {{ showChart ? '显示图表' : '显示表格' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据可视化 -->
    <el-card v-show="showChart" class="chart-box">
      <div id="inventory-chart" style="height: 400px;"></div>
    </el-card>

    <!-- 数据表格 -->
    <el-card v-show="!showChart" shadow="never">
      <el-table
          v-loading="loading"
          :data="inventoryPageList"
          stripe
          style="width: 100%"
      >
        <el-table-column prop="inventoryId" label="库存ID" min-width="120" />
        <el-table-column prop="batchNo" label="批次号" min-width="120"/>
        <el-table-column label="库存量/库存阈值" min-width="120">
          <template #default="{row}">
            <el-tag :type="row.currentQuantity < row.minStock ? 'danger' : 'success'">
              {{ row.currentQuantity }} / {{ row.minStock }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastRestocked" label="最后补货时间" min-width="120">
          <template #default="{row}">
            {{ new Date(row.lastRestocked).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="lastUsed" label="最后使用时间" min-width="120">
          <template #default="{row}">
            {{ new Date(row.lastUsed).toLocaleString() }}
          </template>
        </el-table-column>
      </el-table>

    </el-card>
    <!-- 分页 -->
    <el-pagination
        class="pagination"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @current-change="handlePaginationChange"
        @size-change="fetchInventory"
    />
  </div>
</template>

<style scoped>
.inventory-container {
  padding: 20px;
}

.search-box {
  margin-bottom: 20px;
}

.chart-box {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>