<script setup>
import {onBeforeUnmount, onMounted, reactive, ref} from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  purchaseOrdersPageService,
  purchaseOrdersCancelOrderService,
  purchaseOrdersUpdateService,
  purchaseOrdersAddService,
  purchaseOrdersGetService,
  purchaseOrdersUpdateStatusService
} from '@/api/purchaseOrders.js'
import { suppliersGetIdsService, suppliersGetService } from "@/api/suppliers.js";
import {staffFetchIdService, staffGetNameService} from "@/api/staff.js";
import {useTimerStore} from "@/stores/index.js";

// 加载状态
const loading = ref(true)
const isSubmitting = ref(false)

// 数据列表和表单数据
const purchaseOrdersList = ref([])
const suppliers = ref([]) // 供应商列表
const supplierMap = ref({}) // 供应商ID到名称的映射
const purchaseOrder = ref({
  poId: null,
  supplierId: null,
  orderDate: '',
  expectedDeliveryDate: '',
  totalAmount: 0,
  status: 'pending',
  createdBy: ''
})

// 搜索条件
const searchParams = ref({
  supplierKeyword: '', // 改为关键词搜索
  orderDate: '',
  expectedDeliveryDate: '',
  status: '',
  createdBy: ''
})

// 分页配置
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 对话框状态
const dialogVisible = ref(false)
const dialogTitle = ref('新增采购订单')
const isEdit = ref(false)

// 表单验证规则
const form = ref()
const rules = ref({
  supplierId: [{required: true, message: '请选择供应商', trigger: 'blur'}],
  orderDate: [{required: true, message: '请选择订单日期', trigger: 'change'}],
  expectedDeliveryDate: [{required: true, message: '请选择预计交付日期', trigger: 'change'}],
  totalAmount: [
    {required: true, message: '请输入总金额', trigger: 'blur'},
    {pattern: /^\d+(\.\d{1,2})?$/, message: '金额格式不正确'}
  ]
})

// 加载供应商列表（带搜索）
const loadSuppliers = async (name = '') => {
  try {
    const res = await suppliersGetService({
      page: 1,
      pageSize: 1000,
      name: name
    })
    suppliers.value = res.data?.records || []
    // 生成映射
    supplierMap.value = res.data.records.reduce((map, supplier) => {
      map[supplier.supplierId] = supplier.name
      return map
    }, {})
  } catch (e) {
    ElMessage.error('供应商加载失败')
  }
}

// 打开新增对话框
const openAddDialog = async () => {
  isEdit.value = false
  dialogTitle.value = '新增采购订单'
  purchaseOrder.value = {
    status: 'PENDING',
    orderDate: new Date().toISOString().split('T')[0]
  }
  await loadSuppliers()
  dialogVisible.value = true
}

// 编辑采购订单
const handleEdit = async (row) => {
  try {
    const res = await purchaseOrdersGetService(row.poId)
    if (res.code === 1) {
      isEdit.value = true
      dialogTitle.value = '编辑采购订单'
      purchaseOrder.value = res.data
      await loadSuppliers() // 加载供应商列表
      dialogVisible.value = true
    }
  } catch (e) {
    ElMessage.error('获取订单详情失败')
  }
}

// 提交表单
const submitForm = async () => {
  await form.value.validate(async (valid) => {
    if (!valid) return

    isSubmitting.value = true
    try {
      if (isEdit.value) {
        await purchaseOrdersUpdateService(purchaseOrder.value)
        ElMessage.success('更新成功')
      } else {
        await purchaseOrdersAddService(purchaseOrder.value)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      await getPurchaseOrders()
    } catch (e) {
      ElMessage.error(e.response?.data?.msg || '操作失败')
    } finally {
      isSubmitting.value = false
    }
  })
}

// 取消订单
const handleCancel = (row) => {
  ElMessageBox.confirm('确认要取消该采购订单吗？', '警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await purchaseOrdersCancelOrderService({poId: row.poId})
      ElMessage.success('订单已取消')
      await getPurchaseOrders()
    } catch (e) {
      ElMessage.error('取消失败')
    }
  })
}

// 获取采购订单列表
const getPurchaseOrders = async () => {
  loading.value = true;
  try {
    // 处理供应商关键词查询
    let supplierId = null;
    if (searchParams.value.supplierKeyword) {
      if (!isNaN(searchParams.value.supplierKeyword)) {
        supplierId = Number(searchParams.value.supplierKeyword);
      } else {
        const res = await suppliersGetService({
          name: searchParams.value.supplierKeyword,
          page: 1,
          pageSize: 1
        });
        supplierId = res.data?.records?.[0]?.supplierId;
      }
    }

    const name = searchParams.value.createdBy;
    if (name !== '') {
      const createdName = await staffGetNameService(name)
      if (createdName.code === 1) {
        searchParams.value.createdBy = createdName.data.staffId;
      } else {
        searchParams.value.createdBy = '';
      }
    }
    const params = {
      page: pagination.value.currentPage,
      pageSize: pagination.value.pageSize,
      ...searchParams.value,
      supplierId,
    };
    delete params.supplierKeyword;
    const res = await purchaseOrdersPageService(params);
    searchParams.value.createdBy = name;
    if (res.code === 1) {
      // 获取供应商名称
      const supplierIds = [...new Set(res.data.records.map(item => item.supplierId))];
      if (supplierIds.length > 0) {
        const suppliersRes = await suppliersGetIdsService(supplierIds.join(','));
        supplierMap.value = suppliersRes.data.reduce((map, supplier) => {
          map[supplier.supplierId] = supplier.name;
          return map;
        }, {});
      }

      // 预加载创建人名称
      const createdByIds = [...new Set(res.data.records.map(item => item.createdBy))];
      createdByIds.forEach(id => {
        if (!managerIdCache.has(id) && !requestPromises.has(id)) {
          const promise = getManagerId(id);
          requestPromises.set(id, promise);
          promise.finally(() => requestPromises.delete(id));
        }
      });

      purchaseOrdersList.value = res.data.records.map(item => ({
        ...item,
        supplierName: supplierMap.value[item.supplierId] || '未知供应商'
      }));
      pagination.value.total = res.data.total;
    }
  } catch (e) {
    ElMessage.error('加载失败');
  } finally {
    loading.value = false;
  }
};

// 分页事件处理
const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  getPurchaseOrders()
}

const handleCurrentChange = (page) => {
  pagination.value.currentPage = page
  getPurchaseOrders()
}

// 供应商搜索
const handleSupplierSearch = async (query) => {
  await loadSuppliers(query)
}


const managerIdCache = reactive(new Map()); // 缓存数据
const requestPromises = new Map();          // 缓存请求 Promise
const createdByName = (row, column, cellValue) => {
  // 直接返回缓存数据或加载状态
  if (managerIdCache.has(cellValue)) return managerIdCache.get(cellValue);
  if (requestPromises.has(cellValue)) return '加载中...';
  return '未知';
};

const getManagerId = async (id) => {
  try {
    const res = await staffFetchIdService(id);
    const name = res.code === 1 ? res.data.name : '未知';
    managerIdCache.set(id, name);
  } catch (error) {
    managerIdCache.set(id, '未知');
  }
};

const wanChen = async (row) => {
  const purchaseOrders = {
    poId: row.poId,
    status: "completed"
  }
  await purchaseOrdersUpdateStatusService(purchaseOrders)
  ElMessage.success('订单已完成')
  await getPurchaseOrders()
}

const timerStore = useTimerStore()

onMounted(() => {
  getPurchaseOrders()
  timerStore.startTimer(getPurchaseOrders, 100000)
})

onBeforeUnmount(() => {
  timerStore.stopTimer()
})
</script>

<template>
  <div class="container">
    <el-card class="search-box">
      <el-form :inline="true" :model="searchParams">
        <el-form-item label="供应商" style="width: 150px;">
          <el-input
              v-model="searchParams.supplierKeyword"
              placeholder="输入ID或名称"
              @keyup.enter="getPurchaseOrders"
          />
        </el-form-item>
        <!-- 其他搜索条件保持不变 -->
        <el-form-item label="下单日期" style="width: 170px;">
          <el-date-picker
              v-model="searchParams.orderDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="预计交付日" style="width: 170px;">
          <el-date-picker
              v-model="searchParams.expectedDeliveryDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="订单状态" style="width: 170px">
          <el-select v-model="searchParams.status" clearable>
            <el-option label="待处理" value="pending"/>
            <el-option label="已取消" value="cancelled"/>
            <el-option label="已接收" value="received"/>
            <el-option label="已完成" value="completed"/>
          </el-select>
        </el-form-item>
        <el-form-item label="创建人" style="width: 120px" >
          <el-input v-model="searchParams.createdBy" placeholder="创建人"/>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getPurchaseOrders">查询</el-button>
          <el-button type="success" @click="openAddDialog">新增订单</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-box" v-loading="loading">
      <el-table :data="purchaseOrdersList" border stripe>
        <el-table-column prop="poId" label="订单号" style="width: 170px"/>
        <el-table-column prop="supplierId" label="供应商ID" style="width: 160px"/>
        <el-table-column prop="supplierName" label="供应商名称" style="width: 180px"/>
        <el-table-column prop="orderDate" label="订单日期"/>
        <el-table-column prop="expectedDeliveryDate" label="预计交付日" style="width: 180px"/>
        <el-table-column prop="totalAmount" label="总金额" style="width: 180px">
          <template #default="{row}">¥{{ row.totalAmount.toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="createdBy" label="负责人"  :formatter="createdByName" style="width: 180px"/>
        <el-table-column prop="status" label="状态" style="width: 180px">
          <template #default="{row}">
            <el-tag :type="{
              pending: 'warning',
              received: 'primary',
              completed: 'success',
              cancelled: 'danger'
            }[row.status]">
              {{
                row.status === 'pending' ? '待处理'
                    : row.status === 'received' ? '已接收'
                        : row.status === 'completed' ? '已完成' : '已取消'
              }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="scope">
            <div class="action-buttons">
              <el-button
                  size="small"
                  v-if="scope.row.status !== 'received' && scope.row.status !=='completed'"
                  :disabled="scope.row.status === 'cancelled'"
                  style="width: 60px;margin-right: 8px"
                  @click="handleEdit(scope.row)">
                编辑
              </el-button>
              <el-button
                  size="small"
                  type="warning"
                  v-if="scope.row.status === 'received' || scope.row.status === 'completed'"
                  :disabled="scope.row.status === 'completed'"
                  style="width: 60px;margin-right: 8px"
                  @click="wanChen(scope.row)">
                {{ scope.row.status === 'completed' ? '已完成' : '完成' }}
              </el-button>
              <el-button
                  v-if="scope.row.status !== 'received'  && scope.row.status !=='completed'"
                  size="small"
                  type="danger"
                  style="width: 60px"
                  :disabled="scope.row.status === 'cancelled'"
                  @click="handleCancel(scope.row)">
                {{ scope.row.status === 'cancelled' ? '已取消' : '取消' }}
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
      />
    </div>

    <!-- 订单编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
      <el-form :model="purchaseOrder" :rules="rules" ref="form" label-width="120px">
        <el-form-item label="供应商" prop="supplierId">
          <el-select
              v-model="purchaseOrder.supplierId"
              filterable
              clearable
              placeholder="请选择供应商"
              @focus="handleSupplierSearch('')"
              @change="handleSupplierSearch"
          >
            <el-option
                v-for="supplier in suppliers"
                :key="supplier.supplierId"
                :label="supplier.name"
                :value="supplier.supplierId"
            />
          </el-select>
        </el-form-item>
        <!-- 其他表单项保持不变 -->
        <el-form-item label="订单日期" prop="orderDate">
          <el-date-picker
              v-model="purchaseOrder.orderDate"
              type="date"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="预计交付日期" prop="expectedDeliveryDate">
          <el-date-picker
              v-model="purchaseOrder.expectedDeliveryDate"
              type="date"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="总金额" prop="totalAmount">
          <el-input v-model.number="purchaseOrder.totalAmount">
            <template #append>¥</template>
          </el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm" :loading="isSubmitting">
          提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 样式保持不变 */
.container {
  padding: 20px;
}

.search-box {
  margin-bottom: 20px;
}

.table-box {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
}
</style>