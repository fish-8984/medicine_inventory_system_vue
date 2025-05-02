<template>
  <div class="login-container">
    <el-form ref="form" :rules="rules" :model="loginForm" label-width="100px" class="login-form">
      <h2>智能药库管理系统</h2>
      <el-form-item label="用户名" prop="username">
        <el-input type="text" v-model="loginForm.username" placeholder="请输入用户名"></el-input>
      </el-form-item>
      <el-form-item label="密码" prop="password">
        <el-input type="password" v-model="loginForm.password" placeholder="请输入密码"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="login" :loading="loading" class="login-button"> {{ loading ? '登录中...' : '登录' }}</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { userLoginService } from '@/api/user.js';
import { useUserStore } from '@/stores/index.js';
import { ElMessage } from 'element-plus';
import { ref } from 'vue';
import router from "@/router/index.js";
const form = ref();
const loading = ref(false);
const loginForm = ref({
      username: '',
      password: ''
});
const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 1, max: 12, message: '长度在 1 到 12 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
  ]
};

const userStores = useUserStore();

const login = async () => {
  try {
    // 防止重复提交
    if (loading.value) return;
    loading.value = true;

    // 表单验证
    await form.value.validate();

    // 调用登录接口
    const res = await userLoginService(loginForm.value);
    console.log(loginForm.value)
    if (res.code !== 1) {
      ElMessage.error(res.msg);
      return;
    }
    // 存储 token
    const token = res.data;
    console.log(token);
    localStorage.setItem('token', token);
    userStores.setToken(token);

    userStores.setName(loginForm.value.username);
    ElMessage.success('登录成功');
    // 导航到主页
    await router.push({name: 'Home'});

  } catch (error) {
    // 统一错误处理
    ElMessage.error(`登录失败`);
    console.error('Login error:', error);

  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  width: 450px;
  margin: 100px auto;
  padding: 30px;
  background-color: #f5f5f5;
  border-radius: 10px;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
  color: #333;
}

.login-form {
  padding: 20px;
  background-color: #fff;
  border-radius: 10px;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #2d8cf0;
}

.login-button {
  width: 100%;
  background-color: #2d8cf0;
  border-color: #2d8cf0;
  transition: background-color 0.3s, border-color 0.3s;
}

.login-button:hover {
  background-color: #1a73e8;
  border-color: #1a73e8;
}
</style>