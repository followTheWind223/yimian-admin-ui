<template>
  <div class="login-page">
    <!-- 左侧：Logo 品牌 -->
    <div class="panel panel-left">
      <div class="panel-body logo-panel">
        <div class="brand-block">
          <h1 class="brand-name">易面</h1>
          <p class="brand-tagline">智能面试管理平台</p>
          <p class="brand-sub">管理员后台</p>
        </div>
      </div>
    </div>

    <!-- 右侧：登录表单 -->
    <div class="panel panel-right">
      <div class="panel-body form-panel">
        <div class="form-block">
          <h2 class="form-title">管理员登录</h2>
          <p class="form-subtitle">请使用管理员账号登录后台</p>
          <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" size="large" @keyup.enter="handleLogin">
            <el-form-item prop="username">
              <el-input v-model="loginForm.username" placeholder="请输入用户名" :prefix-icon="User" />
            </el-form-item>
            <el-form-item prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="loginLoading" class="submit-btn" @click="handleLogin">登 录</el-button>
            </el-form-item>
          </el-form>
          <p class="switch-tip">
            普通用户？
            <a class="switch-link" href="http://localhost:5174/#/login">前往用户端</a>
          </p>
        </div>
      </div>
    </div>

    <!-- 底部版权 -->
    <p class="page-footer">© {{ year }} 易面</p>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const authStore = useAuthStore()
const year = new Date().getFullYear()

const loginFormRef = ref<FormInstance>()
const loginLoading = ref(false)
const loginForm = reactive({ username: '', password: '' })
const loginRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  const valid = await loginFormRef.value?.validate().catch(() => false)
  if (!valid) return
  loginLoading.value = true
  try {
    await authStore.adminLogin(loginForm.username, loginForm.password)
    ElMessage.success('登录成功')
    router.replace('/admin/dashboard')
  } catch {
    // 后端 403 时拦截器提示"无权限访问"；其它错误也由拦截器处理
  } finally {
    loginLoading.value = false
  }
}
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.login-page {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  overflow: hidden;
  background: #f5f5f5;
}

/* ==================== 面板通用 ==================== */
.panel {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}
.panel-left { background: #ffffff; }
.panel-right { background: #f9fafb; }

/* ==================== 面板内容体 ==================== */
.panel-body {
  width: 100%;
  max-width: 420px;
  padding: 0 48px;
}

/* ==================== Logo 面板 ==================== */
.logo-panel { text-align: center; }
.brand-block { user-select: none; }
.brand-name {
  font-size: 56px; font-weight: 800; color: #6366f1;
  letter-spacing: 8px; margin: 0 0 12px 0;
}
.brand-tagline { font-size: 18px; color: #64748b; margin: 0 0 8px; font-weight: 400; }
.brand-sub { font-size: 14px; color: #94a3b8; letter-spacing: 4px; margin: 0; }

/* ==================== 表单面板 ==================== */
.form-block { width: 100%; }
.form-title { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 6px; }
.form-subtitle { font-size: 14px; color: #94a3b8; margin: 0 0 32px; }

.submit-btn {
  width: 100%; height: 44px; font-size: 16px; border-radius: 10px;
  background: #6366f1; border-color: #6366f1; transition: all 0.3s;
}
.submit-btn:hover {
  background: #4f46e5; border-color: #4f46e5;
  transform: translateY(-1px); box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}

/* ==================== 切换提示 ==================== */
.switch-tip { text-align: center; font-size: 14px; color: #94a3b8; margin: 16px 0 0; }
.switch-link { color: #6366f1; font-weight: 600; text-decoration: none; transition: all 0.2s; margin-left: 2px; }
.switch-link:hover { color: #4f46e5; text-decoration: underline; }

/* ==================== 底部版权 ==================== */
.page-footer {
  position: fixed; bottom: 24px; left: 0; right: 0; text-align: center;
  font-size: 13px; color: rgba(148, 163, 184, 0.6);
  z-index: 1; pointer-events: none;
}

@media (max-width: 768px) {
  .login-page { flex-direction: column; }
  .panel { flex: none; height: 50%; }
  .panel-body { padding: 0 24px; }
  .brand-name { font-size: 40px; }
  .form-title { font-size: 22px; }
}
</style>
