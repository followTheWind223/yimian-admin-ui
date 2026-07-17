<template>
  <div class="role-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色列表</span>
          <el-button type="primary" :icon="Plus" @click="openCreate">新增角色</el-button>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" stripe :row-class-name="getRowClassName">
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="roleCode" label="角色编码" min-width="180" />
        <el-table-column prop="roleName" label="角色名称" min-width="140" />
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="isRoleEnabled(row) ? 'success' : 'info'" round>
              {{ isRoleEnabled(row) ? '启用' : '关闭' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="360" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="success" size="small" @click="openPerms(row)">权限</el-button>
            <el-button link type="warning" size="small" @click="openAssignPerms(row)">分配权限</el-button>
            <el-switch
              class="status-switch"
              :model-value="isRoleEnabled(row)"
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

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑角色' : '新增角色'" width="460px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="角色编码" prop="roleCode">
          <el-input v-model="form.roleCode" :disabled="dialog.isEdit" placeholder="如 ROLE_HR" />
        </el-form-item>
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="如 人事专员" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.loading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="permDialog.visible" title="角色权限" width="460px">
      <el-tag v-for="p in permDialog.perms" :key="p" style="margin: 4px 8px 4px 0">{{ p }}</el-tag>
      <el-empty v-if="!permDialog.perms.length" description="暂无权限" />
    </el-dialog>

    <el-dialog v-model="assignDialog.visible" title="分配权限" width="560px">
      <el-checkbox-group v-model="assignDialog.permCodes">
        <div v-for="p in allPerms" :key="p.permCode" style="margin-bottom: 8px">
          <el-checkbox :value="p.permCode">{{ p.permCode }} - {{ p.permName }}</el-checkbox>
        </div>
      </el-checkbox-group>
      <el-empty v-if="!allPerms.length" description="暂无可分配的权限" />
      <template #footer>
        <el-button @click="assignDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="assignDialog.loading" @click="submitAssign">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import {
  assignPermissionsApi,
  createRoleApi,
  getPermissionListApi,
  getRoleListApi,
  getRolePermissionsApi,
  setRoleEnabledApi,
  updateRoleApi,
} from '../../api'
import type { Permission, Role } from '../../types/api'

const list = ref<Role[]>([])
const loading = ref(false)
const statusLoadingId = ref<number | null>(null)

async function fetchList() {
  loading.value = true
  try {
    const res = await getRoleListApi()
    list.value = res.data.data || []
  } finally {
    loading.value = false
  }
}

const dialog = reactive({ visible: false, isEdit: false, loading: false })
const formRef = ref<FormInstance>()
const editId = ref<number | null>(null)
const form = reactive({ roleCode: '', roleName: '', description: '', sort: 0 })
const formRules: FormRules = {
  roleCode: [{ required: true, message: '请输入角色编码', trigger: 'blur' }],
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
}

function isRoleEnabled(row: Role) {
  return row.deleted !== 1
}

function getRowClassName({ row }: { row: Role }) {
  return isRoleEnabled(row) ? '' : 'role-row--disabled'
}

function openCreate() {
  dialog.isEdit = false
  editId.value = null
  Object.assign(form, { roleCode: '', roleName: '', description: '', sort: 0 })
  dialog.visible = true
}

function openEdit(row: Role) {
  dialog.isEdit = true
  editId.value = row.id
  Object.assign(form, {
    roleCode: row.roleCode,
    roleName: row.roleName,
    description: row.description || '',
    sort: row.sort,
  })
  dialog.visible = true
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  dialog.loading = true
  try {
    if (dialog.isEdit) {
      await updateRoleApi(editId.value!, {
        roleName: form.roleName,
        description: form.description || undefined,
        sort: form.sort,
      })
      ElMessage.success('编辑成功')
    } else {
      await createRoleApi({
        roleCode: form.roleCode,
        roleName: form.roleName,
        description: form.description || undefined,
        sort: form.sort,
      })
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    await fetchList()
  } finally {
    dialog.loading = false
  }
}

async function handleEnabledChange(row: Role, enabled: boolean) {
  statusLoadingId.value = row.id
  try {
    const res = await setRoleEnabledApi(row.id, enabled)
    row.deleted = res.data.data?.deleted ?? (enabled ? 0 : 1)
    ElMessage.success(enabled ? '角色已启用' : '角色已关闭')
  } finally {
    statusLoadingId.value = null
  }
}

const permDialog = reactive({ visible: false, perms: [] as string[] })
async function openPerms(row: Role) {
  const res = await getRolePermissionsApi(row.id)
  permDialog.perms = res.data.data || []
  permDialog.visible = true
}

const allPerms = ref<Permission[]>([])
const assignDialog = reactive({ visible: false, loading: false, permCodes: [] as string[], roleId: 0 })
async function openAssignPerms(row: Role) {
  const [permsRes, allRes] = await Promise.all([getRolePermissionsApi(row.id), getPermissionListApi()])
  assignDialog.roleId = row.id
  assignDialog.permCodes = permsRes.data.data || []
  allPerms.value = (allRes.data.data || []).filter((permission) => permission.deleted !== 1)
  assignDialog.visible = true
}

async function submitAssign() {
  assignDialog.loading = true
  try {
    await assignPermissionsApi(assignDialog.roleId, { permCodes: assignDialog.permCodes })
    ElMessage.success('权限分配成功')
    assignDialog.visible = false
    await fetchList()
  } finally {
    assignDialog.loading = false
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

:deep(.role-row--disabled) {
  color: #94a3b8;
}

:deep(.role-row--disabled .el-table__cell) {
  background: #fafafa;
}
</style>
