<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {userAddService, userGetListService, userUpdateStatusService} from '@/api/user'
import {roleGetListService} from '@/api/role'

const userRolePageList = ref([]);
const userRolePage = ref({
  page: null,
  pageSize: null,
})
const userRole = ref(
    {
      userId: null,
      username: "",
      passwordHash: "",
      roleId: null,
      department: "",
      lastLogin: "",
      createdAt: "",
      departmentId: null,
      status: null
    }
)
const role = ref(
    {
      roleId: null,
      name: "",
      permissions: "",
      description: ""
    }
)
// 分页逻辑
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})
const handleSizeChange = (newSize) => {
  pagination.value.pageSize = newSize
  userRolePage.value.pageSize = newSize
  pagination.value.currentPage = 1 // 重置页码
  getUserRoleList()
}

const handleCurrentChange = (newPage) => {
  pagination.value.currentPage = newPage
  userRolePage.value.page = newPage
  getUserRoleList()
}
const getUserRoleList = async () => {
  try {
    const res = await userGetListService(userRolePage.value)
    userRolePageList.value = res.data.records
    pagination.value.total = res.data.total;
  }
  catch (e) {
    ElMessage.error('获取用户角色列表失败，请稍后重试')
    console.error(e)
  }
}
const loading = ref(false)
const handleEdit = (row) => {
  userUpdateStatusService(row.status === 1 ? 0 : 1, row.userId)
    .then(() => {
      ElMessage.success('用户状态更新成功')
      getUserRoleList()
    })
    .catch((error) => {
      ElMessage.error('用户状态更新失败')
      console.error(error)
    })
}
const roleList = ref([])
const formatRoleName = (row, column, cellValue) => {
  console.log(roleList.value)
  for (let i = 0; i < roleList.value.length; i++) {
    if (roleList.value[i].roleId === cellValue) {
      return roleList.value[i].description
    }
  }
}
const dialogVisible = ref(false)
const dialogTitle = ref('设置员工角色')

const openAddDialog = () => {
  dialogVisible.value = true
}

const getRoleList = async () => {
  try {
    const roles = await roleGetListService()
    roleList.value = roles.data
  }
  catch (e) {
    console.error(e)
  }
}
const isSubmitting = ref(false)
const form = ref();
const rules = ref({
  roleId: [
    { required: true, message: '请选择角色', trigger: 'change' },
  ],
  department: [
    { required: true, message: '请选择科室', trigger: 'change' },
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 10, message: '用户名长度在 2 到 10 个字符', trigger: 'blur' },
  ],
})
const handleSubmit = async () => {
  console.log('提交表单', userRole.value);
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
    const res = await userAddService(userRole.value)
    if (res.code === 1) {
      ElMessage.success("保存成功");
      dialogVisible.value = false
      await getUserRoleList()
    }
  }
  catch (e) {
    console.error(e)
  }
}
  onMounted(() => {
    getUserRoleList()
    getRoleList()
  })
  const tableRowClassName = ({rowIndex}) => {
    return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
  }
</script>

<template>
  <div class="container">
    <el-card class="search-box">
      <el-form :inline="true" :model="userRolePage">
        <el-form-item>
          <el-button type="success" @click="openAddDialog">设置员工角色</el-button>
        </el-form-item>
      </el-form>
    </el-card>


    <el-card class="table-box" v-loading="loading">
      <el-table
          :data="userRolePageList"
          style="width: 100%"
          :row-class-name="tableRowClassName"
          stripe
          border
      >
        <el-table-column
            prop="username"
            label="用户名"
            min-width="120"
            align="center"
        />
        <el-table-column
            prop="roleId"
            label="角色"
            min-width="140"
            align="center"
            :formatter="formatRoleName"
        />
        <el-table-column
            prop="department"
            label="科室"
            min-width="140"
            align="center"
        />
        <el-table-column
            prop="lastLogin"
            label="最后登录时间"
            min-width="140"
            align="center"
        />
        <el-table-column
            prop="createdAt"
            label="创建时间"
            min-width="140"
            align="center"
        />
        <el-table-column
            label="操作"
            width="200"
            align="center"
            fixed="right"
        >
          <template #default="scope">
            <el-button
                :type="scope.row.status === 1 ? 'success' : 'danger'"
                size="small"
                @click="handleEdit(scope.row)"
            >
              {{ scope.row.status === 1 ? '启用' : '禁用' }}
            </el-button>
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
      <el-form :model="userRole" ref="form" label-width="100px" :rules="rules">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userRole.username" />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select v-model="userRole.roleId">
            <el-option v-for="item in roleList" :key="item.roleId" :label="item.description" :value="item.roleId" />
          </el-select>
        </el-form-item>
        <el-form-item label="科室" prop="department">
          <el-input v-model="userRole.department" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">保存</el-button>
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