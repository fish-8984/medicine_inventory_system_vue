<script setup>
import {ref, onMounted, reactive, watch, onBeforeUnmount} from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTimerStore } from "@/stores/index.js";
import {
  prescriptionsAddService,
  prescriptionsPageService,
  prescriptionsUpdateService,
  prescriptionsDeleteService, prescriptionsDispensingService
} from '@/api/prescriptions.js'
import {
  prescriptionMedicinesGetIdService
} from '@/api/prescriptionMedicines.js'
import {staffFetchIdService, staffGetNameService} from "@/api/staff.js";
import {patientsFetchIdService, patientsFetchNameService, patientsFetchService} from "@/api/patients.js";
import {medicineGetService} from "@/api/medicines.js";
import {pharmaceuticalBatchesGetService} from "@/api/pharmaceuticalBatches.js";
import {useUserStore} from "@/stores/index.js";

// 表单引用和验证规则
const formRef = ref()
const rules = ref({
  'prescriptions.patientId': [{ required: true, message: '患者不能为空', trigger: 'blur' }],
  'prescriptions.doctorId': [{ required: true, message: '医生不能为空', trigger: 'blur' }],
  'prescriptions.prescriptionDate': [{ required: true, message: '处方日期不能为空', trigger: 'change' }]
})
const prescriptionMedicines = ref([
  {
    recordId: null,
    prescriptionId: null,
    medicineId: null,
    medicineName: '',
    batches: [],
    batchNo: "",
    dosage: "",
    quantityDispensed: null
  }
])

const prescriptions = ref({
      prescriptionId: null,
      patientId: null,
      doctorId: null,
      prescriptionDate: "",
      status: "",
      dispensedBy: null,
      dispensedAt: ""
}
)
const prescriptionPage = ref({
  page: 1,
  pageSize: 10,
  patientId: null,
  doctorId: null,
  prescriptionDate: "",
  status: "0",
  dispensedBy: null
})
const prescriptionPageList = ref([])
const loading = ref(true)
const isSubmitting = ref(false)
// 分页逻辑
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const userStores = useUserStore();
const doctorName = ref('');
const openAddDialog = () => {
  isEdit.value = false
  dialogTitle.value = '新增处方'
  prescriptionMedicines.value = [
    {
      recordId: null,
      prescriptionId: null,
      medicineId: null,
      batchNo: "",
      dosage: "",
      quantityDispensed: null
    }
  ]
  prescriptions.value = {
    prescriptionId: null,
    patientId: null,
    doctorId: null,
    prescriptionDate: "",
    status: "",
    dispensedBy: null,
    dispensedAt: ""
  }
  doctorName.value = userStores.getName()
  patientName.value = ''
  dialogVisible.value = true
}
const showDetails = ref(false);
// 打开对话框
const handleEdit = async (row) => {
  try {
    doctorName.value = userStores.getName()
    // 获取处方药品详情
    const medicinesRes = await prescriptionMedicinesGetIdService(row.prescriptionId);
    prescriptionMedicines.value = medicinesRes.data;

    // 加载患者姓名
    const patientRes = await patientsFetchIdService(row.patientId);
    patientName.value = patientRes.data.name;

    // 加载药品详细信息
    for (const item of prescriptionMedicines.value) {
      if (item.medicineId) {
        // 获取药品名称
        const medicineRes = await medicineGetService({ medicineId: item.medicineId });
        item.medicineName = medicineRes.data.name;

        // 获取药品批次
        const batchRes = await pharmaceuticalBatchesGetService(item.medicineId);
        item.batches = batchRes.data;
      }
    }

    // 初始化表单数据
    isEdit.value = true;
    dialogTitle.value = '编辑处方';
    prescriptions.value = {
      ...row,
      patientId: row.patientId, // 保持ID用于提交
      doctorId: row.doctorId
    };

    dialogVisible.value = true;
  } catch (error) {
    ElMessage.error('数据加载失败');
  }
};
// 新增对话框显示状态
const dialogVisible = ref(false)
const dialogTitle = ref('新增处方')
const isEdit = ref(false)

// 获取患者id对应的姓名
const patientIdCache = reactive(new Map()); // 缓存数据
const requestPromises = new Map();          // 缓存请求 Promise

const formatterPatientId = (row, column, cellValue) => {
  // 1. 如果已有缓存数据，直接返回
  if (patientIdCache.has(cellValue)) {
    return patientIdCache.get(cellValue);
  }

  // 2. 如果当前 ID 的请求正在进行，返回加载中
  if (requestPromises.has(cellValue)) {
    return '加载中...';
  }

  // 3. 发起请求并记录 Promise
  const promise = getPatientId(cellValue);
  requestPromises.set(cellValue, promise);

  // 4. 请求完成后清理 Promise 记录，并更新缓存
  promise.finally(() => {
    requestPromises.delete(cellValue);
  });

  return '加载中...';
};

const getPatientId = async (id) => {
  try {
    const res = await patientsFetchIdService(id);
    const name = res.code === 1 ? res.data.name : '未知';
    patientIdCache.set(id, name); // 更新缓存
  } catch (error) {
    patientIdCache.set(id, '未知');
  }
};

// 获取医生id对应的姓名
const doctorIdCache = reactive(new Map()); // 缓存数据
const requestPromisesDoctor = new Map();          // 缓存请求 Promise
const formatterDoctorId = (row, column, cellValue) => {
  // 1. 如果已有缓存数据，直接返回
  if (doctorIdCache.has(cellValue)) {
    return doctorIdCache.get(cellValue);
  }

  // 2. 如果当前 ID 的请求正在进行，返回加载中
  if (requestPromisesDoctor.has(cellValue)) {
    return '加载中...';
  }

  // 3. 发起请求并记录 Promise
  const promise = getDoctorId(cellValue);
  requestPromisesDoctor.set(cellValue, promise);

  // 4. 请求完成后清理 Promise 记录，并更新缓存
  promise.finally(() => {
    requestPromisesDoctor.delete(cellValue);
  });
  return '加载中...';
};

const getDoctorId = async (id) => {
  try {
    const res = await staffFetchIdService(id);
    const name = res.code === 1 ? res.data.name : '未知';
    doctorIdCache.set(id, name); // 更新缓存
  } catch (error) {
    doctorIdCache.set(id, '未知');
  }
};


// 获取处方列表
const fetchPrescriptions = async () => {
  loading.value = true
  const prescriptionPageRequest = { ...prescriptionPage.value }
  try {
    const patientName = prescriptionPageRequest.patientId
    if (patientName !== null && patientName !== '') {
     const patients = await patientsFetchNameService(patientName)
      let patientIdName = []
      patients.data.forEach(patient => {
        if (patient.name === prescriptionPageRequest.patientId) {
          patientIdName.push(patient.patientId)
        }
      })
      prescriptionPageRequest.patientId = patientIdName.join(',')
    }
    if (prescriptionPageRequest.doctorId !== '' && prescriptionPageRequest.doctorId !== null) {
      const patients = await staffGetNameService(prescriptionPageRequest.doctorId)
      prescriptionPageRequest.doctorId = patients.data.staffId
    }
    const res = await prescriptionsPageService(prescriptionPageRequest)
    prescriptionPageList.value = res.data.records
    pagination.value.total = res.data.total
  } finally {
    loading.value = false
  }
}

// 处理分页变化
const handleSizeChange = (newSize) => {
  pagination.value.pageSize = newSize
  prescriptionPage.value.pageSize = newSize
  pagination.value.currentPage = 1 // 重置页码
  fetchPrescriptions()
}

const handleCurrentChange = (newPage) => {
  pagination.value.currentPage = newPage
  prescriptionPage.value.page = newPage
  fetchPrescriptions()
}

const medicineSelectVisible = ref(false)
const currentMedicineIndex = ref(null)
const medicineList = ref([])
const medicineQuery = ref({
  page: 1,
  pageSize: 4,
  name: '',
  brand: ''
})
const medicinePagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})
// 获取药品列表方法
const getMedicines = async () => {
  try {
    const res = await medicineGetService(medicineQuery.value)
    if (res.code === 1) {
      medicineList.value = res.data.records
      medicinePagination.value.total = res.data.total
    }
  } catch (e) {
    ElMessage.error('药品加载失败')
  }
}

// 打开药品选择对话框
const openMedicineSelect = (index) => {
  currentMedicineIndex.value = index
  medicineSelectVisible.value = true
  getMedicines()
}
const batches = ref([])
const medicineName = ref('')
// 选择药品后的回调
const selectMedicine = (medicine) => {
  medicineName.value = medicine.name
  pharmaceuticalBatchesGetService(medicine.medicineId).then(res => {
    if (res.code === 1) {
      if (res.data.length === 0) {
        ElMessage.error('该药品暂未配货')
        return
      }
      prescriptionMedicines.value[currentMedicineIndex.value].medicineId = medicine.medicineId
      batches.value = res.data
      medicineSelectVisible.value = false
    }
  })
   .catch(error => {
       ElMessage.error('该药品暂未配货')
   })
}
// 添加药品条目
const addMedicine = () => {
  prescriptionMedicines.value.push({
    medicineId: null,
    batchNo: "",
    dosage: "",
    quantityDispensed: null
  })
}

// 删除药品条目
const removeMedicine = (index) => {
  if (prescriptionMedicines.value.length > 1) {
    prescriptionMedicines.value.splice(index, 1)
  }
}

// 提交表单
const submitForm = async () => {
  await formRef.value.validate()
  isSubmitting.value = true
  try {
    if (doctorName.value !== null && doctorName.value !== '') {
      await staffGetNameService(doctorName.value).then(res => {
        prescriptions.value.doctorId = res.data.staffId
      })
    }
    const payload = {
      prescriptions: prescriptions.value,
      prescriptionMedicines: prescriptionMedicines.value
    }

    if (isEdit.value) {
      await prescriptionsUpdateService(payload)
    } else {
      await prescriptionsAddService(payload)
    }

    ElMessage.success(`${isEdit.value ? '修改' : '新增'}成功`)
    dialogVisible.value = false
    await fetchPrescriptions()
  } finally {
    isSubmitting.value = false
  }
}
// 查看处方详情
const prescription = ref( {
  dispensedAt: "",
  dispensedBy: null,
  doctorId: null,
  patientId: null,
  prescriptionDate: "",
  prescriptionId: null,
  status: ""
});

// 字段中文映射
const fieldLabels = {
  prescriptionId: '处方ID',
  patientId: '患者',
  doctorId: '开方医生',
  prescriptionDate: '开方时间',
  dispensedAt: '发药时间',
  dispensedBy: '发药人',
  status: '处方状态'
};

// 状态映射
const statusMap = {
  '2': '已分发',
  '1': '发药中',
  '0': '待发药'
};

// 状态标签样式映射
const statusTagMap = {
  '2': 'success',
  '1': 'info',
  '0': 'warning'
};

// 时间格式化函数
const formatDateTime = (datetime) => {
  if (!datetime) return '';
  const [date, time] = datetime.split(' ');
  const [year, month, day] = date.split('-');
  return `${year}年${month}月${day}日 ${time}`;
};
const handleView = async (row) => {
  try {
    if (row.dispensedBy === null || row.dispensedBy === '') {
      row.dispensedBy = ''
    }else{
      if (!isNaN(row.dispensedBy)) {
        const res = await staffFetchIdService(row.dispensedBy)
        row.dispensedBy = res.code === 1 ? res.data.name : '未知'
      }
    }
    let doctorId = '未知'
    let patientId = '未知'
    if (!isNaN(row.doctorId)) {
      doctorId = formatterDoctorId(row, null, row.doctorId)
    }
    if (!isNaN(row.patientId)) {
      patientId = formatterPatientId(row, null, row.patientId)
    }
    prescription.value = {
      ...row,
      doctorId: doctorId,
      patientId: patientId
    }
    const res = await prescriptionMedicinesGetIdService(row.prescriptionId)
    prescriptionMedicines.value = res.data || []
    showDetails.value = true
  } catch (error) {
    console.error('数据获取失败:', error)
  }
}
// 删除处方
const handleDelete = async (id) => {
  await ElMessageBox.confirm('确认删除该处方？', '警告', { type: 'warning' })
  await prescriptionsDeleteService(id)
  ElMessage.success('删除成功')
  await fetchPrescriptions()
}
const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}


const patientSelectVisible = ref(false)
const patientQuery = ref({
  name: '',
  contactPhone: '',
  page: 1,
  pageSize: 4
})
const patientList = ref([])
const patientPagination = ref({
  currentPage: 1,
  pageSize: 4,
  total: 0
})

// 添加患者选择方法
const openPatientSelect = () => {
  patientSelectVisible.value = true
  patientQuery.page = 1
  getPatients()
}

const getPatients = async () => {
  try {
    const res = await patientsFetchService(patientQuery.value)
    if (res.code === 1) {
      patientList.value = res.data.records
      patientPagination.value.total = res.data.total
    } else {
      ElMessage.error('获取患者列表失败')
    }
  } catch (error) {
    console.error('获取患者列表失败', error)
  }
}

const patientName = ref('')
const selectPatient = (patient) => {
  prescriptions.value.patientId = patient.patientId
  patientName.value = patient.name
  patientSelectVisible.value = false
}

watch(patientSelectVisible, (val) => {
  if (!val) {
    patientQuery.name = ''
    patientQuery.phone = ''
  }
})
// 在methods中增加
const calculateAge = (birthdate) => {
  const today = new Date()
  const birthDate = new Date(birthdate)
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age + '岁'
}
// 发药
const handleSend = async (row) => {
  try {
    await ElMessageBox.confirm('确认发药？', '警告', { type: 'warning' })
    await prescriptionsDispensingService(row.prescriptionId)
    ElMessage.success('发药成功')
    await fetchPrescriptions()
  } catch (error) {
    console.error('发药失败', error)
  }
}

const timerStore = useTimerStore()

onMounted(() => {
  fetchPrescriptions()
  timerStore.startTimer(fetchPrescriptions, 10000)
})

onBeforeUnmount(() => {
  timerStore.stopTimer()
})
</script>

<template>
  <div class="app-container">
    <!-- 搜索和操作栏 -->
    <el-card>
      <el-form
          :inline="true"
          :model="prescriptionPage"
      >
        <el-form-item label="患者" prop="patientId" style="width: 170px">
          <el-input v-model="prescriptionPage.patientId" />
        </el-form-item>
        <el-form-item label="医生" prop="doctorId" style="width: 170px">
          <el-input v-model="prescriptionPage.doctorId" />
        </el-form-item>
        <el-form-item label="处方日期" prop="prescriptionDate" style="width: 190px">
          <el-date-picker
              v-model="prescriptionPage.prescriptionDate"
              type="date"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status" style="width: 140px">
          <el-select v-model="prescriptionPage.status"
                     clearable
                     placeholder="请选择"
          >
            <el-option label="待发药" value="0" />
            <el-option label="发药中" value="1" />
            <el-option label="已分发" value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchPrescriptions">查询</el-button>
          <el-button type="success" @click="openAddDialog">新增处方</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <!-- 处方列表表格 -->
    <el-card v-loading="loading" class="search-box">
    <el-table
        :row-class-name="tableRowClassName"
        :data="prescriptionPageList"
        border
        style="width: 100%"
    >
      <el-table-column prop="prescriptionId" label="处方ID" min-width="120" />
      <el-table-column prop="patientId" label="患者" min-width="100" :formatter="formatterPatientId" />
      <el-table-column prop="doctorId" label="医生" min-width="100" :formatter="formatterDoctorId"/>
      <el-table-column prop="prescriptionDate" label="开具日期" min-width="150" />
      <el-table-column prop="status" label="状态" min-width="120">
        <template #default="{row}">
          <el-tag :type="row.status === '2' ? 'success' : row.status === '1' ? 'info' : 'warning'">
            {{ row.status === '2'? '已分发' : row.status === '1'? '发药中' : '待发药' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="220">
        <template #default="{row}">
          <el-button size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button size="small" type="primary" @click="handleView(row)">查看</el-button>
          <el-button size="small" type="warning" @click="handleSend(row)">发药</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row.prescriptionId)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    </el-card>
    <div>
      <!-- 分页组件 -->
      <div class="pagination">
        <el-pagination
            background: true
            :current-page="pagination.currentPage"
            :page-sizes="[10, 20, 50]"
            :page-size="pagination.pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="pagination.total"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
        />
      </div>

    <!-- 处方编辑对话框 -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="800px"
    >
      <el-form
          ref="formRef"
          :model="{ prescriptions, prescriptionMedicines }"
          :rules="rules"
          label-width="100px"
      >
        <el-form-item label="患者" prop="prescriptions.patientId">
          <el-tag type="primary">{{ patientName === null || patientName === '' ? "请选择患者" : patientName }}</el-tag>
          <span style="width: 20px"></span>
          <el-button type="primary" @click="openPatientSelect" size="small">选择患者</el-button>
        </el-form-item>

        <el-form-item label="医生" prop="prescriptions.doctorId">
          <el-tag type="primary">{{ doctorName }}</el-tag>
        </el-form-item>

        <!-- 药品列表 -->
        <div v-for="(item, index) in prescriptionMedicines" :key="index" class="medicine-item">
          <el-divider>{{ item.medicineName || '选择药品' }}</el-divider>
          <el-form-item
              :label="`药品`"
              :prop="`prescriptionMedicines[${index}].medicineId`"
          >
            <div class="flex items-center">
              <el-button
                  type="primary"
                  class="ml-2"
                  @click="openMedicineSelect(index)"
                  size="small"
              >
                选择药品
              </el-button>
            </div>
          </el-form-item>

          <el-form-item label="批号">
            <el-select v-model="item.batchNo">
              <el-option
                  v-for="batch in item.batches"
                  :key="batch.batchNo"
                  :label="batch.batchNo"
                  :value="batch.batchNo"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="用量" >
            <el-input v-model="item.dosage" />
          </el-form-item>

          <el-form-item label="数量" >
            <el-input-number v-model="item.quantityDispensed" min="1"/>
          </el-form-item>

          <el-button type="danger" @click="removeMedicine(index)" size="small">删除</el-button>
        </div>

        <el-dialog
            v-model="patientSelectVisible"
            title="选择患者"
            width="60%"
            append-to-body
        >
          <div class="patient-select-box">
            <div style="height: 50px">
            <el-space :size="20" class="mb-4">
              <el-input
                  v-model="patientQuery.name"
                  placeholder="患者姓名"
                  @change="getPatients"
                  clearable
              />
              <el-input
                  v-model="patientQuery.contactPhone"
                  placeholder="手机号码"
                  @change="getPatients"
                  clearable
              />
            </el-space>
            </div>
            <!-- 患者列表 -->
            <div class="patient-list" >
              <div
                  v-for="patient in patientList"
                  :key="patient.patientId"
                  class="patient-item"
                  @click="selectPatient(patient)"
              >
                <el-card class="select-card">
                  <div class="font-bold mb-2">姓名：{{ patient.name }}</div>
                  <div class="text-sm">
                    <div>年龄：{{ calculateAge(patient.birthdate) }}</div> <!-- 增加年龄计算 -->
                    <div>性别：{{ patient.gender === '0' ? '女' : '男' }}</div>
                    <div class="mt-1">电话：{{ patient.contactPhone }}</div>
                  </div>
                </el-card>
              </div>
            </div>
            <!-- 分页 -->
            <el-pagination
                :background="true"
                :current-page="patientQuery.page"
                :page-size="patientQuery.pageSize"
                layout="total, prev, pager, next"
                :total="patientPagination.total"
                @current-change="val => { patientQuery.page = val; getPatients() }"
                class="mt-4"
            />
          </div>
        </el-dialog>

        <el-dialog
            v-model="medicineSelectVisible"
            title="选择药品"
            width="60%"
            append-to-body
        >
          <div class="medicine-select-box">
            <div style="height: 50px">
            <el-space :size="20" class="mb-4">
              <el-input
                  v-model="medicineQuery.name"
                  placeholder="药品名称"
                  @change="getMedicines"
                  clearable
              />
              <el-input
                  v-model="medicineQuery.brand"
                  placeholder="品牌"
                  @change="getMedicines"
                  clearable
              />
            </el-space>
          </div>
            <!-- 药品列表 -->
            <div class="medicine-list">
              <div
                  v-for="medicine in medicineList"
                  :key="medicine.medicineId"
                  class="medicine-item"
                  @click="selectMedicine(medicine)"
              >
                <el-card class="select-card">
                  <div class="font-bold mb-2">药品：{{ medicine.name }}</div>
                  <div class="text-sm">
                    <div>规格：{{ medicine.specification }}</div>
                    <div>品牌：{{ medicine.brand }}</div>
                    <div>分类：{{ medicine.categoryId }}</div>
                  </div>
                </el-card>
              </div>
            </div>

            <!-- 分页 -->
            <el-pagination
                :background="true"
                :current-page="medicineQuery.page"
                :page-size="medicineQuery.pageSize"
                layout="total, prev, pager, next"
                :total="medicinePagination.total"
                @current-change="val => { medicineQuery.page = val; getMedicines() }"
                class="mt-4"
            />
          </div>
        </el-dialog>

        <el-button type="primary" @click="addMedicine" size="small">添加药品</el-button>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="isSubmitting" @click="submitForm">确认</el-button>
      </template>
    </el-dialog>
  </div>


    <!-- 处方详情对话框 -->
    <el-dialog
        v-model="showDetails"
        title="处方详情"
        width="800px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item
            v-for="(value, key) in prescription"
            :key="key"
            :label="fieldLabels[key]"
            width="200px"
        >
          <!-- 特殊处理状态字段 -->
          <span v-if="key === 'status'">
            <el-tag :type="statusTagMap[value]">
              {{ statusMap[value] }}
            </el-tag>
          </span>

          <!-- 处理时间格式 -->
          <span v-else-if="key.includes('Date') || key === 'dispensedAt'">
            {{ formatDateTime(value) }}
          </span>

          <!-- 默认显示 -->
          <span v-else>
            {{ value }}
          </span>
        </el-descriptions-item>
      </el-descriptions>
      <!-- 药品信息表格 -->
      <h4 class="mb-3">药品明细</h4>
      <el-table
          :data="prescriptionMedicines"
          border
          empty-text="暂无药品数据"
      >
        <el-table-column
            prop="medicineId"
            label="药品ID"
            width="120"
        />
        <el-table-column
            prop="batchNo"
            label="批次号"
            width="180"
        />
        <el-table-column
            prop="dosage"
            label="剂量"
        >
          <template #default="{ row }">
            {{ row.dosage }}
          </template>
        </el-table-column>
        <el-table-column
            prop="quantityDispensed"
            label="分发数量"
        />
        <el-table-column
            prop="recordId"
            label="记录ID"
            width="120"
        />
      </el-table>
    </el-dialog>
</div>
</template>

<style scoped>
.medicine-item {
  position: relative;
  margin-bottom: 20px;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
}
.search-box {
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}
.select-card {
  margin-bottom: 12px;
  padding: 16px;
  border-radius: 8px;
  transition: all 0.3s;
  cursor: pointer;
}

.select-card:hover {
  box-shadow: 0 2px 12px 0 rgba(0,0,0,0.1);
}

/* 统一字段样式 */
.text-sm {
  font-size: 13px;
  color: #606266;
}

.mb-2 {
  margin-bottom: 8px;
}
</style>