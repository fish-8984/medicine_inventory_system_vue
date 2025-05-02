<script setup>
import {ref, reactive, onMounted, onBeforeUnmount} from 'vue'
import { ElMessage } from 'element-plus'
import {
  purchaseAddService,
  purchaseUpdateService,
  purchaseGetIdService,
  purchasePageService
} from '@/api/purchaseRecords.js'
import {medicineGetNameService} from "@/api/medicines.js";
import {useTimerStore} from "@/stores/index.js";


// 表格数据
const tableData = ref([])
const loading = ref(false)

// 分页参数
const pagination = reactive({
  current: 1,
  size: 10,
  total: 0
})

// 搜索条件
const searchForm = reactive({
  medicineId: '',
  batchNo: ''
})

// 对话框相关
const dialogVisible = ref(false)
const dialogType = ref('add')
const formData = reactive({
  recordId: '',
  poId: '',
  medicineId: '',
  batchNo: '',
  quantity: 1,
  unitPrice: 0
})

// 表单验证规则
const formRules = reactive({
  poId: [{ required: true, message: '请输入采购订单号', trigger: 'blur' }],
  medicineId: [{ required: true, message: '请输入药品ID', trigger: 'blur' }],
  batchNo: [{ required: true, message: '请输入批次号', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
  unitPrice: [{ required: true, message: '请输入单价', trigger: 'blur' }]
})

// 加载数据
const loadData = async () => {
  let medicineName = ''
  if (isNaN(searchForm.medicineId)){
    const medicine =  await medicineGetNameService(searchForm.medicineId)
    medicineName = medicine.data.join(',')
  }
  try {
    loading.value = true
    const res = await purchasePageService({
      page: pagination.current,
      pageSize: pagination.size,
      ...searchForm,
      medicineId: medicineName
    })
    tableData.value = res.data.records
    pagination.total = res.data.total
  } catch (error) {
    ElMessage.error(error.message || '数据加载失败')
  } finally {
    loading.value = false
  }
}

// 新增操作
const handleAdd = () => {
  dialogType.value = 'add'
  Object.keys(formData).forEach(key => {
    if (key === 'quantity') {
      formData[key] = 1
    } else if (key === 'unitPrice') {
      formData[key] = 0
    } else {
      formData[key] = ''
    }
  })
  dialogVisible.value = true
}

// 编辑操作
const handleEdit = async (row) => {
  dialogType.value = 'edit'
  try {
    const res = await purchaseGetIdService(row.recordId)
    Object.assign(formData, res.data)
    dialogVisible.value = true
  } catch (error) {
    ElMessage.error(error.message || '获取详情失败')
  }
}

// 提交表单
const submitForm = async () => {
  try {
    if (dialogType.value === 'add') {
      await purchaseAddService(formData)
      ElMessage.success('新增成功')
    } else {
      await purchaseUpdateService(formData)
      ElMessage.success('更新成功')
    }
    dialogVisible.value = false
    await loadData()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}
const timerStore = useTimerStore()

onMounted(() => {
  loadData()
  timerStore.startTimer(loadData, 100000)
})

onBeforeUnmount(() => {
  timerStore.stopTimer()
})

</script>
<template>
  <div class="container">
    <!-- 搜索栏 -->
    <el-card class="search-box" style="width: 100%">
      <el-form :inline="true">
        <el-form-item label="药品ID">
          <el-input
              v-model="searchForm.medicineId"
              placeholder="输入ID或名称"
              clearable
              class="search-input"
          />
        </el-form-item>
        <el-form-item label="批次号">
          <el-input
              v-model="searchForm.batchNo"
              placeholder="输入批次号"
              clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button type="success" @click="handleAdd">新增采购</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-box" v-loading="loading" style="width: 100%">
      <el-table
          :data="tableData"
          stripe
          border
          style="width: 100%"
          :row-class-name="({ rowIndex }) => rowIndex % 2 ? 'odd-row' : 'even-row'"
      >
      <el-table-column prop="recordId" label="记录ID" min-width="120" />
      <el-table-column prop="poId" label="采购订单号" min-width="150" />
      <el-table-column prop="medicineId" label="药品ID" min-width="120" />
      <el-table-column prop="batchNo" label="批次号" min-width="150" />
      <el-table-column prop="quantity" label="数量" min-width="130" />
      <el-table-column prop="unitPrice" label="单价" min-width="130" />
      <el-table-column prop="totalPrice" label="总价" min-width="130">
        <template #default="{row}">
          {{ (row.quantity * row.unitPrice).toFixed(2) }} 元
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="180">
        <template #default="{row}">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>
    </el-card>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
          background
          v-model:current-page="pagination.current"
          v-model:page-size="pagination.size"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="loadData"
          @size-change="loadData"
      />
    </div>

    <!-- 对话框 -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogType === 'add' ? '新增采购' : '编辑采购'"
        width="600px"
    >
      <el-form
          :model="formData"
          :rules="formRules"
          ref="formRef"
          label-width="100px"
      >
        <el-form-item label="采购订单号" prop="poId">
          <el-input v-model="formData.poId" />
        </el-form-item>
        <el-form-item label="药品ID" prop="medicineId">
          <el-input v-model="formData.medicineId" />
        </el-form-item>
        <el-form-item label="批次号" prop="batchNo">
          <el-input v-model="formData.batchNo" />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number
              v-model="formData.quantity"
              :min="1"
              :precision="0"
              controls-position="right"
          />
        </el-form-item>
        <el-form-item label="单价" prop="unitPrice">
          <el-input-number
              v-model="formData.unitPrice"
              :min="0"
              :precision="2"
              controls-position="right"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
            type="primary"
            @click="submitForm"
            :disabled="isSubmitting"
        >{{ isSubmitting ? '提交中...' : '确认' }}</el-button>
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

.search-input {
  width: 200px;
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

:deep(.el-form--inline .el-form-item) {
  margin-right: 20px;
  margin-bottom: 0;
}
</style>