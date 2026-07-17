<template>
  <div class="profile">
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card>
          <template #header><span>个人信息</span></template>
          <div class="avatar-area">
            <el-upload
              :show-file-list="false"
              :before-upload="beforeAvatarUpload"
              :http-request="handleAvatarUpload"
              accept="image/jpeg,image/png,image/gif,image/webp"
            >
              <el-avatar :size="80" :src="avatarUrl || undefined" icon="UserFilled" />
              <div class="avatar-tip">点击上传头像<br />jpg/png/gif/webp</div>
            </el-upload>
          </div>
          <el-form :model="profileForm" label-width="80px" :disabled="!editing">
            <el-form-item label="用户名">
              <el-input v-model="info.username" disabled style="max-width: 280px" />
            </el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="profileForm.nickname" style="max-width: 280px" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input v-model="profileForm.email" style="max-width: 280px" />
            </el-form-item>
            <el-form-item label="手机号">
              <el-input v-model="profileForm.phone" style="max-width: 280px" />
            </el-form-item>
            <el-form-item label="角色">
              <el-tag v-for="r in info.roles" :key="r" style="margin-right: 8px">{{ r }}</el-tag>
            </el-form-item>
            <el-form-item label="注册时间">
              <span>{{ info.createdAt }}</span>
            </el-form-item>
            <el-form-item v-if="!editing">
              <el-button type="primary" @click="startEdit">编辑</el-button>
            </el-form-item>
            <el-form-item v-else>
              <el-button type="primary" :loading="saving" @click="saveProfile">保存</el-button>
              <el-button @click="cancelEdit">取消</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span>修改密码</span></template>
          <el-form ref="pwdFormRef" :model="pwdForm" :rules="pwdRules" label-width="100px" style="max-width: 340px">
            <el-form-item label="旧密码" prop="oldPassword">
              <el-input v-model="pwdForm.oldPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input v-model="pwdForm.newPassword" type="password" show-password />
            </el-form-item>
            <el-form-item label="确认新密码" prop="confirmPassword">
              <el-input v-model="pwdForm.confirmPassword" type="password" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="changingPwd" @click="changePwd">修改密码</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed } from 'vue'
import { ElMessage, type FormInstance, type FormRules, type UploadRequestOptions } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import { updateProfileApi, changePasswordApi, uploadFileApi } from '../../api'

const authStore = useAuthStore()
const info = ref(authStore.userInfo!)
const editing = ref(false)
const saving = ref(false)
const avatarUploading = ref(false)
const avatarUrl = computed(() => info.value?.avatar || '')

async function beforeAvatarUpload(file: File) {
  const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  if (!allowed.includes(file.type)) {
    ElMessage.error('头像仅支持 jpg/png/gif/webp 格式')
    return false
  }
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('头像大小不能超过 5MB')
    return false
  }
  return true
}

async function handleAvatarUpload(options: UploadRequestOptions) {
  avatarUploading.value = true
  try {
    // 第一步：通用上传，拿到 url
    const upRes = await uploadFileApi(options.file as File, 'avatar')
    const url = upRes.data.data.url
    // 第二步：调 profile 更新，把 avatar 字段存到用户
    const res = await updateProfileApi({ avatar: url })
    info.value = res.data.data
    authStore.userInfo = res.data.data
    ElMessage.success('头像上传成功')
  } catch {
    // 错误已由拦截器处理
  } finally {
    avatarUploading.value = false
  }
}
const profileForm = reactive({
  nickname: info.value.nickname || '',
  email: info.value.email || '',
  phone: info.value.phone || '',
})

function startEdit() {
  editing.value = true
}
function cancelEdit() {
  profileForm.nickname = info.value.nickname || ''
  profileForm.email = info.value.email || ''
  profileForm.phone = info.value.phone || ''
  editing.value = false
}
async function saveProfile() {
  saving.value = true
  try {
    await updateProfileApi({
      nickname: profileForm.nickname || undefined,
      email: profileForm.email || undefined,
      phone: profileForm.phone || undefined,
    })
    ElMessage.success('保存成功')
    editing.value = false
    authStore.fetchProfile()
  } finally {
    saving.value = false
  }
}

// 修改密码
const pwdFormRef = ref<FormInstance>()
const changingPwd = ref(false)
const pwdForm = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const validateConfirm = (_: any, value: string, cb: any) => {
  if (value !== pwdForm.newPassword) cb(new Error('两次密码不一致'))
  else cb()
}
const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 32, message: '密码长度 6-32 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirm, trigger: 'blur' },
  ],
}

async function changePwd() {
  const valid = await pwdFormRef.value?.validate().catch(() => false)
  if (!valid) return
  changingPwd.value = true
  try {
    await changePasswordApi({ oldPassword: pwdForm.oldPassword, newPassword: pwdForm.newPassword })
    ElMessage.success('密码修改成功，请重新登录')
    authStore.logout()
    setTimeout(() => location.reload(), 800)
  } finally {
    changingPwd.value = false
  }
}
</script>

<style scoped>
.avatar-area {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.avatar-area :deep(.el-upload) {
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
}
.avatar-tip {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
}
</style>
