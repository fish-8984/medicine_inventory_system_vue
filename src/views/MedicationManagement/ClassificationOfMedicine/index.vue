<script setup>
import { onMounted, ref } from 'vue'
import {ElMessage, ElMessageBox, ElTable} from 'element-plus'
import { EditPen, Warning } from '@element-plus/icons-vue'
import {
  classifyGetService,
  classifyAddService,
  classifyUpdateService,
  classifyDeleteService,
  classifyGetByIdService,
  classifyGetNameService
} from '@/api/classificationOfMedicine.js'

/* 响应式数据 */
const loading = ref(true)
const isSubmitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()
const parentOptions = ref([])

/* 分页配置 */
const total = ref(0)
const pageClassify = ref({ page: 1, pageSize: 10 })
const classifyPageList = ref([])

/* 表单数据 */
const classify = ref({
  categoryId: null,
  categoryName: '',
  parentId: null,
  description: '',
  sortOrder: 0,
  isDeleted: 0
})

const formRules = {
  categoryName: [
    {
      required: true,
      validator: (_, value, callback) => {
        if (!value?.trim()) return callback(new Error('分类名称不能为空'))
        if (value.length > 20) return callback(new Error('名称长度不能超过20字符'))
        callback()
      },
      trigger: 'blur'
    }
  ],
  sortOrder: [
    {
      type: 'number',
      validator: (_, value, callback) => {
        if (value < 0) return callback(new Error('排序值不能小于0'))
        if (!Number.isInteger(value)) return callback(new Error('请输入整数'))
        callback()
      },
      trigger: 'blur'
    }
  ]
}

onMounted(async () => {
  await Promise.all([loadClassifyList(), loadParentOptions()])
})

/* 数据加载方法 */
const loadClassifyList = async () => {
  try {
    loading.value = true
    const res = await classifyGetService(pageClassify.value)
    classifyPageList.value = res.data.records
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

const loadParentOptions = async () => {
  const res = await classifyGetNameService()
  parentOptions.value = [...res.data]
}

/* 交互操作 */
const handleSizeChange = (size) => {
  pageClassify.value.pageSize = size
  loadClassifyList()
}

const handleAdd = () => {
  isEdit.value = false
  classify.value = {
    categoryId: null,
    categoryName: '',
    parentId: 2,  // 默认选择顶级分类
    description: '',
    sortOrder: 1, // 自动填充当前排序
    isDeleted: 0
  }
  dialogVisible.value = true
}

const handleEdit = async (row) => {
  isEdit.value = true
  const res = await classifyGetByIdService(row.categoryId)
  classify.value = { ...res.data, parentId: res.data.parentId || 0 }
  dialogVisible.value = true
}

/* 提交逻辑（含防重复提交机制） */
const submitForm = async () => {
  try {
    await formRef.value.validate()
    isSubmitting.value = true

    const apiMethod = isEdit.value ? classifyUpdateService : classifyAddService
    await apiMethod({
      ...classify.value,
      parentId: classify.value.parentId === 0 ? null : classify.value.parentId
    })

    ElMessage.success({
      message: `${isEdit.value ? '更新' : '新增'}成功`,
      customClass: 'success-message'
    })
    dialogVisible.value = false
    await loadClassifyList()
  } finally {
    isSubmitting.value = false
  }
}

const handleDelete = async (id) => {
  try {
    await ElMessageBox.confirm(
        `<div class="confirm-box">
        <el-icon color="#f56c6c" class="icon-spin"><Warning /></el-icon>
        <div>删除分类将影响关联药品数据，确定继续？</div>
      </div>`,
        {
          confirmButtonText: '确认删除',
          cancelButtonText: '取消操作',
          dangerouslyUseHTMLString: true,
          customClass: 'delete-confirm'
        }
    )

    await classifyDeleteService(id)
    ElMessage.success({
      message: '删除成功',
      customClass: 'success-message',
      duration: 1500
    })
    await loadClassifyList()
  } catch {}
}
</script>

<template>
  <div class="classification-management">
    <!-- 操作区卡片 -->
    <el-card shadow="hover" class="mb-4 operation-card">
      <div class="flex justify-between items-center">
        <el-button type="success" @click="handleAdd">
          新增分类
        </el-button>
      </div>
    </el-card>
    <div style="height: 20px"></div>
    <!-- 数据表格 -->
    <el-card class="table-box" v-loading="loading">
      <el-table
          :data="classifyPageList"
          stripe
          style="width: 100%"
          :fit="true"
          border
          highlight-current-row
          :row-class-name="({ rowIndex }) => rowIndex % 2 === 0 ? 'even-row' : 'odd-row'">
      >
        <el-table-column prop="categoryId" label="ID" min-width="120" align="center" />
        <el-table-column prop="categoryName" label="分类名称" min-width="180"/>
        <el-table-column prop="parentId" label="父级分类" min-width="150"/>
        <el-table-column prop="sortOrder" label="排序" min-width="100" align="center" />
        <el-table-column label="操作" min-width="200" fixed="right">
          <template #default="scope">
            <el-button
                type="primary"
                size="small"
                @click.stop="handleEdit(scope.row)"
            >
              编辑
            </el-button>
            <el-button
                type="danger"
                size="small"
                @click.stop="handleDelete(scope.row.categoryId)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 智能分页 -->
    <div class="pagination">
      <el-pagination
          v-model:current-page="pageClassify.page"
          v-model:page-size="pageClassify.pageSize"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          background
          @size-change="handleSizeChange"
          @current-change="loadClassifyList"
      />
    </div>

    <!-- 表单弹窗 -->
    <el-dialog
        v-model="dialogVisible"
        :title="isEdit ? '编辑分类' : '新增分类'"
        width="600px"
        :close-on-click-modal="false"
        custom-class="smooth-dialog"
    >
      <template #header>
        <div class="dialog-header flex items-center">
          <el-icon class="mr-2"><EditPen /></el-icon>
          {{ isEdit ? '编辑分类信息' : '创建新药品分类' }}
        </div>
      </template>

      <el-form
          :model="classify"
          label-width="100px"
          :rules="formRules"
          ref="formRef"
          class="pr-6"
      >
        <el-form-item label="分类名称" prop="categoryName">
          <el-input
              v-model="classify.categoryName"
              placeholder="请输入2-20字符分类名称"
              clearable
          />
        </el-form-item>

        <el-form-item label="父级分类" prop="parentId">
          <el-select
              v-model="classify.parentId"
              placeholder="请选择上级分类"
              class="w-full"
              clearable
          >
            <el-option
                v-for="item in parentOptions"
                :key="item.categoryId"
                :label="item.categoryName"
                :value="item.categoryId"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="排序值" prop="sortOrder">
          <el-input-number
              v-model="classify.sortOrder"
              :min="0"
              controls-position="right"
              class="w-full"
          />
        </el-form-item>

        <el-form-item label="分类描述" prop="description">
          <el-input
              v-model="classify.description"
              type="textarea"
              :rows="3"
              placeholder="请输入分类描述（选填）"
              maxlength="200"
              show-word-limit
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button
            type="primary"
            :loading="isSubmitting"
            @click="submitForm"
        >
          {{ isSubmitting ? '提交中...' : '确认保存' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.classification-management {
  padding: 20px;
  background: #f8fafc;
}
.table-box {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0,0,0,.1);
}
.operation-card {
  transition: box-shadow 0.3s;
  border-radius: 8px;
  border: 1px solid #e4e7ed;

  :deep(.el-card__body) {
    padding: 16px 24px;
  }
}
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
  padding: 12px 0;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>