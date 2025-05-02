<script setup>
import {onMounted, ref} from 'vue'
import router from "@/router/index.js";
import { useRoute } from 'vue-router'

const route = useRoute()  // 获取当前路由实例
const activeIndex = ref('')
const handleSelect = (index) => {
  activeIndex.value = index
  router.push({ name: index })
}
onMounted(() => {
  activeIndex.value = route.name
})
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header class="header-container">
        <el-menu
            :default-active="activeIndex"
            mode="horizontal"
            router
            @select="handleSelect"
        >
          <el-menu-item index="PrescriptionStatistics" route="{ name: 'PrescriptionStatistics' }">
            <span>系统详情</span>
          </el-menu-item>
          <el-menu-item index="Process" route="{ name: 'Process' }">
            <span>流程管理</span>
          </el-menu-item>
          <el-menu-item index="Forecast" route="{ name: 'Forecast' }">
            <span>库存预测</span>
          </el-menu-item>
          <el-menu-item index="PersonalCenter" route="{ name: 'PersonalCenter' }">
            <span>个人中心</span>
          </el-menu-item>
        </el-menu>
      </el-header>
      <el-main class="main-container">
        <div class="content-card">
          <router-view />
        </div>
      </el-main>
    </el-container>
  </div>
</template>

<style scoped>
.header-container {
  height: 48px;
  padding: 0;
}

.main-container {
  padding: 20px;
}

.content-card {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  min-height: calc(100vh - 100px);
  padding: 20px;
}
</style>