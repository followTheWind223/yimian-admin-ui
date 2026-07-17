<template>
  <div class="dashboard">
    <!-- 欢迎横幅 -->
    <div class="welcome-banner">
      <div class="welcome-banner__avatar">
        <el-avatar :size="64" :src="user?.avatar || undefined" icon="UserFilled" />
      </div>
      <div class="welcome-banner__content">
        <h2>{{ greeting }}，{{ user?.nickname || user?.username || '用户' }}</h2>
        <p class="welcome-banner__role">
          <el-tag v-for="r in user?.roles" :key="r" size="small" type="info" effect="plain" style="margin-right: 6px">
            {{ r.replace('ROLE_', '') }}
          </el-tag>
        </p>
        <p class="welcome-banner__time">最后登录：{{ user?.lastLoginTime || '暂无记录' }}</p>
      </div>
      <div class="welcome-banner__logo">
        <img src="../../assets/logo.png" alt="易面" />
      </div>
    </div>

    <!-- 信息卡片 -->
    <div class="info-grid">
      <div class="info-card">
        <div class="info-card__icon info-card__icon--indigo"><el-icon :size="20"><User /></el-icon></div>
        <div class="info-card__label">用户名</div>
        <div class="info-card__value">{{ user?.username || '-' }}</div>
      </div>
      <div class="info-card">
        <div class="info-card__icon info-card__icon--sky"><el-icon :size="20"><Iphone /></el-icon></div>
        <div class="info-card__label">手机号</div>
        <div class="info-card__value">{{ user?.phone || '未填写' }}</div>
      </div>
      <div class="info-card">
        <div class="info-card__icon info-card__icon--emerald"><el-icon :size="20"><Message /></el-icon></div>
        <div class="info-card__label">邮箱</div>
        <div class="info-card__value">{{ user?.email || '未填写' }}</div>
      </div>
    </div>

    <!-- 常用操作 -->
    <div class="panel">
      <div class="panel__header"><span class="panel__title"><el-icon><Link /></el-icon> 常用操作</span></div>
      <div class="action-grid">
        <div class="action-item" @click="$router.push('/admin/profile')">
          <div class="action-item__icon action-item__icon--indigo"><el-icon :size="22"><User /></el-icon></div>
          <div class="action-item__body">
            <div class="action-item__title">个人资料</div>
            <div class="action-item__desc">查看和修改你的头像、昵称、联系方式</div>
          </div>
          <el-icon class="action-item__arrow"><ArrowRight /></el-icon>
        </div>
        <div class="action-item" @click="$router.push('/admin/profile')">
          <div class="action-item__icon action-item__icon--violet"><el-icon :size="22"><Lock /></el-icon></div>
          <div class="action-item__body">
            <div class="action-item__title">修改密码</div>
            <div class="action-item__desc">定期更新你的登录密码以保障账号安全</div>
          </div>
          <el-icon class="action-item__arrow"><ArrowRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 账号信息 -->
    <div class="account-note">
      <el-icon><InfoFilled /></el-icon>
      <span>账号注册于 {{ user?.createdAt || '-' }}，已陪伴你 {{ daysSince }} 天</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { User, Lock, Message, Iphone, Link, ArrowRight, InfoFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'

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

const daysSince = computed(() => {
  const created = user.value?.createdAt
  if (!created) return 0
  const diff = Date.now() - new Date(created).getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
})
</script>

<style scoped>
.dashboard { max-width: 960px; margin: 0 auto; }

/* 欢迎横幅 */
.welcome-banner {
  display: flex; align-items: center; gap: 20px;
  background: linear-gradient(120deg, #eef2ff 0%, #f5f3ff 100%);
  border-radius: 14px; padding: 24px 32px; margin-bottom: 24px;
  border: 1px solid #eef2ff;
}
.welcome-banner__avatar { flex-shrink: 0; }
.welcome-banner__content { flex: 1; }
.welcome-banner__content h2 { font-size: 22px; font-weight: 700; color: #1e293b; margin: 0 0 8px; }
.welcome-banner__role { margin: 0 0 6px; }
.welcome-banner__time { font-size: 13px; color: #94a3b8; margin: 0; }
.welcome-banner__logo { flex-shrink: 0; }
.welcome-banner__logo img { height: 44px; width: auto; }

/* 信息卡片 */
.info-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 24px;
}
.info-card {
  background: #fff; border-radius: 12px; padding: 22px;
  border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}
.info-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
.info-card__icon {
  width: 38px; height: 38px; border-radius: 10px; margin-bottom: 14px;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.info-card__icon--indigo { background: linear-gradient(135deg, #6366f1, #818cf8); }
.info-card__icon--sky { background: linear-gradient(135deg, #0ea5e9, #38bdf8); }
.info-card__icon--emerald { background: linear-gradient(135deg, #10b981, #34d399); }
.info-card__label { font-size: 13px; color: #94a3b8; }
.info-card__value { font-size: 18px; font-weight: 600; color: #1e293b; margin-top: 4px; word-break: break-all; }

/* 操作面板 */
.panel {
  background: #fff; border-radius: 12px; padding: 20px;
  border: 1px solid #f1f5f9; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 24px;
}
.panel__header { margin-bottom: 16px; }
.panel__title { font-size: 15px; font-weight: 600; color: #1e293b; display: flex; align-items: center; gap: 6px; }

.action-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
.action-item {
  display: flex; align-items: center; gap: 14px;
  padding: 18px; border-radius: 10px; background: #f8fafc;
  cursor: pointer; transition: all 0.2s;
}
.action-item:hover { background: #eef2ff; transform: translateY(-2px); }
.action-item__icon {
  width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; color: #fff;
}
.action-item__icon--indigo { background: linear-gradient(135deg, #6366f1, #818cf8); }
.action-item__icon--violet { background: linear-gradient(135deg, #8b5cf6, #a78bfa); }
.action-item__body { flex: 1; }
.action-item__title { font-size: 15px; font-weight: 600; color: #1e293b; }
.action-item__desc { font-size: 13px; color: #94a3b8; margin-top: 2px; line-height: 1.5; }
.action-item__arrow { color: #cbd5e1; transition: transform 0.2s, color 0.2s; }
.action-item:hover .action-item__arrow { color: #6366f1; transform: translateX(3px); }

/* 账号信息提示 */
.account-note {
  display: flex; align-items: center; gap: 8px; justify-content: center;
  font-size: 13px; color: #cbd5e1; margin-top: 8px;
}

@media (max-width: 768px) {
  .info-grid { grid-template-columns: 1fr; }
  .action-grid { grid-template-columns: 1fr; }
  .welcome-banner { flex-wrap: wrap; }
  .welcome-banner__logo { display: none; }
}
</style>
