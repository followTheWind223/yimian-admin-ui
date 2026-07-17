<template>
  <div class="dashboard">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-banner__content">
        <h2>{{ greeting }}，{{ user?.nickname || user?.username || '管理员' }}</h2>
        <p>这里是系统全局概览，当前系统运行正常，共 {{ stats.users }} 名用户在使用易面</p>
      </div>
      <div class="welcome-banner__logo">
        <img src="../../assets/logo.png" alt="易面" />
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--indigo"><el-icon :size="22"><User /></el-icon></div>
        <div class="stat-card__body">
          <div class="stat-card__label">用户总数</div>
          <div class="stat-card__value">{{ stats.users }}</div>
          <div class="stat-card__trend">注册用户</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--violet"><el-icon :size="22"><Key /></el-icon></div>
        <div class="stat-card__body">
          <div class="stat-card__label">角色数量</div>
          <div class="stat-card__value">{{ stats.roles }}</div>
          <div class="stat-card__trend">已配置角色</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--sky"><el-icon :size="22"><Lock /></el-icon></div>
        <div class="stat-card__body">
          <div class="stat-card__label">权限数量</div>
          <div class="stat-card__value">{{ stats.perms }}</div>
          <div class="stat-card__trend">细粒度权限</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--emerald"><el-icon :size="22"><Monitor /></el-icon></div>
        <div class="stat-card__body">
          <div class="stat-card__label">系统状态</div>
          <div class="stat-card__value stat-card__value--ok">运行中</div>
          <div class="stat-card__trend">所有服务正常</div>
        </div>
      </div>
    </div>

    <!-- 主体两栏 -->
    <div class="dashboard-body">
      <!-- 最近操作日志 -->
      <div class="panel panel--lg">
        <div class="panel__header">
          <span class="panel__title"><el-icon><Document /></el-icon> 最近操作日志</span>
          <el-button text type="primary" @click="$router.push('/admin/logs')">查看全部</el-button>
        </div>
        <el-table :data="recentLogs" v-loading="logsLoading" size="small">
          <el-table-column prop="username" label="操作人" width="100" />
          <el-table-column label="模块" width="120">
            <template #default="{ row }">
              <el-tag size="small" type="info">{{ row.moduleName || row.module }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="operation" label="操作" min-width="120" />
          <el-table-column prop="description" label="详情" min-width="180" show-overflow-tooltip />
          <el-table-column label="结果" width="70" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
                {{ row.status === 1 ? '成功' : '失败' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="duration" label="耗时" width="80" align="center">
            <template #default="{ row }">{{ row.duration }}ms</template>
          </el-table-column>
          <el-table-column prop="createdAt" label="时间" width="160" />
        </el-table>
        <el-empty v-if="!logsLoading && recentLogs.length === 0" description="暂无操作日志" />
      </div>

      <!-- 快捷入口 -->
      <div class="panel">
        <div class="panel__header"><span class="panel__title"><el-icon><Link /></el-icon> 快捷入口</span></div>
        <div class="quick-grid">
          <div class="quick-item" v-for="link in quickLinks" :key="link.path" @click="$router.push(link.path)">
            <div class="quick-item__icon"><el-icon :size="20"><component :is="link.icon" /></el-icon></div>
            <div class="quick-item__label">{{ link.label }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { User, Key, Lock, Monitor, Document, Link, Avatar, Setting } from '@element-plus/icons-vue'
import { getUserListApi, getRoleListApi, getPermissionListApi, getLogListApi } from '../../api'
import { useAuthStore } from '../../stores/auth'
import type { OperationLog } from '../../types/api'

const authStore = useAuthStore()
const user = computed(() => authStore.userInfo)

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 12) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
})

const stats = reactive({ users: 0, roles: 0, perms: 0 })
const recentLogs = ref<OperationLog[]>([])
const logsLoading = ref(false)

const quickLinks = [
  { path: '/admin/users', label: '用户管理', icon: Avatar },
  { path: '/admin/roles', label: '角色管理', icon: Key },
  { path: '/admin/permissions', label: '权限管理', icon: Lock },
  { path: '/admin/logs', label: '操作日志', icon: Document },
  { path: '/admin/profile', label: '个人中心', icon: Setting },
  { path: '/admin/log-modules', label: '日志模块', icon: Document },
]

onMounted(async () => {
  logsLoading.value = true
  const [userRes, roleRes, permRes, logRes] = await Promise.allSettled([
    getUserListApi({ page: 1, size: 1 }),
    getRoleListApi(),
    getPermissionListApi(),
    getLogListApi({ page: 1, size: 8 }),
  ])
  if (userRes.status === 'fulfilled') stats.users = userRes.value.data.data?.total ?? 0
  if (roleRes.status === 'fulfilled') stats.roles = (roleRes.value.data.data || []).length
  if (permRes.status === 'fulfilled') stats.perms = (permRes.value.data.data || []).length
  if (logRes.status === 'fulfilled') recentLogs.value = logRes.value.data.data?.list || []
  logsLoading.value = false
})
</script>

<style scoped>
.dashboard { }

/* 欢迎横幅 */
.welcome-banner {
  display: flex; align-items: center; justify-content: space-between;
  background: linear-gradient(120deg, #eef2ff 0%, #f5f3ff 100%);
  border-radius: 14px; padding: 28px 32px; margin-bottom: 24px;
  border: 1px solid #eef2ff;
}
.welcome-banner__content h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
.welcome-banner__content p { font-size: 14px; color: #64748b; margin: 0; }
.welcome-banner__logo img { height: 48px; width: auto; }

/* 统计卡片 */
.stat-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 24px;
}
.stat-card {
  background: #fff; border-radius: 12px; padding: 22px;
  border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  display: flex; gap: 16px; transition: transform 0.2s, box-shadow 0.2s;
}
.stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.stat-card__icon {
  width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.stat-card__icon--indigo { background: linear-gradient(135deg, #6366f1, #818cf8); }
.stat-card__icon--violet { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
.stat-card__icon--sky { background: linear-gradient(135deg, #0ea5e9, #38bdf8); }
.stat-card__icon--emerald { background: linear-gradient(135deg, #10b981, #34d399); }
.stat-card__label { font-size: 13px; color: #94a3b8; }
.stat-card__value { font-size: 28px; font-weight: 700; color: #1e293b; line-height: 1.2; margin: 2px 0; }
.stat-card__value--ok { font-size: 20px; color: #10b981; }
.stat-card__trend { font-size: 12px; color: #cbd5e1; }

/* 主体两栏 */
.dashboard-body { display: grid; grid-template-columns: 1fr 320px; gap: 24px; align-items: start; }
.panel {
  background: #fff; border-radius: 12px; padding: 20px;
  border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.panel__header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.panel__title { font-size: 15px; font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 6px; }

/* 快捷入口 */
.quick-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.quick-item {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 18px 8px; border-radius: 10px; background: #f8fafc;
  cursor: pointer; transition: all 0.2s; text-align: center;
}
.quick-item:hover { background: #eef2ff; transform: translateY(-2px); }
.quick-item__icon {
  width: 38px; height: 38px; border-radius: 8px; background: #fff;
  display: flex; align-items: center; justify-content: center; color: #6366f1;
  box-shadow: 0 1px 3px rgba(0,0,0,0.06);
}
.quick-item__label { font-size: 13px; color: #475569; }

@media (max-width: 1200px) {
  .stat-grid { grid-template-columns: repeat(2, 1fr); }
  .dashboard-body { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .stat-grid { grid-template-columns: 1fr; }
  .welcome-banner { flex-direction: column; gap: 16px; text-align: center; }
}
</style>
