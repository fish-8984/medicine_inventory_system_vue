<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import { ElMessage } from 'element-plus';
import {patientsAddService, patientsFetchService, patientsUpdateService} from '@/api/patients.js'
import {useTimerStore} from "@/stores/index.js";
const loading = ref(true)
const isSubmitting = ref(false)
const patientsPage = ref([])
const patients = ref({
  patientId: null,
  name: "",
  gender: "",
  birthdate: "",
  contactPhone: "",
  createdAt: ""
})
const pagePatients = ref({
  page: null,
  pageSize: null,
  name: "",
  gender: "",
  birthdate: "",
  contactPhone: ""
})

// 新增对话框显示状态
const dialogVisible = ref(false)
const dialogTitle = ref('新增患者')
const isEdit = ref(false)


// 新增分页相关逻辑
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})
// 定义校验规则
const form = ref();
const rules = ref({
  name: [
    { required: true, message: '姓名不能为空', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' },
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' },
  ],
  birthdate: [
    { required: true, message: '请选择出生日期', trigger: 'change' },
  ],
  contactPhone: [
    { required: true, message: '联系电话不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' },
  ],
});

// 新增对话框关闭事件
const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑患者'
  patients.value = { ...row } // 复制对象
  dialogVisible.value = true
}



// 表格行样式
const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}

const getPatients = async () => {
  console.log('请求参数：', {
    ...pagePatients.value,
    page: pagination.value.currentPage,
    pageSize: pagination.value.pageSize,
  });
  loading.value = true
  try {
    const res = await patientsFetchService(pagePatients.value);
    if (res.code === 1) {
      patientsPage.value = res.data.records;
      pagination.value.total = res.data.total;
    } else {
      ElMessage.error(res.msg); // 只有在请求失败时显示错误提示
    }
    loading.value = false
  } catch (e) {
    loading.value = false
    ElMessage.error('请求失败');
    console.error(e);
  }
};

const handleSizeChange = (newSize) => {
  pagination.value.pageSize = newSize
  pagePatients.value.pageSize = newSize
  pagination.value.currentPage = 1 // 重置页码
  getPatients()
}

const handleCurrentChange = (newPage) => {
  pagination.value.currentPage = newPage
  pagePatients.value.page = newPage
  getPatients()
}

const openAddDialog = () => {
  isEdit.value = false
  dialogTitle.value = '新增患者'
  patients.value = {
    patientId: null,
    name: "",
    gender: "",
    birthdate: "",
    contactPhone: "",
    createdAt: ""
  }      // 清空表单
  dialogVisible.value = true
}

const submitForm = async () => {
  console.log('提交表单', patients.value);
  if (isSubmitting.value) return;
  isSubmitting.value = true;
  // 表单校验
  try {
    await new Promise((resolve, reject) => {
      form.value.validate((valid) => {
        if (!valid) {
          ElMessage.error("表单不完整");
          reject(new Error('表单校验未通过')); // 抛出错误
          isSubmitting.value = false;
        } else {
          resolve(); // 校验通过
        }
      });
    });
    // 校验通过后执行后续逻辑
    if (isEdit.value) {
      console.log('执行更新操作', patients.value);
      await updatePatient();
    } else {
      console.log('执行新增操作', patients.value);
      await addPatient();
    }
    isSubmitting.value = false;
    dialogVisible.value = false;
  } catch (error) {
    if (error.message !== '表单校验未通过') {
      ElMessage.error('操作失败，请重试');
      isSubmitting.value = false;
      console.error('操作失败:', error);
    }
  }
};

const addPatient = async () => {
  const res = await patientsAddService(patients.value);
  if (res.code === 1) {
    ElMessage.success("新增患者成功");
    await getPatients();
  } else {
    throw new Error(res.msg); // 抛出异常以便在 submitForm 中捕获
  }
};


const updatePatient = async () => {
  const res = await patientsUpdateService(patients.value);
  if (res.code === 1) {
    ElMessage.success("更新患者成功");
    await getPatients();
  } else {
    throw new Error(res.msg); // 抛出异常以便在 submitForm 中捕获
  }
};

const formatGender = (row, column, value) => {
  return value === '1' ? '男' : '女';
}
const timerStore = useTimerStore()

onMounted(() => {
  getPatients()
  timerStore.startTimer(getPatients, 100000)
})

onBeforeUnmount(() => {
  timerStore.stopTimer()
})


</script>



<template>
  <div class="container">
    <!-- 搜索区域 -->
    <el-card class="search-box">
      <el-form :inline="true" :model="pagePatients">
        <el-form-item label="姓名" style="width: 160px">
          <el-input
              v-model="pagePatients.name"
              placeholder="请输入姓名"
              clearable
          />
        </el-form-item>
        <el-form-item label="性别" style="width: 150px">
          <el-select
              v-model="pagePatients.gender"
              placeholder="请选择"
              clearable
              style="width: 90px"
          >
            <el-option label="男" value="1" />
            <el-option label="女" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="出生日期" style="width: 190px">
          <el-date-picker
              v-model="pagePatients.birthdate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="联系电话" style="width: 200px">
          <el-input
              v-model="pagePatients.contactPhone"
              placeholder="请输入电话"
              clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getPatients" :disabled="loading">查询</el-button>
          <el-button type="success" @click="openAddDialog">新增患者</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格 -->
    <el-card class="table-box" v-loading="loading">
      <el-table
          :data="patientsPage"
          style="width: 100%"
          :row-class-name="tableRowClassName"
          stripe
          border
      >
        <el-table-column
            prop="name"
            label="姓名"
            min-width="120"
            align="center"
        />
        <el-table-column
            prop="gender"
            label="性别"
            min-width="80"
            align="center"
            :formatter="formatGender"
        />
        <el-table-column
            prop="birthdate"
            label="出生日期"
            min-width="140"
            align="center"
        />
        <el-table-column
            prop="contactPhone"
            label="联系电话"
            min-width="150"
            align="center"
        />
        <el-table-column
            prop="createdAt"
            label="建档日期"
            min-width="140"
            align="center"
        />
        <el-table-column
            label="操作"
            min-width="150"
            align="center"
            fixed="right"
        >
          <template #default="scope">
            <el-button
                type="primary"
                size="small"
                @click="handleEdit(scope.row)"
            >修改</el-button>
            <el-button
                type="danger"
                size="small"
                style="margin-left: 10px"
                plain
                :disabled="true"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <!-- 分页 -->
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
    <!-- 新增对话框 -->
    <el-dialog
        v-model="dialogVisible"
        :title="dialogTitle"
        width="600px"
    >
      <el-form :model="patients" :rules="rules" ref="form" label-width="100px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="patients.name" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="patients.gender">
            <el-option label="男" value="1" />
            <el-option label="女" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="出生日期" prop="birthdate">
          <el-date-picker
              v-model="patients.birthdate"
              type="date"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="联系电话" prop="contactPhone">
          <el-input v-model="patients.contactPhone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="isSubmitting" @click="submitForm">{{ isSubmitting ? '提交中...' : '提交' }}</el-button>
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


:deep(.el-pagination__jump) {
    display: none !important;
}

:deep(.even-row) {
  background-color: #fafafa;
}

:deep(.odd-row) {
  background-color: #fff;
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
</style>