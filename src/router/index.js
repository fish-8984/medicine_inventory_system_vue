import { createRouter, createWebHistory } from 'vue-router';
import {useUserStore} from "@/stores/index.js";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/Login/index.vue')
    },
    {
      path: '/',
      name: 'layout',
      component: () => import('@/views/layout/LayoutContainer.vue'),
      redirect: {name: 'Home'},
      children: [
        { path: 'home',
          name: 'Home',
          component: () => import('@/views/Home/index.vue'),
          redirect: {name: 'PrescriptionStatistics'},
          children: [
            {
              path: 'PrescriptionStatistics',
              name: 'PrescriptionStatistics',
              component: () => import('@/views/Home/PrescriptionStatistics.vue')
            },
            { path: 'process',
              name: 'Process',
              component: () => import('@/views/Home/process.vue')
            },
            {
              path: 'Forecast',
              name: 'Forecast',
              component: () => import('@/views/Home/Forecast.vue')
            },
            {
              path: 'PersonalCenter',
              name: 'PersonalCenter',
              component: () => import('@/views/Home/PersonalCenter.vue')
            }
          ]
        },
        { path: 'prescription-management',
          name: 'PrescriptionManagement',
          component: () => import('@/views/PrescriptionManagement/index.vue')
        },
        { path: 'patient-management',
          name: 'PatientManagement',
          component: () => import('@/views/PatientManagement/index.vue')
        },
        { path: 'medication-management',
          name: 'MedicationManagement',
          component: () => import('@/views/MedicationManagement/index.vue'),
        },
        {
          path: 'classification-of-medicine',
          name: 'ClassificationOfMedicine',
          component: () => import('@/views/MedicationManagement/ClassificationOfMedicine/index.vue')
        },
        {
          path: 'pharmaceutical-batches',
          name: 'PharmaceuticalBatches',
          component: () => import('@/views/MedicationManagement/PharmaceuticalBatches/index.vue')
        },
        { path: 'inventory-management',
          name: 'InventoryManagement',
          component: () => import('@/views/InventoryManagement/index.vue')
        },
        {
          path: 'inventory',
          name: 'Inventory',
          component: () => import('@/views/InventoryManagement/Inventory/index.vue')
        },
        {
          path: 'stock-alerts',
          name: 'StockAlerts',
          component: () => import('@/views/InventoryManagement/stockAlerts/index.vue')
        },
        { path: 'supplier-management',
          name: 'SupplierManagement',
          component: () => import('@/views/SupplierManagement/index.vue')
        },
        {
          path: 'purchase-orders',
          name: 'PurchaseOrders',
          component: () => import('@/views/ProcurementManagement/PurchaseOrders.vue')
        },
        {
          path: 'purchase-records',
          name: 'PurchaseRecords',
          component: () => import('@/views/ProcurementManagement/PurchaseRecords.vue')
        },
        { path: 'employee-management',
          name: 'EmployeeManagement',
          component: () => import('@/views/EmployeeManagement/index.vue')
        },
        { path: 'department-management',
          name: 'DepartmentManagement',
          component: () => import('@/views/DepartmentManagement/index.vue')
        },
        { path: 'role-assignments',
          name: 'RoleAssignments',
          component: () => import('@/views/EmployeeManagement/RoleAssignments.vue')
        },
        { path: 'log-information',
          name: 'LogInformation',
          component: () => import('@/views/LogInformation/index.vue')
        },
      ]
    }
  ]
});


// 添加全局前置守卫
router.beforeEach((to, from) => {
  const userStore = useUserStore();
  const isAuthenticated = userStore.token === localStorage.getItem('token') || userStore.token !== "";

  // 已登录时访问登录页，重定向到首页或目标页
  if (to.name === 'login' && isAuthenticated) {
    const redirectPath = to.query.redirect?.toString() || '/';
    // 避免重定向到当前路径
    if (redirectPath === from.path) {
      return false; // 或 return true 根据需求选择
    }
    return redirectPath;
  }

  // 未登录且访问需认证页面
  if (!isAuthenticated && to.name !== 'login') {
    // 避免重复跳转登录页
    if (from.name === 'login') {
      return false;
    }
    return {
      name: 'login',
      query: { redirect: to.fullPath }
    };
  }

  return true;
});
export default router;