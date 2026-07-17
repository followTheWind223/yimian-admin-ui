<template>
  <div class="log-module">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>日志模块字典</span>
          <el-button type="primary" :icon="Plus" @click="openCreate">新增模块</el-button>
        </div>
      </template>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="code" label="编码" width="130">
          <template #default="{ row }">
            <el-tag>{{ row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="140" />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="启用" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.enabled === 1 ? 'success' : 'info'" size="small">
              {{ row.enabled === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除该模块？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑模块' : '新增模块'" width="460px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="编码" prop="code">
          <el-input v-model="form.code" :disabled="dialog.isEdit" placeholder="如 USER" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如 用户管理" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.loading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  getLogModuleListApi, createLogModuleApi,
  updateLogModuleApi, deleteLogModuleApi,
} from '../../api'
import type { LogModule } from '../../types/api'

const list = ref<LogModule[]>([])
const loading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const res = await getLogModuleListApi()
    list.value = res.data.data || []
  } finally {
    loading.value = false
  }
}

const dialog = reactive({ visible: false, isEdit: false, loading: false })
const formRef = ref<FormInstance>()
const editId = ref<number | null>(null)
const form = reactive({ code: '', name: '', description: '', sort: 0, enabled: 1 })
const formRules: FormRules = {
  code: [{ required: true, message: '请输入编码', trigger: 'blur' }],
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
}

function openCreate() {
  dialog.isEdit = false
  Object.assign(form, { code: '', name: '', description: '', sort: 0, enabled: 1 })
  dialog.visible = true
}
function openEdit(row: LogModule) {
  dialog.isEdit = true
  editId.value = row.id
  Object.assign(form, { code: row.code, name: row.name, description: row.description || '', sort: row.sort, enabled: row.enabled })
  dialog.visible = true
}
async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  dialog.loading = true
  try {
    if (dialog.isEdit) {
      await updateLogModuleApi(editId.value!, { name: form.name, description: form.description || undefined, sort: form.sort, enabled: form.enabled })
      ElMessage.success('编辑成功')
    } else {
      await createLogModuleApi({ code: form.code, name: form.name, description: form.description || undefined, sort: form.sort, enabled: form.enabled })
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    fetchList()
  } finally {
    dialog.loading = false
  }
}
async function handleDelete(id: number) {
  await deleteLogModuleApi(id)
  ElMessage.success('删除成功')
  fetchList()
}

onMounted(fetchList)
</script>

<style scoped>
.card-header { display: flex; align-items: center; justify-content: space-between; }
</style>
