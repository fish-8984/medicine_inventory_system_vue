<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus';
import { staffAddService, staffDeleteService, staffFetchService, staffUpdateService } from "@/api/staff.js";
import {useTimerStore} from "@/stores/index.js";

const loading = ref(true)
// 分页列表
const staffPageList = ref([])
// 分页列表查询
const staffPage = ref({
  page: null,
  pageSize: null,
  name: "",
  title: "",
  department: "",
  isActive: null,
})

// 新增对话框显示状态
const dialogVisible = ref(false)
const dialogTitle = ref('新增患者')
const isEdit = ref(false)

const handleEdit = (row) => {
  console.log('编辑员工：', row);
  isEdit.value = true
  dialogTitle.value = '编辑员工'
  staff.value = { ...row } // 复制对象
  dialogVisible.value = true
}



const staff = ref({
  staffId: null,
  name: "",
  title: "",
  department: "",
  isActive: "",
  createdAt: "",
})

// 分页逻辑
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

const form = ref();
const rules = ref({
  name: [
    { required: true, message: '姓名不能为空', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' },
  ],
  title: [
    { required: true, message: '请选择职称', trigger: 'change' },
  ],
  department: [
    { required: true, message: '请选择所在科室', trigger: 'change' },
  ],
  isActive: [
    { required: true, message: '请选择在职状态', trigger: 'change' },
  ],
});

const isSubmitting = ref(false)

// 表格行样式
const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}

// 格式化在职状态
const formatIsActive = (row, column, value) => {
  return value === 0 ? '在职' : '离职'
}

const getStaff = async () => {
  console.log('请求参数：', {
    ...staffPage.value,
    page: pagination.value.currentPage,
    pageSize: pagination.value.pageSize,
  });
  loading.value = true
  try {
    const res = await staffFetchService(staffPage.value);
    if (res.code === 1) {
      staffPageList.value = res.data.records;
      pagination.value.total = res.data.total;
    } else {
      ElMessage.error(res.msg);
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
  staffPage.value.pageSize = newSize
  pagination.value.currentPage = 1 // 重置页码
  getStaff()
}

const handleCurrentChange = (newPage) => {
  pagination.value.currentPage = newPage
  staffPage.value.page = newPage
  getStaff()
}

const openAddDialog = () => {
  isEdit.value = false
  dialogTitle.value = '新增员工'
  staff.value = {
    staffId: null,
    name: "",
    title: "",
    department: "",
    isActive: null,
    createdAt: "",
  }      // 清空表单
  dialogVisible.value = true
}

const submitForm = async () => {
  console.log('提交表单', staff.value);
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
      console.log('执行更新操作', staff.value);
      await updatePatient();
    } else {
      console.log('执行新增操作', staff.value);
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
  const res = await staffAddService(staff.value);
  if (res.code === 1) {
    ElMessage.success("新增员工成功");
    await getStaff();
  } else {
    throw new Error(res.msg); // 抛出异常以便在 submitForm 中捕获
  }
};


const updatePatient = async () => {
  const res = await staffUpdateService(staff.value);
  if (res.code === 1) {
    ElMessage.success("更新员工成功");
    await getStaff();
  } else {
    throw new Error(res.msg); // 抛出异常以便在 submitForm 中捕获
  }
};

const handleDelete = async (row) => {
  ElMessageBox.confirm(
      '该操作将永久删除该员工。继续？',
      '警告',
      {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }
  )
      .then(() => {
        staffDelete(row);
      })
      .catch(() => {
        ElMessage({
          type: 'info',
          message: '删除已取消',
        });
      });
};

const staffDelete = async (row) => {
  console.log('删除', row);
  try {
    const res = await staffDeleteService(row.staffId);
    if (res.code === 1) {
      ElMessage.success("删除成功");
      await getStaff();
    } else {
      ElMessage.error(res.msg || '删除失败，请稍后重试');
    }
  } catch (e) {
    ElMessage.error('删除失败，请检查网络连接或稍后重试');
    console.error(e);
  }
};
const timerStore = useTimerStore()

onMounted(() => {
  getStaff()
  timerStore.startTimer(getStaff, 100000)
})

onBeforeUnmount(() => {
  timerStore.stopTimer()
})

</script>


<template>
<div class="container">
  <el-card class="search-box">
    <el-form :inline="true" :model="staffPage">
      <el-form-item label="姓名">
        <el-input
            v-model="staffPage.name"
            placeholder="请输入姓名"
            clearable
        />
      </el-form-item>
      <el-form-item label="职称">
        <el-input
            v-model="staffPage.title"
            placeholder="请输入职称"
            clearable
        />
      </el-form-item>
      <el-form-item label="在职状态">
        <el-select
            v-model="staffPage.isActive"
            placeholder="请选择"
            clearable
            style="width: 90px"
        >
          <el-option label="在职" value="0" />
          <el-option label="离职" value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="科室">
        <el-input
            v-model="staffPage.department"
            placeholder="选择科室"
            clearable
        />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="getStaff" :disabled="loading">查询</el-button>
        <el-button type="success" @click="openAddDialog">新增员工</el-button>
      </el-form-item>
    </el-form>
  </el-card>

  <el-card class="table-box" v-loading="loading">
    <el-table
        :data="staffPageList"
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
          prop="title"
          label="职称"
          min-width="140"
          align="center"
      />
      <el-table-column
          prop="department"
          label="科室"
          min-width="140"
          align="center"
      />
      <el-table-column
          prop="isActive"
          label="在职状态"
          min-width="140"
          align="center"
          :formatter="formatIsActive"
      />
      <el-table-column
          label="操作"
          width="200"
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
              @click="handleDelete(scope.row)"
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
    <el-form :model="staff" :rules="rules" ref="form" label-width="100px">
      <el-form-item label="姓名" prop="name">
        <el-input v-model="staff.name" />
      </el-form-item>
      <el-form-item label="在职状态" prop="isActive">
        <el-select v-model="staff.isActive">
          <el-option label="在职" :value="0" />
          <el-option label="离职" :value="1" />
        </el-select>
      </el-form-item>
      <el-form-item label="职称" prop="title">
        <el-input v-model="staff.title" />
      </el-form-item>
      <el-form-item label="科室" prop="department">
        <el-input v-model="staff.department" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="dialogVisible = false">取消</el-button>
      <el-button type="primary" :disabled="isSubmitting"  @click="submitForm">{{ isSubmitting ? '提交中...' : '提交' }}</el-button>
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