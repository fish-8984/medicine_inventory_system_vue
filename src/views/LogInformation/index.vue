<script setup>
import {ref, onMounted, reactive} from 'vue'
import { ElMessage } from 'element-plus'
import { logGetPageService } from '@/api/log.js'
import VueJsonPretty from 'vue-json-pretty'
import 'vue-json-pretty/lib/styles.css'
import { staffFetchIdService } from "@/api/staff.js";

// 数据列表
const logPageList = ref([])
const total = ref(0)
const loading = ref(false)
const detailDialogVisible = ref(false)
const currentDetail = ref('')

// 查询参数
const logPage = ref({
  page: 1,
  pageSize: 10,
  userId: null,
  action: '',
  actionDate: ''
})

// 操作类型选项
const actionOptions = [
  { label: '全部', value: '' },
  { label: '新增', value: 'insert' },
  { label: '修改', value: 'update' },
  { label: '删除', value: 'delete' }
]

// 加载数据
const loadData = async () => {
  try {
    loading.value = true
    const res = await logGetPageService({
      ...logPage.value,
      actionDate: logPage.value.actionDate || undefined
    })
    logPageList.value = res.data.records
    console.log(res.data.records)
    total.value = res.data.total
  } catch (e) {
    ElMessage.error('数据加载失败')
  } finally {
    loading.value = false
  }
}

// 显示详情弹窗
const showDetail = (row) => {
  try {
    currentDetail.value = JSON.parse(row.changeDetails)
  } catch (e) {
    ElMessage.error('JSON 解析失败')
    currentDetail.value = { error: '无效的JSON数据' }
  }
  detailDialogVisible.value = true
}


// 重置查询
const resetQuery = () => {
  logPage.value.userId = null
  logPage.value.action = ''
  logPage.value.actionDate = ''
  loadData()
}

// 分页处理
const handlePageChange = (page) => {
  logPage.value.page = page
  loadData()
}

const userIdCache = reactive(new Map()); // 缓存数据
const requestPromises = new Map();          // 缓存请求 Promise

const userFormatter = (row, column, cellValue) => {
  // 1. 如果已有缓存数据，直接返回
  if (userIdCache.has(cellValue)) {
    return userIdCache.get(cellValue);
  }

  // 2. 如果当前 ID 的请求正在进行，返回加载中
  if (requestPromises.has(cellValue)) {
    return '加载中...';
  }

  // 3. 发起请求并记录 Promise
  const promise = getUserId(cellValue);
  requestPromises.set(cellValue, promise);

  // 4. 请求完成后清理 Promise 记录，并更新缓存
  promise.finally(() => {
    requestPromises.delete(cellValue);
  });

  return '加载中...';
};

const getUserId = async (id) => {
  try {
    const res = await staffFetchIdService(id);
    const name = res.code === 1 ? res.data.name : '未知';
    userIdCache.set(id, name); // 更新缓存
  } catch (error) {
    userIdCache.set(id, '未知');
  }
};

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="log-container">
    <!-- 查询区域 -->
    <div class="query-section">
      <el-form :inline="true">
        <el-form-item label="用户名" prop="userId">
          <el-input
              v-model.number="logPage.userId"
              placeholder="请输入用户名"
              clearable
              style="width: 150px"
          />
        </el-form-item>

        <el-form-item label="操作类型" prop="action">
          <el-select
              v-model="logPage.action"
              placeholder="操作类型"
              clearable
              style="width: 120px"
          >
            <el-option
                v-for="item in actionOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="操作日期" prop="actionDate">
          <el-date-picker
              v-model="logPage.actionDate"
              type="date"
              placeholder="选择日期"
              value-format="YYYY-MM-DD"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="loadData">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <el-table
        :data="logPageList"
        v-loading="loading"
        border
        style="width: 100%"
        class="data-table"
    >
      <el-table-column prop="userId" label="用户名" width="100" align="center" :formatter="userFormatter"/>
      <el-table-column prop="action" label="操作类型" width="120" align="center">
        <template #default="{ row }">
          <el-tag
              :type="row.action === 'delete' ? 'danger' : row.action === 'update' ? 'warning' : 'success'"
              effect="plain"
              size="small"
          >
            {{ {insert: '新增', update: '修改', delete: '删除'}[row.action] }}
          </el-tag>
        </template>
      </el-table-column>

      <el-table-column prop="targetTable" label="目标表" width="150"/>
      <el-table-column prop="targetId" label="目标ID" width="100" align="center"/>

      <el-table-column prop="changeDetails" label="变更详情">
        <template #default="{ row }">
          <div class="json-preview" @click="showDetail(row)">
            {{ JSON.stringify(row.changeDetails).slice(0, 50) }}...
          </div>
        </template>
      </el-table-column>

      <el-table-column prop="actionDate" label="操作时间" width="170" align="center"/>
    </el-table>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
          v-model:current-page="logPage.page"
          v-model:page-size="logPage.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="loadData"
          @current-change="handlePageChange"
      />
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="变更详情" width="700px">
      <div class="json-container">
        <vue-json-pretty
            :data="currentDetail"
            :deep="2"
            show-line
            show-length
            :show-line-number="true"
        />
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.log-container {
  padding: 20px;
  background: #fff;
  border-radius: 4px;
}

.query-section {
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 4px;
}

.data-table {
  margin-top: 15px;

  :deep(.el-table__header th) {
    background-color: #f8f9fa !important;
  }
}
.json-container {
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  max-height: 60vh;
  overflow: auto;
}

/* +++ 调整组件内置样式 +++ */
:deep(.vjs-tree) {
  font-family: Menlo, Consolas, monospace;
  font-size: 13px;
}

:deep(.vjs-key) {
  color: #c18401;
}

:deep(.vjs-value__string) {
  color: #42b983;
}
.json-preview {
  cursor: pointer;
  color: #666;
  font-family: Monaco, monospace;
  font-size: 12px;

  &:hover {
    color: #409eff;
  }
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
