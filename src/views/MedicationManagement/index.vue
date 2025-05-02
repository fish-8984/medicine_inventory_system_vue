<script setup>
import {onMounted, ref} from 'vue'
import {ElMessage, ElMessageBox} from 'element-plus';
import {medicineAddService, medicineDeleteService, medicineGetService, medicineUpdateService} from "@/api/medicines.js";
import {classifyGetNameService} from "@/api/classificationOfMedicine.js";

const loading = ref(true)
const isSubmitting = ref(false)
// 分页逻辑
const pagination = ref({
  currentPage: 1,
  pageSize: 10,
  total: 0
})
// 新增对话框显示状态
const dialogVisible = ref(false)
const dialogTitle = ref('新增药品')
const isEdit = ref(false)

const handleEdit = (row) => {
  console.log('编辑药品：', row);
  isEdit.value = true
  dialogTitle.value = '编辑药品'
  row.isGeneric = row.isGeneric === true ? '仿制药' : '非仿制药'
  medicine.value = { ...row } // 复制对象
  dialogVisible.value = true
}
const openAddDialog = () => {
  isEdit.value = false
  dialogTitle.value = '新增药品'
  medicine.value = {
    medicineId: null,
    name: "",
    specification: "",
    brand: "",
    categoryId: null,
    unit: "",
    price: null,
    isGeneric: null,
    createdAt: "",
    updatedAt: ""
  }      // 清空表单
  dialogVisible.value = true
}
const medicinePageList = ref([])
const medicinePage = ref({
  page: null,
  pageSize: null,
  name: "",
  brand: "",
  categoryId: "",
  isGeneric: ""
})
const medicine = ref({
  medicineId: null,
  name: "",
  specification: "",
  brand: "",
  categoryId: null,
  unit: "",
  price: null,
  isGeneric: "",
  createdAt: "",
  updatedAt: ""
})

const form = ref();
const rules = ref({
  name: [
    { required: true, message: '药品名不能为空', trigger: 'blur' },
    { min: 2, max: 10, message: '姓名长度在 2 到 10 个字符', trigger: 'blur' },
  ],
  specification: [
    { required: true, message: '规格不能为空', trigger: 'blur' },
    { min: 2, max: 10, message: '规格长度在 2 到 10 个字符', trigger: 'blur' },
  ],
  brand: [
    { required: true, message: '品牌不能为空', trigger: 'blur' },
    { min: 2, max: 10, message: '品牌长度在 2 到 10 个字符', trigger: 'blur' },
  ],
  categoryId: [
    { required: true, message: '请选择药品分类', trigger: 'change' }
  ],
  unit: [
    { required: true, message: '单位不能为空', trigger: 'blur' },
    { min: 2, max: 10, message: '单位长度在 2 到 10 个字符', trigger: 'blur' },
  ],
  price: [
    { required: true, message: '价格不能为空', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (!/^\d+(\.\d{1,2})?$/.test(value)) {
          callback(new Error('价格必须为数字，且最多保留两位小数'));
        } else if (value < 0) {
          callback(new Error('价格不能为负数'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  isGeneric: [
    { required: true, message: '是否为仿制药不能为空', trigger: 'change' }
  ],
});

const medicineDialogVisible = ref(false)
const classifyName = ref([{
  categoryId: null,
  categoryName: "",
  parentId: null,
  sortOrder: null
}])
const treeProps = {
  label: 'categoryName',
  children: 'children'
};
const classify = ref([])
const name = ref('')
const buildTree = (data, parentId = null) => {
  return data
      .filter(item => item.parentId === parentId)
      .map(item => ({
        ...item,
        children: buildTree(data, item.categoryId)
      }));
}

const resetForm = () => {
  medicinePage.value = {
    page: null,
    pageSize: null,
    name: "",
    brand: "",
    categoryId: "",
    isGeneric: null
  }
  name.value = ''
}

const categoryMap = ref(new Map());
const getClassifyName = async () => {
  try {
    const res = await classifyGetNameService();
    if (res.code === 1) {
      // 确保接口返回数据字段正确
      const rawData = res.data.map(item => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        parentId: item.parentId
      }));
      classifyName.value = rawData;
      classify.value = buildTree(rawData); // 使用处理后的数据
      //创建categoryId→categoryName的映射
      const map = new Map();
      rawData.forEach(item => {
        map.set(item.categoryId, item.categoryName);
      });
      categoryMap.value = map;
      console.log('原始数据:', res.data);
      console.log('生成的树形数据:', classify.value);
    }
  } catch (err) {
    ElMessage.error('分类加载失败');
  }
}

const handleSizeChange = (newSize) => {
    pagination.value.pageSize = newSize
    medicinePage.value.pageSize = newSize
    pagination.value.currentPage = 1 // 重置页码
    getMedicine()
  }

const handleCurrentChange = (newPage) => {
    pagination.value.currentPage = newPage
    medicinePage.value.page = newPage
    getMedicine()
  }
const getMedicine = async () => {
    console.log('请求参数：', {
      ...medicinePage.value,
      page: pagination.value.currentPage,
      pageSize: pagination.value.pageSize,
    });
    loading.value = true
    try {
      const res = await medicineGetService(medicinePage.value);
      if (res.code === 1) {
        medicinePageList.value = res.data.records;
        pagination.value.total = res.data.total;
      } else {
        ElMessage.error(res.msg);
      }
      loading.value = false
    } catch (e) {
      loading.value = false
      ElMessage.error('请求失败');
      console.error(e);
    }
  };

const submitForm = async () => {
    console.log('提交表单', medicine.value);
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
      // 校验通过后执行后续逻辑
      if (isEdit.value) {
        console.log('执行更新操作', medicine.value);
        await updatePatient();
      } else {
        console.log('执行新增操作', medicine.value);
        await addPatient();
      }
      isSubmitting.value = false;
      dialogVisible.value = false;
    } catch (error) {
      if (error.message !== '表单校验未通过') {
        ElMessage.error('操作失败，请重试');
        isSubmitting.value = false;
        console.error('操作失败:', error);
      }
    }
  };

const addPatient = async () => {
    const res = await medicineAddService(medicine.value);
    if (res.code === 1) {
      ElMessage.success("新增药品成功");
      await getMedicine();
    } else {
      throw new Error(res.msg); // 抛出异常以便在 submitForm 中捕获
    }
  };


const updatePatient = async () => {
    medicine.value.isGeneric = medicine.value.isGeneric === '仿制药' ? 'true' : 'false';
    const res = await medicineUpdateService(medicine.value);
    if (res.code === 1) {
      ElMessage.success("更新药品成功");
      await getMedicine();
    } else {
      throw new Error(res.msg); // 抛出异常以便在 submitForm 中捕获
    }
  };

const getMedicineId = (row) => {
  medicineDialogVisible.value = true;
  console.log('药品：', row);
  medicine.value = { ...row } // 复制对象
}
// 递归获取所有子节点ID
const getChildrenIds = (node, idList = []) => {
  if (!node) return [];
  idList.push(node.categoryId);
  if (node.children && node.children.length > 0) {
    node.children.forEach(child => getChildrenIds(child, idList));
  }
  return idList;
};

// 选择分类时的处理
const handleCategoryChange = (selectedId) => {
  // 1. 找到选中的节点
  const findNode = (data) => {
    for (const item of data) {
      if (item.categoryId === selectedId) return item;
      if (item.children) {
        const found = findNode(item.children);
        if (found) return found;
      }
    }
    return null;
  };

  // 2. 获取所有子节点ID（包含自己）
  const selectedNode = findNode(classify.value);
  const allIds = getChildrenIds(selectedNode);
  medicinePage.value.categoryId = allIds.join(',')
  console.log('所有相关ID:', allIds);
};

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
        `<div class="confirm-box">
        <el-icon color="#f56c6c" class="icon-spin"><Warning /></el-icon>
        <div>删除药品将影响关联药品数据，确定继续？</div>
      </div>`,
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true,
          customClass: 'confirm-dialog'
        }
    )
    await medicineDeleteService(row.medicineId)
    ElMessage.success('删除成功')
    await getMedicine()
  }catch (error) {
    ElMessage.error('删除失败')
  }
}


onMounted(() => {
  getClassifyName();
  getMedicine();
})
</script>


<template>
  <div>
    <el-card class="search-box">
      <el-form :inline="true" :model="medicinePage">
        <el-form-item label="药品通用名">
          <el-input
              v-model="medicinePage.name"
              placeholder="请输入药品通用名"
              clearable
              style="width: 140px"
          />
        </el-form-item>
        <el-form-item label="生产商/品牌">
          <el-input
              v-model="medicinePage.brand"
              placeholder="请输入生产商/品牌"
              clearable
              style="width: 145px"
          />
        </el-form-item>
        <el-form-item label="药品分类" style="width: 160px">
          <el-tree-select
              v-model="name"
              :data="classify"
              :props="treeProps"
              check-strictly
              node-key="categoryId"
              :expand-on-click-node="false"
              style="width: 160px"
              @change="handleCategoryChange"
          >
          </el-tree-select>
        </el-form-item>
        <el-form-item label="是否为仿制药">
          <el-select
              v-model="medicinePage.isGeneric"
              placeholder="请选择"
              clearable
              style="width: 100px"
          >
            <el-option label="仿制药" value='true' />
            <el-option label="非仿制药" value='false' />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getMedicine" :disabled="loading">查询</el-button>
          <el-button type="success" @click="openAddDialog">新增药品</el-button>
          <el-button type="primary" @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-box">
      <el-space wrap>
        <el-card
            v-for="item in medicinePageList"
            :key="item.medicineId"
            class="box-card"
            style="width: 100%"
        >
          <template #header>
            <div class="card-header">
              <span>{{ item.name }}</span>
              <div class="action-buttons">
                <el-button class="button" text @click="getMedicineId(item)">查看详情</el-button>
                <el-button
                    type="primary"
                    size="small"
                    @click="handleEdit(item)"
                >修改</el-button>
                <el-button
                    type="danger"
                    size="small"
                    style="margin-left: 10px"
                    plain
                    @click="handleDelete(item)"
                >删除</el-button>
              </div>
            </div>
          </template>
        </el-card>
      </el-space>
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
      <el-form :model="medicine" :rules="rules" ref="form" label-width="100px">
        <el-form-item label="药品通用名" prop="name">
          <el-input v-model="medicine.name" />
        </el-form-item>
        <el-form-item label="规格" prop="specification">
          <el-input v-model="medicine.specification" />
        </el-form-item>
        <el-form-item label="生产商/品牌" prop="brand">
          <el-input v-model="medicine.brand" />
        </el-form-item>
        <el-form-item label="药品分类">
          <el-tree-select
              v-model="medicine.categoryId"
              :data="classify"
              :props="treeProps"
              check-strictly
              node-key="categoryId"
              :expand-on-click-node="false"
              style="width: 180px"
          >
          </el-tree-select>
        </el-form-item>
        <el-form-item label="计量单位" prop="unit">
          <el-input v-model="medicine.unit" />
        </el-form-item>
        <el-form-item label="单价(含税)" prop="price">
          <el-input v-model="medicine.price" />
        </el-form-item>
        <el-form-item label="是否为仿制药" prop="isGeneric">
          <el-select v-model="medicine.isGeneric" placeholder="请选择">
            <el-option label="仿制药" value="true" />
            <el-option label="非仿制药" value="false" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :disabled="isSubmitting"  @click="submitForm">{{ isSubmitting ? '提交中...' : '提交' }}</el-button>
      </template>
    </el-dialog>

    <el-dialog
        v-model="medicineDialogVisible"
        :title="medicine.name"
        width="600px"
        class="medicine-dialog"
    >
      <el-card shadow="always" class="medicine-card">
        <el-row gutter="20">
          <el-col :span="12">
            <p><strong>药品通用名：</strong> {{ medicine.name }}</p>
          </el-col>
          <el-col :span="12">
            <p><strong>规格：</strong> {{ medicine.specification }}</p>
          </el-col>
        </el-row>
        <el-row gutter="20">
          <el-col :span="12">
            <p><strong>生产商：</strong> {{ medicine.brand }}</p>
          </el-col>
          <el-col :span="12"
          >
            <p><strong>药品分类：</strong> {{ categoryMap.get(medicine.categoryId) || '未知分类' }}</p>
          </el-col>
        </el-row>
        <el-row gutter="20">
          <el-col :span="12">
            <p><strong>计量单位：</strong> {{ medicine.unit }}</p>
          </el-col>
          <el-col :span="12">
            <p><strong>单价(含税)：</strong> {{ medicine.price }}</p>
          </el-col>
        </el-row>
        <el-row gutter="20">
          <el-col :span="12">
            <p><strong>是否为仿制药：</strong> {{ medicine.isGeneric === true ? '仿制药' : '非仿制药' }}</p>
          </el-col>
          <el-col :span="12">
            <p><strong>创建时间：</strong> {{ medicine.createdAt }}</p>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="24">
            <p><strong>最后更新时间：</strong> {{ medicine.updatedAt }}</p>
          </el-col>
        </el-row>
      </el-card>
    </el-dialog>
  </div>
</template>
<style scoped>
.medicine-dialog {
  background-color: #f9f9f9;
}
.medicine-card {
  border-radius: 8px;
  padding: 20px;
  background: #fdfdfd;
  border: 1px solid #ebeef5;
}
.medicine-card {
  margin-bottom: 10px;
}
.medicine-card p {
  margin: 0;
  line-height: 1.8;
  color: #606266;
}
.medicine-card strong {
  color: #303133;
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