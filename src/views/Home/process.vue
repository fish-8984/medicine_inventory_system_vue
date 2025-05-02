<template>
  <div class="home-container">
    <!-- 双栏布局 -->
    <el-row :gutter="40" class="process-container">
      <!-- 采购管理流程 -->
      <el-col :md="12" class="process-column">
        <h2 class="process-title">采购管理流程</h2>
        <div class="process-steps">
          <div v-for="(step, index) in purchaseSteps"
               :key="step"
               class="process-step">
            <div class="step-card">
              {{ step }}
            </div>
            <el-icon v-if="index < purchaseSteps.length-1"
                     class="step-arrow">
              <ArrowDown />
            </el-icon>
          </div>
        </div>
      </el-col>

      <!-- 处方管理流程 -->
      <el-col :md="12" class="process-column">
        <h2 class="process-title">处方管理流程</h2>
        <div class="process-steps">
          <div v-for="(step, index) in prescriptionSteps"
               :key="step"
               class="process-step">
            <div class="step-card">
              {{ step }}
            </div>
            <el-icon v-if="index < prescriptionSteps.length-1"
                     class="step-arrow">
              <ArrowDown />
            </el-icon>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

const purchaseSteps = ref(['采购订单', '批次管理', '采购记录'])
const prescriptionSteps = ref(['处方管理', '开处方', '开药'])
</script>

<style scoped>
.home-container {
  padding: 30px;
  background-color: #f0f2f5;
  min-height: 100vh;
}

.process-container {
  max-width: 1200px;
  margin: 0 auto;
}

.process-column {
  background: #2d3a4b;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.process-title {
  color: #fff;
  text-align: center;
  margin-bottom: 30px;
}

.process-steps {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.step-card {
  background: #fff;
  padding: 20px 40px;
  border-radius: 6px;
  font-weight: bold;
  color: #2d3a4b;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.3s;
}

.step-card:hover {
  transform: translateY(-3px);
}

.step-arrow {
  color: #fff;
  font-size: 24px;
  margin: 10px 0;
}

/* 网格背景 */
.process-column {
  background-image:
      linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .process-column {
    margin-bottom: 30px;
  }
}
</style>