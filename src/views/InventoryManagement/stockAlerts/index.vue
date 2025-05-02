<script setup>
import {ref, reactive, onMounted, onBeforeUnmount} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus'
import {
  stockAlertsAddService,
  stockAlertsDeleteService,
  stockAlertsListService,
  stockAlertsUpdateService,
  stockAlertsEnableService
} from "@/api/stockAlerts.js"
import {useTimerStore} from "@/stores/index.js";

// 状态管理
const loading = ref(true)
const isSubmitting = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('新增规则')
const isEdit = ref(false)

// 数据相关
const stockAlertsList = ref([])
const formData = reactive({
  alertId: null,
  medicineId: '',
  minQuantity: 1,
  alertLevel: 'medium',
  notificationMethods: ['email'],
  isEnabled: true
})

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 搜索参数
const searchParams = reactive({
  medicineId: '',
  alertLevel: ''
})

// 映射配置
const levelMap = {
  high: '高危',
  medium: '中危',
  low: '低危'
}
const levelTagMap = {
  high: 'danger',
  medium: 'warning',
  low: 'success'
}
const methodMap = {
  email: '邮件',
  sms: '短信',
  system: '系统'
}
const methodTagMap = {
  email: 'primary',
  sms: 'success',
  system: 'info'
}

// 选项配置
const levelOptions = [
  {label: '高危', value: 'high'},
  {label: '中危', value: 'medium'},
  {label: '低危', value: 'low'}
]
const methodOptions = [
  {label: '邮件通知', value: 'email'},
  {label: '短信通知', value: 'sms'},
  {label: '系统通知', value: 'system'}
]

const formRef = ref()
// 表单验证规则
const rules = reactive({
  medicineId: [
    {required: true, message: '请输入药品ID', trigger: 'blur'}
  ],
  minQuantity: [
    {required: true, message: '请输入预警阈值', trigger: 'blur'},
    {type: 'number', min: 1, message: '阈值必须大于0'}
  ],
  alertLevel: [
    {required: true, message: '请选择预警等级', trigger: 'change'}
  ],
  notificationMethods: [
    {type: 'array', required: true, message: '请选择至少一种通知方式', trigger: 'change'}
  ]
})
const timerStore = useTimerStore()

onMounted(() => {
  fetchData()
  timerStore.startTimer(fetchData, 100000)
})

onBeforeUnmount(() => {
  timerStore.stopTimer()
})
// 数据获取
const fetchData = async () => {
  try {
    loading.value = true
    const params = {
      ...searchParams,
      page: pagination.currentPage,
      pageSize: pagination.pageSize
    }
    const res = await stockAlertsListService(params)
    stockAlertsList.value = res.data.records.map(item => ({
      ...item,
      // 处理混合格式的通知方式
      notificationMethods: JSON.parse(
          item.notificationMethods.replace(/'/g, '"')
      ).map(method => {
        const parts = method.split(':')
        // 优先取后半部分的英文标识
        return ['email', 'sms', 'system'].includes(parts[1])
            ? parts[1]
            : parts[0]
      }),
    }))
    pagination.total = res.data.total
  } catch (error) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

// 分页处理
const handleSizeChange = (newSize) => {
  pagination.pageSize = newSize
  pagination.currentPage = 1
  fetchData()
}

const handleCurrentChange = (newPage) => {
  pagination.currentPage = newPage
  fetchData()
}

// 表单操作
const openAddDialog = () => {
  isEdit.value = false
  dialogTitle.value = '新增规则'
  Object.assign(formData, {
    alertId: null,
    medicineId: '',
    minQuantity: 100,
    alertLevel: 'low',
    notificationMethods: ['email'],
    isEnabled: true
  })
  dialogVisible.value = true
}

const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑规则'
  Object.assign(formData, row)
  dialogVisible.value = true
}

const submitForm = async () => {
  try {
   const valid = await formRef.value.validate()
    if (!valid) {
      ElMessage.error('请填写完整信息')
      return
    }
    isSubmitting.value = true
    const submitData = {
      ...formData,
      // 转换回后端需要的格式
      notificationMethods: JSON.stringify(
          formData.notificationMethods.map(method =>
              `${methodMap[method]}:${method}`
          )
      ),
      is_enabled: formData.isEnabled ? 1 : 0
    }

    if (isEdit.value) {
      await stockAlertsUpdateService(submitData)
      ElMessage.success('更新成功')
    } else {
      await stockAlertsAddService(submitData)
      ElMessage.success('新增成功')
    }

    dialogVisible.value = false
    await fetchData()
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  } finally {
    isSubmitting.value = false
  }
}

// 状态切换
const handleToggleStatus = async (row) => {
  try {
    await stockAlertsEnableService({
      ...row,
      notificationMethods: JSON.stringify(
          formData.notificationMethods.map(method =>
              `${methodMap[method]}:${method}`
          )
      ),
      isEnabled: row.isEnabled
    })
    ElMessage.success('状态更新成功')
  } catch (error) {
    row.isEnabled = !row.isEnabled
    ElMessage.error('状态更新失败')
  }
}

// 删除处理
const handleDelete = async (alertId) => {
  try {
    await ElMessageBox.confirm('确认删除该预警规则？', '警告', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await stockAlertsDeleteService(alertId)
    ElMessage.success('删除成功')
    await fetchData()
  } catch (error) {
    // 取消删除不处理
  }
}
</script>
<template>
  <div class="container">
    <el-card class="search-box">
      <el-form :inline="true" :model="searchParams">
        <el-form-item label="药品ID">
          <el-input
              v-model="searchParams.medicineId"
              placeholder="请输入药品ID"
              clearable
          />
        </el-form-item>
        <el-form-item label="预警等级" style="width: 190px">
          <el-select
              v-model="searchParams.alertLevel"
              placeholder="请选择等级"
              clearable
          >
            <el-option
                v-for="item in levelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchData" :disabled="loading">查询</el-button>
          <el-button type="success" @click="openAddDialog">新增规则</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-box" v-loading="loading">
      <el-table
          :data="stockAlertsList"
          style="width: 100%"
          stripe
          border
      >
        <el-table-column
            prop="medicineId"
            label="药品ID"
            min-width="120"
            align="center"
        />
        <el-table-column
            prop="minQuantity"
            label="预警阈值"
            min-width="100"
            align="center"
        />
        <el-table-column
            label="预警等级"
            min-width="120"
            align="center"
        >
          <template #default="{row}">
            <el-tag :type="levelTagMap[row.alertLevel]">
              {{ levelMap[row.alertLevel] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
            label="通知方式"
            min-width="180"
            align="center"
        >
          <template #default="{row}">
            <el-space>
              <el-tag
                  v-for="method in row.notificationMethods"
                  :key="method"
                  :type="methodTagMap[method]"
              >
                {{ methodMap[method] }}
              </el-tag>
            </el-space>
          </template>
        </el-table-column>
        <el-table-column
            label="状态"
            min-width="100"
            align="center"
        >
          <template #default="{row}">
            <el-switch
                v-model="row.isEnabled"
                @change="handleToggleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column
            label="操作"
            width="150"
            align="center"
            fixed="right"
        >
          <template #default="scope">
            <el-button
                type="primary"
                size="small"
                @click="handleEdit(scope.row)"
            >编辑</el-button>
            <el-button
                type="danger"
                size="small"
                style="margin-left: 10px"
                plain
                @click="handleDelete(scope.row.alertId)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
          background
          :current-page="pagination.currentPage"
          :page-sizes="[10, 20, 50]"
          :page-size="pagination.pageSize"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      />
    </div>

    <!-- 新增/编辑对话框 -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="600px"
    >
      <el-form
          :model="formData"
          :rules="rules"
          ref="formRef"
          label-width="100px"
      >
        <el-form-item label="药品ID" prop="medicineId" v-if="!isEdit">
          <el-input v-model="formData.medicineId" />
        </el-form-item>
        <el-form-item label="预警阈值" prop="minQuantity">
          <el-input-number
              v-model="formData.minQuantity"
              :min="1"
              controls-position="right"
          />
        </el-form-item>
        <el-form-item label="预警等级" prop="alertLevel">
          <el-select
              v-model="formData.alertLevel"
              placeholder="请选择等级"
          >
            <el-option
                v-for="item in levelOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="通知方式" prop="notificationMethods">
          <el-checkbox-group v-model="formData.notificationMethods">
            <el-checkbox
                v-for="item in methodOptions"
                :key="item.value"
                :label="item.value"
            >
              {{ item.value === 'email' ? item.label : item.label + '(暂不可用)' }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="启用状态">
          <el-switch v-model="formData.isEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
            type="primary"
            :disabled="isSubmitting"
            @click="submitForm"
        >
          {{ isSubmitting ? '提交中...' : '提交' }}
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
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
}

.table-box {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, .1);
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

:deep(.el-form--inline .el-form-item) {
  margin-right: 20px;
  margin-bottom: 0;
}

:deep(.el-tag) {
  margin: 2px;
}
</style>
