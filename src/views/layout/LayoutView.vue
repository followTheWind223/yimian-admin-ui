<template>
  <el-container class="layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="layout-aside">
      <div class="logo">
        <span v-if="!collapsed" class="logo-text">易面</span>
        <span v-else class="logo-mini">易</span>
      </div>

      <el-menu
        :default-active="activeMenu"
        :collapse="collapsed"
        :collapse-transition="false"
        background-color="transparent"
        text-color="rgba(255,255,255,0.65)"
        active-text-color="#fff"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>控制台</span>
        </el-menu-item>
        <el-menu-item index="/admin/profile">
          <el-icon><User /></el-icon>
          <span>个人中心</span>
        </el-menu-item>

        <el-sub-menu index="content" v-if="canManageContent">
          <template #title>
            <el-icon><Collection /></el-icon>
            <span>内容管理</span>
          </template>
          <el-menu-item index="/admin/knowledge-audit" v-if="authStore.hasPermission('knowledge:audit')">
            <el-icon><CircleCheck /></el-icon>
            <span>题目审核</span>
          </el-menu-item>
          <el-menu-item index="/admin/tags" v-if="authStore.hasPermission('knowledge:audit')">
            <el-icon><PriceTag /></el-icon>
            <span>标签管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/topics" v-if="authStore.hasPermission('topic:list')">
            <el-icon><CollectionTag /></el-icon>
            <span>话题管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/blogs" v-if="authStore.hasPermission('blog:list')">
            <el-icon><Reading /></el-icon>
            <span>博客管理</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="ai" v-if="canManageAi">
          <template #title>
            <el-icon><Cpu /></el-icon>
            <span>AI 管理</span>
          </template>
          <el-menu-item
            index="/admin/agent-statistics"
            v-if="authStore.isAdmin || authStore.hasPermission('agent:statistics:view')"
          >
            <el-icon><DataAnalysis /></el-icon>
            <span>AI 统计</span>
          </el-menu-item>
          <el-menu-item
            index="/admin/agent-conversations"
            v-if="authStore.isAdmin || authStore.hasPermission('agent:conversation:list')"
          >
            <el-icon><ChatLineSquare /></el-icon>
            <span>会话审计</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="system" v-if="canManageSystem">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统管理</span>
          </template>
          <el-menu-item index="/admin/users" v-if="authStore.hasPermission('user:list')">
            <el-icon><Avatar /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/roles" v-if="authStore.hasPermission('role:list')">
            <el-icon><Key /></el-icon>
            <span>角色管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/permissions" v-if="authStore.hasPermission('perm:list')">
            <el-icon><Lock /></el-icon>
            <span>权限管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/logs" v-if="authStore.hasPermission('log:list')">
            <el-icon><Document /></el-icon>
            <span>操作日志</span>
          </el-menu-item>
          <el-menu-item index="/admin/feedback" v-if="authStore.isAdmin">
            <el-icon><Message /></el-icon>
            <span>反馈管理</span>
          </el-menu-item>
          <el-menu-item index="/admin/announcements" v-if="authStore.isAdmin || authStore.hasPermission('announcement:list')">
            <el-icon><Bell /></el-icon>
            <span>系统公告</span>
          </el-menu-item>
          <el-menu-item index="/admin/log-modules" v-if="authStore.hasPermission('log:module:list')">
            <el-icon><Tickets /></el-icon>
            <span>日志模块字典</span>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="collapsed = !collapsed" :size="20">
            <Fold v-if="!collapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path" :to="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <div class="header-right">
          <el-dropdown trigger="click">
            <span class="user-info">
              <el-avatar :size="34" :src="authStore.userInfo?.avatar || undefined">
                {{ userInitial }}
              </el-avatar>
              <span class="nickname">{{ displayName }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="$router.push('/admin/profile')">
                  <el-icon><User /></el-icon>个人中心
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const collapsed = ref(false)

const activeMenu = computed(() => route.path)
const breadcrumbs = computed(() => {
  const matched = route.matched.filter((item) => item.meta.title)
  return matched.map((item) => ({ path: item.path, title: item.meta.title as string }))
})

const displayName = computed(() => authStore.userInfo?.nickname || authStore.userInfo?.username || '用户')
const userInitial = computed(() => displayName.value.slice(0, 1))

const canManageContent = computed(() =>
  authStore.hasPermission('knowledge:audit')
  || authStore.hasPermission('topic:list')
  || authStore.hasPermission('blog:list'),
)

const canManageAi = computed(() =>
  authStore.hasPermission('agent:statistics:view')
  || authStore.hasPermission('agent:conversation:list')
  || authStore.isAdmin,
)

const canManageSystem = computed(() =>
  authStore.hasPermission('user:list')
  || authStore.hasPermission('role:list')
  || authStore.hasPermission('perm:list')
  || authStore.hasPermission('log:list')
  || authStore.hasPermission('log:module:list')
  || authStore.hasPermission('announcement:list')
  || authStore.isAdmin,
)

function handleLogout() {
  ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
    .then(() => {
      authStore.logout()
      router.replace('/login')
    })
    .catch(() => {})
}

function handleMenuSelect(index: string) {
  router.push(index)
}
</script>

<style scoped>
.layout {
  height: 100vh;
}

.layout-aside {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  overflow: hidden;
  transition: width 0.28s;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.logo-text {
  color: #fff;
  font-size: 22px;
  font-weight: 800;
  letter-spacing: 2px;
}

.logo-mini {
  color: #fff;
  font-size: 24px;
  font-weight: 800;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.header-left,
.header-right,
.user-info {
  display: flex;
  align-items: center;
}

.header-left {
  gap: 18px;
}

.user-info {
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
}

.collapse-btn {
  cursor: pointer;
  color: #8c8c8c;
  transition: color 0.2s;
}

.collapse-btn:hover {
  color: #6366f1;
}

.nickname {
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.layout-main {
  background: #f5f6fa;
  padding: 24px;
  overflow-y: auto;
}

:deep(.el-menu) {
  border-right: none !important;
  background: transparent !important;
}

:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
}

:deep(.el-menu-item:hover),
:deep(.el-sub-menu__title:hover) {
  background: rgba(255, 255, 255, 0.08) !important;
}

:deep(.el-menu-item.is-active),
:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  background: rgba(99, 102, 241, 0.25) !important;
  border-right: 3px solid #6366f1;
}
</style>
