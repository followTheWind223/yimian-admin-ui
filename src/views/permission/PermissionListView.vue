<template>
  <div class="perm-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>权限列表</span>
          <el-button type="primary" :icon="Plus" @click="openCreate">新增权限</el-button>
        </div>
      </template>

      <el-table
        :data="list"
        v-loading="loading"
        stripe
        :row-class-name="getRowClassName"
      >
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="permCode" label="权限编码" min-width="220">
          <template #default="{ row }">
            <el-tag :type="isPermissionEnabled(row) ? 'primary' : 'info'">{{ row.permCode }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="permName" label="权限名称" min-width="160" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="isPermissionEnabled(row) ? 'success' : 'info'" round>
              {{ isPermissionEnabled(row) ? '启用' : '关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-switch
              class="status-switch"
              :model-value="isPermissionEnabled(row)"
              inline-prompt
              active-text="启用"
              inactive-text="关闭"
              :loading="statusLoadingId === row.id"
              @change="handleEnabledChange(row, Boolean($event))"
            />
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑权限' : '新增权限'" width="460px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="权限编码" prop="permCode">
          <el-input v-model="form.permCode" :disabled="dialog.isEdit" placeholder="如 user:create" />
        </el-form-item>
        <el-form-item label="权限名称" prop="permName">
          <el-input v-model="form.permName" placeholder="如 创建用户" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
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
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  createPermissionApi,
  getPermissionListApi,
  setPermissionEnabledApi,
  updatePermissionApi,
} from '../../api'
import type { Permission } from '../../types/api'

const list = ref<Permission[]>([])
const loading = ref(false)
const statusLoadingId = ref<number | null>(null)

async function fetchList() {
  loading.value = true
  try {
    const res = await getPermissionListApi()
    list.value = res.data.data || []
  } finally {
    loading.value = false
  }
}

const dialog = reactive({ visible: false, isEdit: false, loading: false })
const formRef = ref<FormInstance>()
const editId = ref<number | null>(null)
const form = reactive({ permCode: '', permName: '', description: '' })
const formRules: FormRules = {
  permCode: [{ required: true, message: '请输入权限编码', trigger: 'blur' }],
  permName: [{ required: true, message: '请输入权限名称', trigger: 'blur' }],
}

function isPermissionEnabled(row: Permission) {
  return row.deleted !== 1
}

function getRowClassName({ row }: { row: Permission }) {
  return isPermissionEnabled(row) ? '' : 'perm-row--disabled'
}

function openCreate() {
  dialog.isEdit = false
  editId.value = null
  Object.assign(form, { permCode: '', permName: '', description: '' })
  dialog.visible = true
}

function openEdit(row: Permission) {
  dialog.isEdit = true
  editId.value = row.id
  Object.assign(form, {
    permCode: row.permCode,
    permName: row.permName,
    description: row.description || '',
  })
  dialog.visible = true
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  dialog.loading = true
  try {
    if (dialog.isEdit) {
      await updatePermissionApi(editId.value!, {
        permName: form.permName,
        description: form.description || undefined,
      })
      ElMessage.success('编辑成功')
    } else {
      await createPermissionApi({
        permCode: form.permCode,
        permName: form.permName,
        description: form.description || undefined,
      })
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    await fetchList()
  } finally {
    dialog.loading = false
  }
}

async function handleEnabledChange(row: Permission, enabled: boolean) {
  statusLoadingId.value = row.id
  try {
    const res = await setPermissionEnabledApi(row.id, enabled)
    row.deleted = res.data.data?.deleted ?? (enabled ? 0 : 1)
    ElMessage.success(enabled ? '权限已启用' : '权限已关闭')
  } finally {
    statusLoadingId.value = null
  }
}

onMounted(fetchList)
</script>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-switch {
  margin-left: 10px;
  --el-switch-on-color: #22c55e;
  --el-switch-off-color: #94a3b8;
}

:deep(.perm-row--disabled) {
  color: #94a3b8;
}

:deep(.perm-row--disabled .el-table__cell) {
  background: #fafafa;
}
</style>
