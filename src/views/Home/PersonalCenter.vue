<script setup>
import {ref, onMounted, reactive} from 'vue'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import {userGetByNameService, userUpdatePasswordService, userUpdateService} from "@/api/user.js";
import {useUserStore} from "@/stores/index.js";
import {roleGetByIdService} from "@/api/role.js";
import {departmentGetAllNameService} from "@/api/department.js";
import router from "@/router/index.js";

const initialData = ref({
  userId: null,
  username: "",
  passwordHash: "",
  roleId: null,
  department: "",
  lastLogin: "",
  createdAt: "",
  departmentId: null,
  status: null
})

const isEditMode = ref(false)
const avatarUrl = ref('https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png')

// 部门选项
const departments = ref([])

const getDepartmentsName = async () => {
  try {
    const res = await departmentGetAllNameService()
    if (res.code === 1) {
      departments.value = res.data
    }
  }
  catch (error) {
    console.log(error)
  }
}


const roleName = ref("")

// 时间格式化
const formatDate = (dateString) => {
  return dayjs(dateString).format('YYYY-MM-DD HH:mm:ss')
}
const userStores = useUserStore();
const getUserInfo = async () => {
  try {
    const res = await userGetByNameService(userStores.getName())
    if (res.code === 1) {
      initialData.value = res.data
      await getRoleName(initialData.value.roleId);
    }
  }
  catch (error) {
    console.log(error)
  }
}


// 获取角色名称
const getRoleName = async (roleId) => {
  try {
    if (!roleId) {
      roleName.value = '无角色';
      return;
    }
    const res = await roleGetByIdService(roleId);
    if (res.code === 1) {
      roleName.value = res.data.description; // 更新响应式变量
    } else {
      roleName.value = '未知角色';
    }
  } catch (error) {
    console.error('获取角色失败:', error);
    roleName.value = '加载失败';
  }
};
const departmentName = ref('')

// 切换编辑模式
const toggleEditMode = () => {
  isEditMode.value = !isEditMode.value
  if (isEditMode.value) {
    getDepartmentsName()
    departmentName.value = initialData.value.department
  }
  if (!isEditMode.value) {
    initialData.value.department = departmentName.value
  }
}

// 保存修改
const handleSave = async () => {
  try {
    await userUpdateService(initialData.value).then(res => {
      if (res.code === 1) {
        ElMessage.success('信息更新成功')
      }
    })
    isEditMode.value = false
  } catch (error) {
    ElMessage.error('保存失败，请稍后重试')
  }
}

// 密码修改相关逻辑
const dialogVisible = ref(false)
const form = ref()
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// 验证规则
const validateConfirm = (rule, value, callback) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的新密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [
    { required: true, message: '请输入旧密码', trigger: 'change' },
    { min: 6, message: '密码长度至少6位', trigger: 'change' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/,
      message: '需包含字母和数字组合' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' }
  ]
}
const isSubmitting = ref(false)
// 提交修改
const handleSubmit = async () => {
  try {
    if (isSubmitting.value) return;
    isSubmitting.value = true;

    await new Promise((resolve, reject) => {
      form.value.validate((valid) => {
        if (!valid) {
          ElMessage.error("表单不完整");
          reject(new Error('表单校验未通过'));
          isSubmitting.value = false;
        } else {
          resolve();
        }
      });
    });

    const passwordResForm = {
      users: {
        userId: initialData.value.userId,
        username: initialData.value.username,
        passwordHash: passwordForm.newPassword,
        roleId: initialData.value.roleId,
        department: initialData.value.department,
        lastLogin: initialData.value.lastLogin,
        createdAt: initialData.value.createdAt,
        departmentId: initialData.value.departmentId,
        status: initialData.value.status,
      },
      oldPassword: passwordForm.oldPassword
    }

    await userUpdatePasswordService(passwordResForm);
    dialogVisible.value = false;
    ElMessage.success('密码修改成功，请重新登录');

    // 清除所有用户相关数据
    localStorage.clear();
    sessionStorage.clear();

    // 增强的跳转逻辑
    try {
      await router.push({ name: 'login' });
      window.location.reload(); // 强制刷新确保状态重置
    } catch (routerError) {
      console.error('路由跳转失败:', routerError);
      window.location.href = '/login'; // 备用跳转方案
    }
  } catch (error) {
    isSubmitting.value = false;
    if (error?.fields) {
      ElMessage.warning('请检查表单填写');
    } else {
      ElMessage.error(error.message || '密码修改失败');
    }
  }
}

// 关闭弹窗重置表单
const handleClose = () => {
  form.value.resetFields()
}

const showPasswordDialog = () => {
  dialogVisible.value = true
}
// 初始化数据
onMounted(() => {
  getUserInfo()
})

</script>
<template>
  <div class="personal-center">
    <el-card class="box-card">
      <!-- 头部 -->
      <div class="card-header">
        <div class="avatar-section">
          <el-avatar :size="80" :src="avatarUrl" />
          <div class="user-info">
            <h2>{{ initialData.username }}</h2>
            <el-tag :type="initialData.status === 0 ? 'success' : 'danger'">
              {{ initialData.status === 0 ? '正常' : '已禁用' }}
            </el-tag>
          </div>
        </div>
        <div>
          <el-button
              type="primary"
              @click="toggleEditMode"
              v-text="isEditMode ? '取消编辑' : '编辑资料'"
          />
          <el-button type="primary" @click="showPasswordDialog">修改密码</el-button>
        </div>
      </div>

      <!-- 表单区域 -->
      <el-form
          :model="initialData"
          label-width="100px"
          :disabled="!isEditMode"
      >
        <el-row :gutter="20">
          <!-- 左列 -->
          <el-col :span="12">
            <el-form-item label="用户ID">
              <el-input v-model="initialData.userId" disabled />
            </el-form-item>

            <el-form-item label="用户名" prop="username">
              <el-input v-model="initialData.username" disabled />
            </el-form-item>

            <el-form-item label="所属部门">
              <el-select
                  v-model="initialData.department"
                  placeholder="请选择部门"
              >
                <el-option
                    v-for="dept in departments"
                    :key="dept"
                    :label="dept"
                    :value="dept"
                />
              </el-select>
            </el-form-item>
          </el-col>

          <!-- 右列 -->
          <el-col :span="12">
            <el-form-item label="创建时间">
              <el-input
                  :value="formatDate(initialData.createdAt)"
                  disabled
              />
            </el-form-item>

            <el-form-item label="最后登录">
              <el-input
                  :value="formatDate(initialData.lastLogin)"
                  disabled
              />
            </el-form-item>

            <el-form-item label="角色">
              <el-input :value="roleName" disabled />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 操作按钮 -->
        <div class="form-actions" v-if="isEditMode">
          <el-button type="primary" @click="handleSave">保存修改</el-button>
          <el-button @click="toggleEditMode">取消</el-button>
        </div>
      </el-form>
    </el-card>
  </div>

  <el-dialog
      v-model="dialogVisible"
      title="修改密码"
      width="30%"
      @closed="handleClose"
  >
    <el-form
        :model="passwordForm"
        :rules="passwordRules"
        ref="form"
        label-width="120px"
    >
      <el-form-item label="旧密码" prop="oldPassword">
        <el-input
            v-model="passwordForm.oldPassword"
            type="password"
            show-password
            placeholder="请输入当前密码"
        />
      </el-form-item>

      <el-form-item label="新密码" prop="newPassword">
        <el-input
            v-model="passwordForm.newPassword"
            type="password"
            show-password
            placeholder="请输入新密码"
        />
      </el-form-item>

      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            show-password
            placeholder="请再次输入新密码"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确 定</el-button>
      </span>
    </template>
  </el-dialog>
</template>
<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

:deep(.el-dialog__body) {
  padding: 20px 20px 10px;
}
.personal-center {
  max-width: 1000px;
  margin: 20px auto;
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.avatar-section {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-actions {
  margin-top: 30px;
  text-align: center;
}

</style>