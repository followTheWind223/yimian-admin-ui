<template>
  <div class="user-list">
    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="用户名/昵称/邮箱" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="query.role" placeholder="全部" clearable style="width: 160px">
            <el-option label="管理员" value="ROLE_ADMIN" />
            <el-option label="面试官" value="ROLE_INTERVIEWER" />
            <el-option label="普通用户" value="ROLE_USER" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 120px">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
            <el-option label="锁定" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchList">搜索</el-button>
          <el-button :icon="RefreshRight" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button type="primary" :icon="Plus" @click="openCreate">新增用户</el-button>
        </div>
      </template>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column label="ID" width="132">
          <template #default="{ row }">
            <el-tooltip :content="String(row.id)" placement="top">
              <span class="id-cell">{{ formatId(row.id) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="160" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="角色" min-width="160">
          <template #default="{ row }">
            <el-tag v-for="r in row.roles" :key="r" size="small" style="margin-right: 4px">
              {{ r.replace('ROLE_', '') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'warning' : 'danger'" size="small">
              {{ row.status === 1 ? '正常' : row.status === 2 ? '锁定' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="170" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="openRoles(row)">分配角色</el-button>
            <el-button link type="warning" size="small" @click="openResetPwd(row)">重置密码</el-button>
            <el-popconfirm title="确定删除该用户？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.size"
        :total="total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        class="pagination"
        @change="fetchList"
      />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑用户' : '新增用户'" width="500px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="用户名" prop="username" v-if="!dialog.isEdit">
          <el-input v-model="form.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!dialog.isEdit">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="form.nickname" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="状态" v-if="dialog.isEdit">
          <el-select v-model="form.status">
            <el-option label="正常" :value="1" />
            <el-option label="禁用" :value="0" />
            <el-option label="锁定" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" v-if="!dialog.isEdit">
          <el-select v-model="form.roleCodes" multiple placeholder="不选则默认 ROLE_USER" style="width: 100%">
            <el-option label="管理员" value="ROLE_ADMIN" />
            <el-option label="面试官" value="ROLE_INTERVIEWER" />
            <el-option label="普通用户" value="ROLE_USER" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.loading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 分配角色弹窗 -->
    <el-dialog v-model="roleDialog.visible" title="分配角色" width="400px">
      <el-select v-model="roleDialog.roleCodes" multiple placeholder="请选择角色" style="width: 100%">
        <el-option label="管理员" value="ROLE_ADMIN" />
        <el-option label="面试官" value="ROLE_INTERVIEWER" />
        <el-option label="普通用户" value="ROLE_USER" />
      </el-select>
      <template #footer>
        <el-button @click="roleDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="roleDialog.loading" @click="submitRoles">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="pwdDialog.visible" title="重置密码" width="400px">
      <el-form ref="pwdFormRef" :model="pwdDialog" :rules="pwdFormRules" label-width="80px">
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="pwdDialog.newPassword"
            type="password"
            show-password
            autocomplete="new-password"
            placeholder="6-32 位，包含大小写字母和数字"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="pwdDialog.loading" :disabled="pwdDialog.loading" @click="submitResetPwd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search, RefreshRight, Plus } from '@element-plus/icons-vue'
import { getUserListApi, createUserApi, updateUserApi, deleteUserApi, resetPasswordApi, assignRolesApi } from '../../api'
import type { ApiId, UserInfo, UserQuery } from '../../types/api'

const query = reactive<UserQuery>({ page: 1, size: 10 })
const list = ref<UserInfo[]>([])
const total = ref(0)
const loading = ref(false)

function formatId(id: ApiId) {
  const text = String(id)
  return text.length > 12 ? `${text.slice(0, 6)}...${text.slice(-4)}` : text
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getUserListApi(query)
    const data = res.data.data
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}
function resetQuery() {
  query.page = 1
  query.keyword = ''
  query.role = undefined
  query.status = undefined
  fetchList()
}

// 新增/编辑
const dialog = reactive({ visible: false, isEdit: false, loading: false })
const formRef = ref<FormInstance>()
const editId = ref<ApiId | null>(null)
const form = reactive<any>({ username: '', password: '', nickname: '', email: '', phone: '', status: 1, roleCodes: [] })
const PASSWORD_COMPLEXITY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/
const PASSWORD_COMPLEXITY_MESSAGE = '密码必须包含至少一个大写字母、一个小写字母和一个数字'
const formRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度必须为 6-32 位', trigger: 'blur' },
    { pattern: PASSWORD_COMPLEXITY_PATTERN, message: PASSWORD_COMPLEXITY_MESSAGE, trigger: 'blur' },
  ],
}

function resetForm() {
  formRef.value?.resetFields()
  Object.assign(form, { username: '', password: '', nickname: '', email: '', phone: '', status: 1, roleCodes: [] })
  editId.value = null
}
function openCreate() {
  dialog.isEdit = false
  resetForm()
  dialog.visible = true
}
function openEdit(row: UserInfo) {
  dialog.isEdit = true
  editId.value = row.id
  Object.assign(form, { nickname: row.nickname || '', email: row.email || '', phone: row.phone || '', status: row.status })
  dialog.visible = true
}
async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  dialog.loading = true
  try {
    if (dialog.isEdit) {
      await updateUserApi(editId.value!, {
        nickname: form.nickname || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        status: form.status,
      })
      ElMessage.success('编辑成功')
    } else {
      await createUserApi({
        username: form.username,
        password: form.password,
        nickname: form.nickname || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        roleCodes: form.roleCodes.length ? form.roleCodes : undefined,
      })
      ElMessage.success('新增成功')
    }
    dialog.visible = false
    fetchList()
  } finally {
    dialog.loading = false
  }
}
async function handleDelete(id: ApiId) {
  await deleteUserApi(id)
  ElMessage.success('删除成功')
  fetchList()
}

// 分配角色
const roleDialog = reactive<{ visible: boolean; loading: boolean; roleCodes: string[]; userId: ApiId | null }>({
  visible: false,
  loading: false,
  roleCodes: [],
  userId: null,
})
function openRoles(row: UserInfo) {
  roleDialog.userId = row.id
  roleDialog.roleCodes = [...row.roles]
  roleDialog.visible = true
}
async function submitRoles() {
  if (roleDialog.userId == null) return
  roleDialog.loading = true
  try {
    await assignRolesApi(roleDialog.userId, { roleCodes: roleDialog.roleCodes })
    ElMessage.success('角色分配成功')
    roleDialog.visible = false
    fetchList()
  } finally {
    roleDialog.loading = false
  }
}

// 重置密码
const pwdDialog = reactive<{ visible: boolean; loading: boolean; newPassword: string; userId: ApiId | null }>({
  visible: false,
  loading: false,
  newPassword: '',
  userId: null,
})
const pwdFormRef = ref<FormInstance>()
const pwdFormRules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度必须为 6-32 位', trigger: 'blur' },
    { pattern: PASSWORD_COMPLEXITY_PATTERN, message: PASSWORD_COMPLEXITY_MESSAGE, trigger: 'blur' },
  ],
}
function openResetPwd(row: UserInfo) {
  pwdDialog.userId = row.id
  pwdDialog.newPassword = ''
  pwdDialog.visible = true
}
async function submitResetPwd() {
  if (pwdDialog.loading) return
  const valid = await pwdFormRef.value?.validate().catch(() => false)
  if (!valid || pwdDialog.userId == null) return
  pwdDialog.loading = true
  try {
    await resetPasswordApi(pwdDialog.userId, { newPassword: pwdDialog.newPassword })
    ElMessage.success('密码重置成功')
    pwdDialog.visible = false
  } catch {
    // 具体错误由请求拦截器统一提示，避免事件处理器产生未捕获异常。
  } finally {
    pwdDialog.loading = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.search-card { margin-bottom: 16px; }
.table-card { }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.id-cell {
  display: inline-block;
  max-width: 108px;
  overflow: hidden;
  color: #606266;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 13px;
  line-height: 1.4;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
