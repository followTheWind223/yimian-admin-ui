<template>
  <div class="audit-page">
    <section class="page-heading">
      <div>
        <h1>AI 会话审计</h1>
        <p>查看小易的会话留存、消息状态和 Token 消耗。</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" circle title="刷新数据" @click="refreshAll" />
    </section>

    <section class="metric-grid" v-loading="statsLoading">
      <div class="metric-item">
        <span>会话总数</span>
        <strong>{{ formatNumber(stats.sessionCount) }}</strong>
        <small>活跃 {{ formatNumber(stats.activeSessionCount) }}</small>
      </div>
      <div class="metric-item">
        <span>消息总数</span>
        <strong>{{ formatNumber(stats.messageCount) }}</strong>
        <small>估算计数 {{ formatNumber(stats.estimatedMessageCount) }} 条</small>
      </div>
      <div class="metric-item metric-primary">
        <span>Token 总量</span>
        <strong>{{ formatNumber(stats.totalTokens) }}</strong>
        <small>输入 {{ formatNumber(stats.inputTokens) }} / 输出 {{ formatNumber(stats.outputTokens) }}</small>
      </div>
      <div class="metric-item">
        <span>用户会话</span>
        <strong>{{ formatNumber(stats.supportSessionCount) }}</strong>
        <small>进入正式会话记忆</small>
      </div>
      <div class="metric-item">
        <span>快捷会话</span>
        <strong>{{ formatNumber(stats.quickSessionCount) }}</strong>
        <small>系统可见，记忆隔离</small>
      </div>
      <div class="metric-item">
        <span>累计成本</span>
        <strong>${{ formatCost(stats.totalCostUsd) }}</strong>
        <small>按上游已记录用量</small>
      </div>
    </section>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="query">
        <el-form-item label="用户 ID">
          <el-input v-model="query.userId" placeholder="精确查询" clearable style="width: 190px" @keyup.enter="search" />
        </el-form-item>
        <el-form-item label="会话类型">
          <el-select v-model="query.sessionType" placeholder="全部" clearable style="width: 150px">
            <el-option label="用户会话" value="support" />
            <el-option label="快捷会话" value="quick" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
            <el-option label="活跃" :value="0" />
            <el-option label="已归档" :value="1" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="search">查询</el-button>
          <el-button :icon="RefreshRight" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card" shadow="never">
      <template #header>
        <div class="table-heading">
          <div>
            <strong>会话记录</strong>
            <span>包含快捷会话及软删除后的审计记录</span>
          </div>
          <span class="record-count">{{ formatNumber(total) }} 条</span>
        </div>
      </template>

      <el-table :data="sessions" v-loading="loading" stripe>
        <el-table-column label="会话 / 用户" min-width="190">
          <template #default="{ row }">
            <div class="identity-cell">
              <strong>#{{ compactId(row.id) }}</strong>
              <span>用户 {{ row.userId }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.sessionType === 'quick' ? 'warning' : 'primary'" effect="light">
              {{ sessionTypeLabel(row.sessionType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="105" align="center">
          <template #default="{ row }">
            <el-tag :type="row.deleted ? 'danger' : row.status === 0 ? 'success' : 'info'" effect="plain">
              {{ sessionStatusLabel(row) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="messageCount" label="消息" width="86" align="right" />
        <el-table-column label="Token" min-width="170" align="right">
          <template #default="{ row }">
            <div class="token-cell">
              <strong>{{ formatNumber(row.totalTokens) }}</strong>
              <span>入 {{ formatNumber(row.inputTokens) }} / 出 {{ formatNumber(row.outputTokens) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="模型" min-width="150">
          <template #default="{ row }">
            <div class="model-cell">
              <span>{{ row.modelName || '未记录' }}</span>
              <small>{{ row.modelProvider || '-' }}</small>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="最后活跃" width="170">
          <template #default="{ row }">{{ formatDate(row.lastActiveAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="110" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="openDetail(row)">查看消息</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="query.page"
        v-model:page-size="query.size"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @change="fetchSessions"
      />
    </el-card>

    <el-drawer v-model="drawer.visible" :size="drawerSize" destroy-on-close class="audit-drawer">
      <template #header>
        <div class="drawer-heading">
          <div>
            <strong>会话 #{{ compactId(drawer.sessionId) }}</strong>
            <span v-if="detail">用户 {{ detail.session.userId }} · {{ sessionTypeLabel(detail.session.sessionType) }}</span>
          </div>
        </div>
      </template>

      <div v-loading="drawer.loading" class="detail-content">
        <template v-if="detail">
          <section class="detail-summary">
            <div><span>消息</span><strong>{{ detail.session.messageCount }}</strong></div>
            <div><span>总 Token</span><strong>{{ formatNumber(detail.session.totalTokens) }}</strong></div>
            <div><span>输入</span><strong>{{ formatNumber(detail.session.inputTokens) }}</strong></div>
            <div><span>输出</span><strong>{{ formatNumber(detail.session.outputTokens) }}</strong></div>
          </section>

          <section class="message-list">
            <article
              v-for="message in detail.messages.list"
              :key="message.id"
              class="message-item"
              :class="`role-${message.role}`"
            >
              <header>
                <div class="role-label">
                  <el-icon><User v-if="message.role === 'user'" /><Cpu v-else /></el-icon>
                  <strong>{{ roleLabel(message.role) }}</strong>
                  <el-tag v-if="message.tokenEstimated" size="small" type="warning" effect="plain">Token 估算</el-tag>
                  <el-tag v-if="message.status !== 2" size="small" type="danger" effect="plain">{{ messageStatusLabel(message.status) }}</el-tag>
                </div>
                <time>{{ formatDate(message.createdAt) }}</time>
              </header>
              <pre>{{ message.content || '（无文本内容）' }}</pre>
              <footer>
                <span>Token {{ formatNumber(message.totalTokens) }}</span>
                <span v-if="message.inputTokens">输入 {{ formatNumber(message.inputTokens) }}</span>
                <span v-if="message.outputTokens">输出 {{ formatNumber(message.outputTokens) }}</span>
                <span v-if="message.reasoningTokens">推理 {{ formatNumber(message.reasoningTokens) }}</span>
                <span v-if="message.cachedInputTokens">缓存 {{ formatNumber(message.cachedInputTokens) }}</span>
                <span v-if="message.latencyMs != null">{{ formatNumber(message.latencyMs) }} ms</span>
                <span v-if="message.modelName">{{ message.modelName }}</span>
                <span v-if="message.errorCode" class="error-code">{{ message.errorCode }}</span>
              </footer>
            </article>
          </section>

          <el-empty v-if="!detail.messages.list.length" description="该会话暂无消息" />
          <el-pagination
            v-if="detail.messages.total > drawer.size"
            v-model:current-page="drawer.page"
            :page-size="drawer.size"
            :total="detail.messages.total"
            layout="total, prev, pager, next"
            @current-change="fetchDetail"
          />
        </template>
      </div>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { Refresh, RefreshRight, Search, View } from '@element-plus/icons-vue'
import {
  getAgentConversationDetailApi,
  getAgentConversationListApi,
  getAgentConversationStatsApi,
} from '../../api'
import type {
  AgentConversationDetail,
  AgentConversationQuery,
  AgentConversationSession,
  AgentConversationStats,
} from '../../types/api'

const emptyStats: AgentConversationStats = {
  sessionCount: 0,
  activeSessionCount: 0,
  supportSessionCount: 0,
  quickSessionCount: 0,
  messageCount: 0,
  inputTokens: 0,
  outputTokens: 0,
  reasoningTokens: 0,
  cachedInputTokens: 0,
  totalTokens: 0,
  estimatedMessageCount: 0,
  totalCostUsd: 0,
}

const query = reactive<AgentConversationQuery>({ page: 1, size: 20 })
const stats = reactive<AgentConversationStats>({ ...emptyStats })
const sessions = ref<AgentConversationSession[]>([])
const total = ref(0)
const loading = ref(false)
const statsLoading = ref(false)
const detail = ref<AgentConversationDetail | null>(null)
const drawer = reactive({ visible: false, loading: false, sessionId: '', page: 1, size: 100 })
const viewportWidth = ref(window.innerWidth)
const drawerSize = computed(() => viewportWidth.value < 820 ? '100%' : '760px')

function updateViewport() {
  viewportWidth.value = window.innerWidth
}

async function fetchStats() {
  statsLoading.value = true
  try {
    const response = await getAgentConversationStatsApi()
    Object.assign(stats, response.data.data)
  } catch {
    Object.assign(stats, emptyStats)
  } finally {
    statsLoading.value = false
  }
}

async function fetchSessions() {
  loading.value = true
  try {
    const params: AgentConversationQuery = {
      page: query.page,
      size: query.size,
      userId: query.userId?.trim() || undefined,
      sessionType: query.sessionType || undefined,
      status: query.status,
    }
    const response = await getAgentConversationListApi(params)
    sessions.value = response.data.data.list || []
    total.value = response.data.data.total || 0
  } catch {
    sessions.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

async function refreshAll() {
  await Promise.all([fetchStats(), fetchSessions()])
}

function search() {
  query.page = 1
  fetchSessions()
}

function resetQuery() {
  query.page = 1
  query.userId = undefined
  query.sessionType = undefined
  query.status = undefined
  fetchSessions()
}

async function openDetail(row: AgentConversationSession) {
  drawer.sessionId = row.id
  drawer.page = 1
  drawer.visible = true
  detail.value = null
  await fetchDetail()
}

async function fetchDetail() {
  if (!drawer.sessionId) return
  drawer.loading = true
  try {
    const response = await getAgentConversationDetailApi(drawer.sessionId, drawer.page, drawer.size)
    detail.value = response.data.data
  } catch {
    drawer.visible = false
  } finally {
    drawer.loading = false
  }
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('zh-CN').format(Number(value || 0))
}

function formatCost(value: number | null | undefined) {
  return Number(value || 0).toFixed(6)
}

function formatDate(value: string | null | undefined) {
  if (!value) return '-'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('zh-CN', { hour12: false })
}

function compactId(value: string) {
  if (!value) return '-'
  return value.length > 14 ? `${value.slice(0, 7)}…${value.slice(-5)}` : value
}

function sessionTypeLabel(type: string) {
  return type === 'quick' ? '快捷会话' : '用户会话'
}

function sessionStatusLabel(session: AgentConversationSession) {
  if (session.deleted) return '已删除'
  return session.status === 0 ? '活跃' : '已归档'
}

function roleLabel(role: string) {
  if (role === 'user') return '用户'
  if (role === 'assistant') return '小易'
  if (role === 'system') return '系统'
  return role
}

function messageStatusLabel(status: number) {
  return ({ 0: '待处理', 1: '生成中', 2: '完成', 3: '失败', 4: '已取消' } as Record<number, string>)[status] || '异常'
}

onMounted(() => {
  window.addEventListener('resize', updateViewport)
  refreshAll()
})
onBeforeUnmount(() => window.removeEventListener('resize', updateViewport))
</script>

<style scoped>
.audit-page { max-width: 1500px; margin: 0 auto; }
.page-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.page-heading h1 { font-size: 24px; line-height: 1.25; }
.page-heading p { margin-top: 6px; color: var(--color-text-secondary); font-size: 14px; }
.metric-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; min-height: 116px; }
.metric-item { min-width: 0; padding: 18px; background: #fff; border: 1px solid var(--color-border); border-radius: 8px; }
.metric-item > span { display: block; color: var(--color-text-secondary); font-size: 13px; }
.metric-item strong { display: block; margin: 10px 0 7px; color: #172033; font-size: 25px; line-height: 1; overflow-wrap: anywhere; }
.metric-item small { display: block; color: #94a3b8; font-size: 12px; line-height: 1.45; }
.metric-primary { border-color: rgba(99, 102, 241, 0.36); box-shadow: inset 3px 0 #6366f1; }
.search-card { margin-bottom: 16px; }
.search-card :deep(.el-card__body) { padding-bottom: 2px; }
.table-heading { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.table-heading > div { display: flex; align-items: baseline; gap: 12px; }
.table-heading span { color: var(--color-text-secondary); font-size: 13px; }
.record-count { white-space: nowrap; }
.identity-cell, .token-cell, .model-cell { display: flex; flex-direction: column; gap: 4px; }
.identity-cell strong { color: #334155; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.identity-cell span, .token-cell span, .model-cell small { color: #94a3b8; font-size: 12px; }
.token-cell strong { color: #4338ca; font-variant-numeric: tabular-nums; }
.drawer-heading { display: flex; align-items: center; min-width: 0; }
.drawer-heading > div { display: flex; flex-direction: column; gap: 4px; }
.drawer-heading strong { font-size: 17px; }
.drawer-heading span { color: var(--color-text-secondary); font-size: 13px; }
.detail-content { min-height: 280px; }
.detail-summary { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--color-border); border-radius: 8px; margin-bottom: 20px; overflow: hidden; }
.detail-summary div { padding: 14px 16px; border-right: 1px solid var(--color-border); }
.detail-summary div:last-child { border-right: 0; }
.detail-summary span, .detail-summary strong { display: block; }
.detail-summary span { color: var(--color-text-secondary); font-size: 12px; }
.detail-summary strong { margin-top: 6px; font-size: 18px; }
.message-list { display: flex; flex-direction: column; gap: 14px; }
.message-item { padding: 15px 16px; border: 1px solid var(--color-border); border-left: 3px solid #94a3b8; border-radius: 6px; background: #fff; }
.message-item.role-user { border-left-color: #6366f1; background: #fafaff; }
.message-item.role-assistant { border-left-color: #0ea5e9; }
.message-item header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.role-label { display: flex; align-items: center; gap: 7px; }
.message-item time { color: #94a3b8; font-size: 12px; white-space: nowrap; }
.message-item pre { margin: 13px 0; color: #334155; font-family: inherit; font-size: 14px; line-height: 1.7; overflow-wrap: anywhere; white-space: pre-wrap; }
.message-item footer { display: flex; flex-wrap: wrap; gap: 6px 14px; padding-top: 10px; border-top: 1px solid #eef2f7; color: #64748b; font-size: 12px; }
.message-item .error-code { color: var(--color-danger); }

@media (max-width: 1200px) {
  .metric-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 700px) {
  .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .metric-item { padding: 15px; }
  .detail-summary { grid-template-columns: repeat(2, 1fr); }
  .detail-summary div:nth-child(2) { border-right: 0; }
  .detail-summary div:nth-child(-n + 2) { border-bottom: 1px solid var(--color-border); }
  .message-item header { align-items: flex-start; flex-direction: column; }
}
</style>
