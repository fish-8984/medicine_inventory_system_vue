<script setup>
import {onBeforeUnmount, onMounted, reactive, ref} from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus';
import { departmentAddService, departmentDeleteService, departmentGetService, departmentUpdateService } from "@/api/department.js";
import {staffFetchIdService, staffGetNameService} from "@/api/staff.js";
import {useTimerStore} from "@/stores/index.js";
const loading = ref(true)
const isSubmitting = ref(false)
const departmentsPageList = ref([])

const departments = ref({
  departmentId: null,
  name: "",
  location: "",
  managerId: 1
})

const departmentPage = ref({
    page: 1,
    pageSize: 10,
    name: ""
})
// 表格行样式
const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}
// 分页逻辑
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})
const handleSizeChange = (newSize) => {
  pagination.value.pageSize = newSize
  departmentPage.value.pageSize = newSize
  pagination.value.currentPage = 1 // 重置页码
  getDepartments()
}

const handleCurrentChange = (newPage) => {
  pagination.value.currentPage = newPage
  departmentPage.value.page = newPage
  getDepartments()
}
// 新增对话框显示状态
const dialogVisible = ref(false)
const dialogTitle = ref('新增部门')
const isEdit = ref(false)

const form = ref();
const rules = ref({
  name: [
    { required: true, message: '科室不能为空', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' },
  ],
  location: [
    { required: true, message: '科室位置不能为空', trigger: 'blur' },
    { min: 2, max: 10, message: '科室位置长度在 2 到 30 个字符', trigger: 'blur' },
  ],
  managerId: [
    { required: true, message: '负责人不能为空', trigger: 'blur' },
  ],
})


const managerName = ref('')


const managerIdCache = reactive(new Map()); // 缓存数据
const requestPromises = new Map();          // 缓存请求 Promise

const formatterManagerId = (row, column, cellValue) => {
  // 1. 如果已有缓存数据，直接返回
  if (managerIdCache.has(cellValue)) {
    return managerIdCache.get(cellValue);
  }

  // 2. 如果当前 ID 的请求正在进行，返回加载中
  if (requestPromises.has(cellValue)) {
    return '加载中...';
  }

  // 3. 发起请求并记录 Promise
  const promise = getManagerId(cellValue);
  requestPromises.set(cellValue, promise);

  // 4. 请求完成后清理 Promise 记录，并更新缓存
  promise.finally(() => {
    requestPromises.delete(cellValue);
  });

  return '加载中...';
};

const getManagerId = async (id) => {
  try {
    const res = await staffFetchIdService(id);
    const name = res.code === 1 ? res.data.name : '未知';
    managerIdCache.set(id, name); // 更新缓存
  } catch (error) {
    managerIdCache.set(id, '未知');
  }
};
const openAddDialog = () => {
  isEdit.value = false
  dialogTitle.value = '新增科室'
  managerName.value = ''
  departments.value = {
    departmentId: null,
    name: "",
    location: "",
    managerId: 1
  }      // 清空表单
  dialogVisible.value = true
}

const handleEdit = (row) => {
  console.log('编辑科室：', row);
  isEdit.value = true
  dialogTitle.value = '编辑科室'
  departments.value = { ...row } // 复制对象
  dialogVisible.value = true
}

const getDepartments = async () => {
  console.log('请求参数：', {
    ...departmentPage.value,
    page: pagination.value.currentPage,
    pageSize: pagination.value.pageSize,
  });
  loading.value = true
  try {
    const res = await departmentGetService(departmentPage.value);
    if (res.code === 1) {
      departmentsPageList.value = res.data.records;
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

const submitForm = async () => {
  console.log('提交表单', departments.value);
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
      console.log('执行更新操作', departments.value);
      await updatePatient();
    } else {
      console.log('执行新增操作', departments.value);
      await addPatient();
    }
    isSubmitting.value = false;
  } catch (error) {
    if (error.message !== '表单校验未通过') {
      ElMessage.error('操作失败，请重试');
      isSubmitting.value = false;
      console.error('操作失败:', error);
    }
  }
};

const addPatient = async () => {
  const resName = await staffGetNameService(managerName.value)
  if (resName.code === 1) {
    if (resName.data === null) {
      ElMessage.error("该员工不存在");
      return
    } else {
      departments.value.managerId = resName.data.staffId
    }
  }
  const res = await departmentAddService(departments.value);
  if (res.code === 1) {
    ElMessage.success("新增科室成功");
    dialogVisible.value = false;
    await getDepartments();
  } else {
    throw new Error(res.msg); // 抛出异常以便在 submitForm 中捕获
  }
};


const updatePatient = async () => {
  const resName = await staffGetNameService(managerName.value)
  if (resName.code === 1) {
    if (resName.data === null) {
      ElMessage.error("该员工不存在");
      return
    } else {
      departments.value.managerId = resName.data.staffId
    }
  }
  const res = await departmentUpdateService(departments.value);
  if (res.code === 1) {
    ElMessage.success("更新科室成功");
    dialogVisible.value = false;
    await getDepartments();
  } else {
    throw new Error(res.msg); // 抛出异常以便在 submitForm 中捕获
  }
};

const handleDelete = async (row) => {
  ElMessageBox.confirm(
      '该操作将永久删除该科室。继续？',
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
    const res = await departmentDeleteService(row.departmentId);
    if (res.code === 1) {
      ElMessage.success("删除成功");
      await getDepartments();
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
  getDepartments()
  timerStore.startTimer(getDepartments, 100000)
})

onBeforeUnmount(() => {
  timerStore.stopTimer()
})
</script>

<template>
  <div class="container">
    <el-card class="search-box">
      <el-form :inline="true" :model="departmentPage">
        <el-form-item label="科室名称">
          <el-input
              v-model="departmentPage.name"
              placeholder="请输入科室名称"
              clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getDepartments" :disabled="loading">查询</el-button>
          <el-button type="success" @click="openAddDialog">新增科室</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-box" v-loading="loading">
      <el-table
          :data="departmentsPageList"
          style="width: 100%"
          :row-class-name="tableRowClassName"
          stripe
          border
      >
        <el-table-column
            prop="name"
            label="科室名称"
            min-width="50"
            align="center"
        />
        <el-table-column
            prop="location"
            label="科室位置"
            min-width="130"
            align="center"
        />
        <el-table-column
            prop="managerId"
            label="负责人"
            min-width="50"
            align="center"
            :formatter="formatterManagerId"
        />
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
      <el-form :model="departments" :rules="rules" ref="form" label-width="100px">
        <el-form-item label="科室名称" prop="name">
          <el-input v-model="departments.name" />
        </el-form-item>
        <el-form-item label="科室位置" prop="location">
          <el-input v-model="departments.location" />
        </el-form-item>
        <el-form-item label="负责人" prop="managerId">
          <el-input :value="isEdit ? managerIdCache.get(departments.managerId) : managerName"
                    v-model="managerName"
          />
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