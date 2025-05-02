<script setup>
import {onBeforeUnmount, onMounted, ref} from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus';
import { suppliersGetService, suppliersAddService, suppliersDeleteService, suppliersGetIdService, suppliersUpdateService} from "@/api/suppliers.js";
import {useTimerStore} from "@/stores/index.js";

const loading = ref(true)
const isSubmitting = ref(false)

const suppliersPageList = ref([])
const suppliers = ref({
  supplierId: null,
  name: "",
  contactPerson: "",
  phone: "",
  address: "",
  contractEndDate: ""
})
const suppliersPage = ref({
  page: null,
  pageSize: null,
  name: "",
  phone: "",
  contractEndDate: ""
})
// 分页逻辑
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 新增对话框显示状态
const dialogVisible = ref(false)
const dialogTitle = ref('新增供应商')
const isEdit = ref(false)

const form = ref();
const rules = ref({
  name: [
    { required: true, message: '姓名不能为空', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' },
  ],
  contactPerson: [
    { required: true, message: '联系人不能为空', trigger: 'blur' },
    { min: 2, max: 10, message: '联系人长度在 2 到 10 个字符', trigger: 'blur' },
  ],
  phone: [
    { required: true, message: '手机号不能为空', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', trigger: 'blur' },
  ],
  address: [
    { required: true, message: '地址不能为空', trigger: 'blur' },
  ],
  contractEndDate: [
    { required: true, message: '合同截止日期不能为空', trigger: 'blur' },
  ]
})

const openAddDialog = () => {
  isEdit.value = false
  dialogTitle.value = '新增供应商'
  suppliers.value = {
    supplierId: null,
    name: "",
    contactPerson: "",
    phone: "",
    address: "",
    contractEndDate: ""
  }      // 清空表单
  dialogVisible.value = true
}

const handleEdit = (row) => {
  console.log('编辑供应商：', row);
  isEdit.value = true
  dialogTitle.value = '编辑供应商'
  suppliers.value = { ...row } // 复制对象
  dialogVisible.value = true
}
// 表格行样式
const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}
const handleSizeChange = (newSize) => {
  pagination.value.pageSize = newSize
  suppliersPage.value.pageSize = newSize
  pagination.value.currentPage = 1 // 重置页码
  getSuppliers()
}

const handleCurrentChange = (newPage) => {
  pagination.value.currentPage = newPage
  suppliersPage.value.page = newPage
  getSuppliers()
}

const getSuppliers = async () => {
  console.log('请求参数：', {
    ...suppliersPage.value,
    page: pagination.value.currentPage,
    pageSize: pagination.value.pageSize,
  });
  loading.value = true
  try {
    const res = await suppliersGetService(suppliersPage.value);
    if (res.code === 1) {
      suppliersPageList.value = res.data.records;
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
  console.log('提交表单', suppliers.value);
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
      console.log('执行更新操作', suppliers.value);
      await updatePatient();
    } else {
      console.log('执行新增操作', suppliers.value);
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
  const res = await suppliersAddService(suppliers.value);
  if (res.code === 1) {
    ElMessage.success("新增供应商成功");
    await getSuppliers();
  } else {
    throw new Error(res.msg); // 抛出异常以便在 submitForm 中捕获
  }
};


const updatePatient = async () => {
  const res = await suppliersUpdateService(suppliers.value);
  if (res.code === 1) {
    ElMessage.success("更新供应商成功");
    await getSuppliers();
  } else {
    throw new Error(res.msg); // 抛出异常以便在 submitForm 中捕获
  }
};

const handleDelete = async (row) => {
  ElMessageBox.confirm(
      '该操作将永久删除该供应商。继续？',
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
    const res = await suppliersDeleteService(row.supplierId);
    if (res.code === 1) {
      ElMessage.success("删除成功");
      await getSuppliers();
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
  getSuppliers()
  timerStore.startTimer(getSuppliers, 100000)
})

onBeforeUnmount(() => {
  timerStore.stopTimer()
})

</script>
<template>
  <div class="container">
    <el-card class="search-box">
      <el-form :inline="true" :model="suppliersPage">
        <el-form-item label="供应商名称">
          <el-input
              v-model="suppliersPage.name"
              placeholder="请输入供应商名称"
              clearable
          />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input
              v-model="suppliersPage.phone"
              placeholder="请输入电话"
              clearable
          />
        </el-form-item>
        <el-form-item label="合同到期日">
          <el-date-picker
              v-model="suppliersPage.contractEndDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
              />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getSuppliers" :disabled="loading">查询</el-button>
          <el-button type="success" @click="openAddDialog">新增员工</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-box" v-loading="loading">
      <el-table
          :data="suppliersPageList"
          min-width="100%"
          :row-class-name="tableRowClassName"
          stripe
          border
      >
        <el-table-column
            prop="name"
            label="供应商名称"
            min-width="140"
            align="center"
        />
        <el-table-column
            prop="contactPerson"
            label="联系人"
            min-width="40"
            align="center"
        />
        <el-table-column
            prop="phone"
            label="联系电话"
            min-width="50"
            align="center"
        />
        <el-table-column
            prop="address"
            label="地址"
            min-width="150"
            align="center"
        />
        <el-table-column
            prop="contractEndDate"
            label="合同到期日"
            min-width="60"
            align="center"
        />
        <el-table-column
            label="操作"
            min-width="60"
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
      <el-form :model="suppliers" :rules="rules" ref="form" label-width="100px">
        <el-form-item label="供应商名称" prop="name">
          <el-input v-model="suppliers.name" />
        </el-form-item>
        <el-form-item label="联系人" prop="contactPerson">
          <el-input v-model="suppliers.contactPerson" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="suppliers.phone" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="suppliers.address"/>
        </el-form-item>
        <el-form-item label="合同到期日" prop="contractEndDate">
          <el-date-picker
              v-model="suppliers.contractEndDate"
              type="date"
              value-format="YYYY-MM-DD"
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