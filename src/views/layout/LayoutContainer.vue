<script setup>
import router from "@/router/index.js";
import { userLogoutService } from "@/api/user.js";
import { useUserStore } from "@/stores/index.js";
import { ElMessage } from "element-plus";
import {
  Box, SwitchButton, User, Document, FirstAidKit, Grid, House,
  List, Calendar, Histogram, DataAnalysis,
  Bell, ShoppingCart, Connection, SoldOut, Notebook,
  UserFilled, OfficeBuilding, DocumentChecked, Paperclip, Tickets
} from '@element-plus/icons-vue'
import {onMounted, reactive, ref} from 'vue';
import {useRoute} from "vue-router";
const route = useRoute()  // 获取当前路由实例
const activeIndex = ref('')

onMounted(() => {
  activeIndex.value = ROUTE_MAP[route.name]
})
useUserStore();
// 常量定义
const ROUTE_MAP = Object.freeze({
  home: { name: 'Home' },
  patient: { name: 'PatientManagement' },
  prescription: { name: 'PrescriptionManagement' },
  medication: { name: 'MedicationManagement' },
  ClassificationOfMedicine: { name: 'ClassificationOfMedicine' },
  PharmaceuticalBatches: { name: 'PharmaceuticalBatches' },
  inventory: { name: 'InventoryManagement' },
  Inventory: { name: 'Inventory' },
  stockAlerts: { name: 'StockAlerts' },
  supplier: { name: 'SupplierManagement' },
  PurchaseOrders: { name: 'PurchaseOrders' },
  PurchaseRecords: { name: 'PurchaseRecords' },
  employee: { name: 'EmployeeManagement' },
  RoleAssignments: { name: 'RoleAssignments' },
  department: { name: 'DepartmentManagement' },
  log: { name: 'LogInformation' }
});

// 响应式菜单配置
const menuItems = reactive([
  {
    index: 'home',
    icon: House,
    label: '首页',
    single: true
  },
  {
    index: 'patient',
    icon: User,
    label: '患者管理',
    single: true
  },
  {
    index: 'prescription',
    icon: Document,
    label: '处方管理',
    single: true
  },
  {
    index: 'medication',
    icon: FirstAidKit,
    label: '药品管理',
    children: [
      {
        index: 'medication',
        icon: List,
        label: '药品列表'
      },
      {
        index: 'ClassificationOfMedicine',
        icon: Grid,
        label: '药品分类'
      },
      {
        index: 'PharmaceuticalBatches',
        icon: Calendar,
        label: '批次管理'
      }
    ]
  },
  {
    index: 'inventory',
    icon: Box,
    label: '库存管理',
    children: [
      {
        index: 'inventory',
        icon: Histogram,
        label: '库存流水'
      },
      {
        index: 'Inventory',
        icon: DataAnalysis,
        label: '实时库存'
      },
      {
        index: 'stockAlerts',
        icon: Bell,
        label: '预警规则'
      }
    ]
  },
  {
    index: 'purchase',
    icon: ShoppingCart,
    label: '采购管理',
    children: [
      {
        index: 'supplier',
        icon: Connection,
        label: '供应商'
      },
      {
        index: 'PurchaseOrders',
        icon: SoldOut,
        label: '采购订单'
      },
      {
        index: 'PurchaseRecords',
        icon: Notebook,
        label: '采购记录'
      }
    ]
  },
  {
    index: 'employee',
    icon: UserFilled,
    label: '员工管理',
    children: [
      {
        index: 'employee',
        icon: Tickets,
        label: '员工列表'
      },
      {
        index: 'RoleAssignments',
        icon: Paperclip,
        label: '角色分配'
      }
    ]
  },
  {
    index: 'department',
    icon: OfficeBuilding,
    label: '部门管理',
    single: true
  },
  {
    index: 'log',
    icon: DocumentChecked,
    label: '日志信息',
    single: true
  }
]);

// 增强的退出逻辑
const logout = async () => {
  try {
    const res = await userLogoutService();
    if (res.code !== 1) {
      ElMessage.error(res.msg || '退出失败');
      return;
    }
    // 清除所有用户相关数据
    localStorage.clear();
    sessionStorage.clear();
    ElMessage.success('退出成功');

    // 确保跳转到登录页
    try {
      await router.push({ name: 'login' });
      window.location.reload(); // 强制刷新页面确保状态完全重置
    } catch (routerError) {
      console.error('路由跳转失败:', routerError);
      window.location.href = '/login'; // 备用方案直接修改URL
    }
  } catch (error) {
    ElMessage.error('退出异常，请重试');
    console.error('注销错误:', error);
  }
}

const jump = async (index) => {
  activeIndex.value = ROUTE_MAP[index];
  if (activeIndex.value) {
    try {
      await router.push(activeIndex.value);
    } catch (error) {
      console.error('导航错误:', error);
      ElMessage.error('导航失败');
    }
  }
}
</script>

<template>
  <div class="common-layout">
    <el-container>
      <el-header class="header">
        <div class="header-content">
          <div class="system-title">
            <el-icon class="header-icon"><Box /></el-icon>
            智能库存管理系统
          </div>
          <el-button type="primary" class="logout-btn" @click="logout" round>
            <el-icon class="icon"><SwitchButton /></el-icon>
            退出系统
          </el-button>
        </div>
      </el-header>
      <el-container>
        <el-aside width="190px" class="aside">
          <el-menu
              active-text-color="#409EFF"
              background-color="#f8fafc"
              class="side-menu"
              default-active="1"
          >
            <template v-for="item in menuItems" :key="item.index">
              <el-menu-item
                  v-if="item.single"
                  :index="item.index"
                  @click="() => jump(item.index)"
              >
                <el-icon><component :is="item.icon" /></el-icon>
                <span>{{ item.label }}</span>
              </el-menu-item>

              <el-sub-menu
                  v-else
                  :index="item.index"
              >
                <template #title>
                  <el-icon><component :is="item.icon" /></el-icon>
                  <span>{{ item.label }}</span>
                </template>
                <el-menu-item
                    v-for="child in item.children"
                    :key="child.index"
                    :index="child.index"
                    @click="() => jump(child.index)"
                >
                  <el-icon><component :is="child.icon" /></el-icon>
                  {{ child.label }}
                </el-menu-item>
              </el-sub-menu>
            </template>
          </el-menu>
        </el-aside>

        <el-main class="main">
          <div class="content-card">
            <router-view></router-view>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<style lang="scss">
html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  margin: 0;
  padding: 0;
}

.common-layout {
  overflow: visible;
  height: 100%;
  background: #f0f2f5;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

.header {
  height: 64px;
  background: linear-gradient(145deg, #409EFF, #337ecc);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;

  .header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 100%;
    padding: 0 24px;

    .system-title {
      color: white;
      font-size: 20px;
      font-weight: 600;
      display: flex;
      align-items: center;

      .header-icon {
        margin-right: 12px;
        font-size: 24px;
      }
    }

    .logout-btn {
      padding: 8px 16px;
      font-weight: 500;
      .icon {
        margin-right: 8px;
      }
    }
  }
}

.aside {
  background: #f8fafc;
  border-right: 1px solid #e4e7ed;
  width: 190px !important;
  overflow-y: auto;
  height: calc(100vh - 64px);
  transition: width 0.3s;

  .side-menu {
    border-right: none;

    :deep(.el-menu-item),
    :deep(.el-sub-menu__title) {
      height: 48px;
      line-height: 48px;
      margin: 4px 0;
      transition: all 0.3s;

      &:hover {
        background-color: rgba(64, 158, 255, 0.1);
      }
    }
  }

  @media (max-width: 768px) {
    width: 64px !important;

    .menu-text {
      display: none;
    }

    :deep(.el-sub-menu__title) {
      padding-left: 20px !important;
    }
  }
}

.main {
  flex: 1;
  overflow-y: auto;
  padding: 16px;

  .content-card {
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    min-height: 100%;
    padding: 16px;
    background: white;
  }
}
</style>