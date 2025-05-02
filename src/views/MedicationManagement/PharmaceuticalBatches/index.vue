<script setup>
import {ref, onMounted, onBeforeUnmount} from 'vue'
import {
  ElMessage,
  ElTable,
  ElPagination,
  ElDatePicker, ElMessageBox
} from 'element-plus'
import {
  Search,
} from '@element-plus/icons-vue'
import {
  pharmaceuticalBatchesAddService,
  pharmaceuticalBatchesGetPageService
} from '@/api/pharmaceuticalBatches.js'
import { medicineGetIdsService } from '@/api/medicines.js'
import {useTimerStore} from "@/stores/index.js";
import {purchaseOrdersGetService, purchaseOrdersUpdateStatusService} from "@/api/purchaseOrders.js";
// 新增药品数据相关逻辑
const medicineCache = new Map() // 使用Map结构缓存药品信息



// 数据相关
const tableData = ref([])
const total = ref(0)
const loading = ref(false)

// 分页参数
const pagination = ref({
  page: 1,
  pageSize: 10
})

// 搜索参数
const searchParams = ref({
  batchNo: ''
})

// 表单相关
const formRef = ref()
const dialogVisible = ref(false)
const submitting = ref(false)
const formData = ref({
  batchNo: '',
  medicineId: null,
  expiryDate: '',
  productionDate: '',
  supplierId: null,
  initialQuantity: null,
  storageLocation: '',
})

// 表单验证规则
const formRules = {
  batchNo: [
    { required: true, message: '请输入批次号', trigger: 'blur' },
    { min: 3, max: 20, message: '长度在3-20个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]+$/, message: '只允许输入字母和数字', trigger: 'blur' }
  ],
  medicineId: [
    { required: true, message: '请选择药品', trigger: 'blur' }
  ],
  productionDate: [
    { required: true, message: '请选择生产日期', trigger: 'change' }
  ],
  expiryDate: [
    { required: true, message: '请选择有效期', trigger: 'change' }
  ],
  initialQuantity: [
    { required: true, message: '请输入库存数量', trigger: 'blur' }
  ]
}
const purchaseOrdersPoId = {
  poId: [
    { required: true, message: '请输入采购单ID', trigger: 'blur' }
  ]
}

const timerStore = useTimerStore()

onMounted(() => {
  loadData()
  timerStore.startTimer(loadData, 100000)
})

onBeforeUnmount(() => {
  timerStore.stopTimer()
})

// 加载表格数据
const loadData = async () => {
  try {
    loading.value = true
    const params = { ...pagination.value, ...searchParams.value }
    const { data } = await pharmaceuticalBatchesGetPageService(params)

    // 提取当前页所有药品ID
    const medicineIds = [...new Set(data.records.map(item => item.medicineId))]

    // 动态获取药品名称
    const res = await medicineGetIdsService({
      medicineIds: medicineIds.join(',')  // 将数组转为逗号分隔字符串
    })
    res.data.forEach(item => medicineCache.set(item.medicineId, item.name))

    // 更新表格数据
    tableData.value = data.records.map(item => ({
      ...item,
      medicineName: medicineCache.get(item.medicineId) || '未知药品'
    }))
    total.value = data.total
  } catch (e) {
    loading.value = false
    ElMessage.error('数据加载失败')
  }finally {
    loading.value = false
  }
}
// 分页大小变化
const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  loadData()
}

// 显示创建弹窗
const showCreateDialog = () => {
  dialogVisible.value = true
}

// 日期禁用规则
const disableFutureDates = (date) => {
  return date > new Date()
}

const disablePastDates = (date) => {
  return date < formData.value.productionDate
}
const purchaseOrders = ref({
  poId: null,
  supplierId: null,
  orderDate: "",
  expectedDeliveryDate: "",
  totalAmount: "",
  status: "received",
  createdBy: ""
})
// 提交表单
const submitForm = async () => {
 const verify = await formRef.value.validate()
  if (!verify) {
    return
  }
  const verifyPoId = await formRef.value.validate()
  if (!verifyPoId) {
    return
  }

  ElMessageBox.confirm(
      '提交后不允许修改, 继续?',
      '警告',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
  )
      .then(() => {
        submitting.value = true
        purchaseOrdersGetService(purchaseOrders.value.poId).then((res) => {
          if (res.code === 1) {
            purchaseOrdersUpdateStatusService(purchaseOrders.value)
            pharmaceuticalBatchesAddService(formData.value)
            ElMessage.success('创建成功')
            dialogVisible.value = false
            formRef.value.resetFields()
          }
        })
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '提交失败',
        })
      })
      .finally(() => {
        submitting.value = false
      })
  await loadData()
}

</script>
<template>
  <div class="container">
    <el-card class="search-box">
      <div class="search-container">
        <el-input
            v-model="searchParams.batchNo"
            placeholder="输入批次号搜索"
            clearable
            class="search-input"
            @change="loadData"
            style="flex: 1; margin-right: 16px;"
        >
          <template #prefix>
            <el-icon class="search-icon"><Search /></el-icon>
          </template>
        </el-input>

        <el-button
            type="success"
            @click="showCreateDialog"
            style="width: 120px;"
        >
          新增批次
        </el-button>
      </div>
    </el-card>

    <el-card class="table-box">
      <el-table
          :data="tableData"
          style="width: 100%"
          :fit="true"
          stripe
          border
          :row-class-name="({ rowIndex }) => rowIndex % 2 === 0 ? 'even-row' : 'odd-row'">

        <el-table-column prop="batchNo" label="批次号" min-width="180" />
        <el-table-column prop="medicineId" label="药品ID" min-width="120" align="center"/>
        <el-table-column prop="medicineName" label="药品名称" min-width="180" />
        <el-table-column prop="productionDate" label="生产日期" min-width="130" align="center"/>
        <el-table-column prop="expiryDate" label="有效期" min-width="130" align="center"/>
        <el-table-column prop="initialQuantity" label="库存量" min-width="120" align="center" />
        <el-table-column prop="storageLocation" label="存储位置" min-width="170" align="center"/>
      </el-table>
    </el-card>

    <div class="pagination">
      <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadData"
          @size-change="handleSizeChange"
          background
      />
    </div>

    <el-dialog
        v-model="dialogVisible"
        title="新增药品批次"
        width="600px"
        :close-on-click-modal="false"
    >
      <el-form
          :model="formData"
          :rules="formRules"
          ref="formRef"
          label-width="100px"
          label-position="left"
      >
        <el-form-item label="采购订单号" prop="poId" :rules="purchaseOrdersPoId">
          <el-input v-model="purchaseOrders.poId" placeholder="请输入采购订单号" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchNo">
          <el-input v-model="formData.batchNo" placeholder="请输入批次号" />
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="药品ID" prop="medicineId">
              <el-input-number
                  v-model="formData.medicineId"
                  :min="1"
                  controls-position="right"
                  class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="供应商ID" prop="supplierId">
              <el-input-number
                  v-model="formData.supplierId"
                  :min="1"
                  controls-position="right"
                  class="w-full"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生产日期" prop="productionDate">
              <el-date-picker
                  v-model="formData.productionDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  :disabled-date="disableFutureDates"
                  placeholder="选择日期"
                  class="w-full"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="有效期" prop="expiryDate">
              <el-date-picker
                  v-model="formData.expiryDate"
                  type="date"
                  value-format="YYYY-MM-DD"
                  :disabled-date="disablePastDates"
                  placeholder="选择日期"
                  class="w-full"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="初始数量" prop="initialQuantity">
          <el-input-number
              v-model="formData.initialQuantity"
              :min="1"
              :max="9999"
              controls-position="right"
              class="w-full"
          />
        </el-form-item>

        <el-form-item label="存储位置" prop="storageLocation">
          <el-input v-model="formData.storageLocation" placeholder="请输入存储位置" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
            type="primary"
            :loading="submitting"
            @click="submitForm"
        >
          确认添加
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>
<style scoped>
.container {
  padding: 20px;
  background-color: #f5f7fa;
}

.search-box {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}

.search-input {
  width: 300px;
}

.table-box {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
}

:deep(.el-table__header) th {
  background-color: #f8f9fc;
  color: #606266;
}

:deep(.el-table--border) {
  border: 1px solid #ebeef5;
  border-radius: 8px;
}

:deep(.even-row) {
  background-color: #fafafa;
}

:deep(.odd-row) {
  background-color: #fff;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-input-number) {
  width: 100%;
}

@media (max-width: 768px) {
  .search-input {
    width: 100%;
    margin-bottom: 12px;
  }

  .search-box .flex {
    flex-direction: column;
  }
}
</style>