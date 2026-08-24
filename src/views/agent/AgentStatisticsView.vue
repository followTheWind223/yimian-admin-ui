<template>
  <div class="statistics-page">
    <section class="page-heading">
      <div>
        <h1>AI 统计</h1>
        <p>跟踪小易的 Token、成本、延迟和模型使用情况。</p>
      </div>
      <div class="heading-actions">
        <el-segmented v-model="period" :options="periodOptions" @change="fetchAnalytics" />
        <el-button :icon="Refresh" :loading="loading" circle title="刷新统计" @click="fetchAnalytics" />
      </div>
    </section>

    <section class="metric-grid" v-loading="loading">
      <article class="metric-item metric-primary">
        <span>Token 用量</span>
        <strong>{{ formatNumber(analytics.summary.totalTokens) }}</strong>
        <small>输入 {{ formatNumber(analytics.summary.inputTokens) }} / 输出 {{ formatNumber(analytics.summary.outputTokens) }}</small>
      </article>
      <article class="metric-item">
        <span>产生会话</span>
        <strong>{{ formatNumber(analytics.summary.sessionCount) }}</strong>
        <small>{{ periodLabel }}内有消息的会话</small>
      </article>
      <article class="metric-item">
        <span>活跃用户</span>
        <strong>{{ formatNumber(analytics.summary.activeUserCount) }}</strong>
        <small>按产生消息的用户去重</small>
      </article>
      <article class="metric-item">
        <span>消息数量</span>
        <strong>{{ formatNumber(analytics.summary.messageCount) }}</strong>
        <small>其中估算 {{ formatNumber(analytics.summary.estimatedMessageCount) }} 条</small>
      </article>
      <article class="metric-item">
        <span>平均延迟</span>
        <strong>{{ formatDuration(analytics.summary.averageLatencyMs) }}</strong>
        <small>仅统计已记录延迟的消息</small>
      </article>
      <article class="metric-item">
        <span>模型成本</span>
        <strong>${{ formatCost(analytics.summary.totalCostUsd) }}</strong>
        <small>按上游已记录用量</small>
      </article>
    </section>

    <section class="chart-grid">
      <article class="chart-panel trend-panel">
        <header class="panel-heading">
          <div>
            <h2>Token 使用趋势</h2>
            <p>{{ analytics.granularity === 'hour' ? '按小时' : '按天' }}展示输入、输出、推理和缓存 Token</p>
          </div>
          <span>{{ rangeLabel }}</span>
        </header>
        <div ref="trendElement" class="chart chart-wide" role="img" aria-label="Token 使用趋势图" />
      </article>

      <article class="chart-panel composition-panel">
        <header class="panel-heading">
          <div>
            <h2>Token 构成</h2>
            <p>周期内不同类型用量占比</p>
          </div>
        </header>
        <div ref="compositionElement" class="chart chart-compact" role="img" aria-label="Token 构成图" />
      </article>
    </section>

    <section class="chart-grid lower-grid">
      <article class="chart-panel model-panel">
        <header class="panel-heading">
          <div>
            <h2>模型用量排行</h2>
            <p>按 Token 总量排序，最多展示 8 个模型</p>
          </div>
        </header>
        <div ref="modelElement" class="chart chart-model" role="img" aria-label="模型 Token 用量排行图" />
      </article>

      <article class="chart-panel type-panel">
        <header class="panel-heading">
          <div>
            <h2>会话类型分布</h2>
            <p>正式记忆与快捷会话的资源占用</p>
          </div>
        </header>
        <div v-if="analytics.sessionTypeUsage.length" class="type-list">
          <div v-for="item in analytics.sessionTypeUsage" :key="item.sessionType" class="type-row">
            <div class="type-row-heading">
              <strong>{{ sessionTypeLabel(item.sessionType) }}</strong>
              <span>{{ formatNumber(item.totalTokens) }} Token</span>
            </div>
            <div class="usage-track">
              <span :style="{ width: `${sessionTypePercent(item.totalTokens)}%` }" />
            </div>
            <div class="type-meta">
              <span>{{ formatNumber(item.sessionCount) }} 个会话</span>
              <span>{{ formatNumber(item.messageCount) }} 条消息</span>
              <span>${{ formatCost(item.totalCostUsd) }}</span>
            </div>
          </div>
        </div>
        <el-empty v-else :image-size="72" description="该周期暂无会话用量" />
      </article>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import { BarChart, LineChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from 'echarts/components'
import { init, use, type ECharts } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { getAgentUsageAnalyticsApi } from '../../api'
import type {
  AgentStatisticsPeriod,
  AgentUsageAnalytics,
  AgentUsageSummary,
} from '../../types/api'

use([BarChart, LineChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

const emptySummary: AgentUsageSummary = {
  sessionCount: 0,
  activeUserCount: 0,
  messageCount: 0,
  inputTokens: 0,
  outputTokens: 0,
  reasoningTokens: 0,
  cachedInputTokens: 0,
  totalTokens: 0,
  estimatedMessageCount: 0,
  totalCostUsd: 0,
  averageLatencyMs: 0,
}

const emptyAnalytics: AgentUsageAnalytics = {
  days: 7,
  granularity: 'day',
  startAt: '',
  endAt: '',
  summary: { ...emptySummary },
  tokenTrend: [],
  modelUsage: [],
  sessionTypeUsage: [],
}

const periodOptions = [
  { label: '近 1 天', value: 1 },
  { label: '近 7 天', value: 7 },
  { label: '近 30 天', value: 30 },
]
const period = ref<AgentStatisticsPeriod>(7)
const loading = ref(false)
const analytics = reactive<AgentUsageAnalytics>({ ...emptyAnalytics, summary: { ...emptySummary } })
const trendElement = ref<HTMLElement>()
const compositionElement = ref<HTMLElement>()
const modelElement = ref<HTMLElement>()
let trendChart: ECharts | undefined
let compositionChart: ECharts | undefined
let modelChart: ECharts | undefined
let resizeObserver: ResizeObserver | undefined

const periodLabel = computed(() => `近 ${period.value} 天`)
const rangeLabel = computed(() => {
  if (!analytics.startAt || !analytics.endAt) return periodLabel.value
  return `${formatRangeDate(analytics.startAt)} - ${formatRangeDate(analytics.endAt)}`
})
const maxSessionTypeTokens = computed(() => Math.max(
  ...analytics.sessionTypeUsage.map((item) => item.totalTokens),
  1,
))

async function fetchAnalytics() {
  loading.value = true
  try {
    const response = await getAgentUsageAnalyticsApi(period.value)
    Object.assign(analytics, response.data.data)
    analytics.summary = response.data.data.summary || { ...emptySummary }
    analytics.tokenTrend = response.data.data.tokenTrend || []
    analytics.modelUsage = response.data.data.modelUsage || []
    analytics.sessionTypeUsage = response.data.data.sessionTypeUsage || []
  } catch {
    Object.assign(analytics, emptyAnalytics, {
      days: period.value,
      summary: { ...emptySummary },
      tokenTrend: [],
      modelUsage: [],
      sessionTypeUsage: [],
    })
  } finally {
    loading.value = false
    await nextTick()
    renderCharts()
  }
}

function renderCharts() {
  if (trendElement.value) trendChart ||= init(trendElement.value)
  if (compositionElement.value) compositionChart ||= init(compositionElement.value)
  if (modelElement.value) modelChart ||= init(modelElement.value)

  const labels = analytics.tokenTrend.map((item) => formatBucket(item.bucketStart))
  trendChart?.setOption({
    animationDuration: 280,
    color: ['#2563eb', '#0ea5e9', '#8b5cf6', '#f59e0b'],
    tooltip: { trigger: 'axis', valueFormatter: (value: unknown) => formatNumber(Number(value || 0)) },
    legend: { top: 0, right: 4, itemWidth: 10, itemHeight: 10, textStyle: { color: '#64748b' } },
    grid: { left: 18, right: 18, top: 48, bottom: 10, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: '#dbe3ee' } },
      axisTick: { show: false },
      axisLabel: { color: '#8492a6', hideOverlap: true },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#edf1f7' } },
      axisLabel: { color: '#8492a6', formatter: (value: number) => compactNumber(value) },
    },
    series: [
      lineSeries('输入', analytics.tokenTrend.map((item) => item.inputTokens)),
      lineSeries('输出', analytics.tokenTrend.map((item) => item.outputTokens)),
      lineSeries('推理', analytics.tokenTrend.map((item) => item.reasoningTokens)),
      lineSeries('缓存', analytics.tokenTrend.map((item) => item.cachedInputTokens)),
    ],
  }, true)

  const compositionData = [
    { name: '输入', value: analytics.summary.inputTokens },
    { name: '输出', value: analytics.summary.outputTokens },
    { name: '推理', value: analytics.summary.reasoningTokens },
    { name: '缓存', value: analytics.summary.cachedInputTokens },
  ]
  compositionChart?.setOption({
    animationDuration: 280,
    color: ['#2563eb', '#0ea5e9', '#8b5cf6', '#f59e0b'],
    tooltip: { trigger: 'item', valueFormatter: (value: unknown) => `${formatNumber(Number(value || 0))} Token` },
    legend: { bottom: 0, left: 'center', itemWidth: 10, itemHeight: 10, textStyle: { color: '#64748b' } },
    series: [{
      type: 'pie',
      radius: ['54%', '76%'],
      center: ['50%', '44%'],
      avoidLabelOverlap: true,
      itemStyle: { borderColor: '#fff', borderWidth: 3 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 600 } },
      data: compositionData,
    }],
  }, true)

  const models = [...analytics.modelUsage].reverse()
  modelChart?.setOption({
    animationDuration: 280,
    color: ['#0ea5e9'],
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value: unknown) => `${formatNumber(Number(value || 0))} Token` },
    grid: { left: 10, right: 22, top: 12, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: '#edf1f7' } },
      axisLabel: { color: '#8492a6', formatter: (value: number) => compactNumber(value) },
    },
    yAxis: {
      type: 'category',
      data: models.map((item) => item.modelName || '未记录'),
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: '#475569', width: 120, overflow: 'truncate' },
    },
    series: [{
      type: 'bar',
      barMaxWidth: 20,
      data: models.map((item) => item.totalTokens),
      itemStyle: { borderRadius: [0, 3, 3, 0] },
    }],
  }, true)
}

function lineSeries(name: string, data: number[]) {
  return {
    name,
    type: 'line' as const,
    data,
    smooth: true,
    showSymbol: false,
    symbolSize: 7,
    lineStyle: { width: 2 },
    emphasis: { focus: 'series' as const },
  }
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('zh-CN').format(Number(value || 0))
}

function compactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m`
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`
  return String(value)
}

function formatCost(value: number | null | undefined) {
  return Number(value || 0).toFixed(6)
}

function formatDuration(value: number | null | undefined) {
  const duration = Number(value || 0)
  return duration >= 1000 ? `${(duration / 1000).toFixed(2)} s` : `${Math.round(duration)} ms`
}

function formatRangeDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

function formatBucket(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  if (analytics.granularity === 'hour') {
    return `${String(date.getHours()).padStart(2, '0')}:00`
  }
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function sessionTypeLabel(type: string) {
  return type === 'quick' ? '快捷会话' : type === 'support' ? '用户会话' : type
}

function sessionTypePercent(tokens: number) {
  return Math.max(2, Math.round((tokens / maxSessionTypeTokens.value) * 100))
}

onMounted(() => {
  fetchAnalytics()
  resizeObserver = new ResizeObserver(() => {
    trendChart?.resize()
    compositionChart?.resize()
    modelChart?.resize()
  })
  ;[trendElement.value, compositionElement.value, modelElement.value].forEach((element) => {
    if (element) resizeObserver?.observe(element)
  })
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  trendChart?.dispose()
  compositionChart?.dispose()
  modelChart?.dispose()
})
</script>

<style scoped>
.statistics-page { max-width: 1500px; margin: 0 auto; }
.page-heading { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 18px; }
.page-heading h1 { font-size: 24px; line-height: 1.25; }
.page-heading p { margin-top: 6px; color: var(--color-text-secondary); font-size: 14px; }
.heading-actions { display: flex; align-items: center; gap: 10px; }
.metric-grid { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 12px; min-height: 116px; margin-bottom: 16px; }
.metric-item { min-width: 0; padding: 18px; background: #fff; border: 1px solid var(--color-border); border-radius: 8px; }
.metric-item > span { display: block; color: var(--color-text-secondary); font-size: 13px; }
.metric-item strong { display: block; margin: 10px 0 7px; overflow: hidden; color: #172033; font-size: 25px; font-variant-numeric: tabular-nums; line-height: 1; text-overflow: ellipsis; white-space: nowrap; }
.metric-item small { display: block; overflow: hidden; color: #94a3b8; font-size: 12px; line-height: 1.45; text-overflow: ellipsis; white-space: nowrap; }
.metric-primary { border-color: rgba(37, 99, 235, 0.32); box-shadow: inset 3px 0 #2563eb; }
.chart-grid { display: grid; grid-template-columns: minmax(0, 2fr) minmax(320px, 0.8fr); gap: 16px; margin-bottom: 16px; }
.lower-grid { grid-template-columns: minmax(0, 1.4fr) minmax(340px, 0.8fr); }
.chart-panel { min-width: 0; padding: 20px; background: #fff; border: 1px solid var(--color-border); border-radius: 8px; }
.panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; }
.panel-heading h2 { color: #172033; font-size: 16px; line-height: 1.35; }
.panel-heading p, .panel-heading > span { margin-top: 5px; color: #94a3b8; font-size: 12px; }
.panel-heading > span { white-space: nowrap; }
.chart { width: 100%; }
.chart-wide { height: 330px; }
.chart-compact { height: 330px; }
.chart-model { height: 286px; }
.type-list { display: flex; flex-direction: column; gap: 24px; margin-top: 28px; }
.type-row-heading, .type-meta { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.type-row-heading strong { color: #334155; font-size: 14px; }
.type-row-heading span { color: #2563eb; font-size: 13px; font-variant-numeric: tabular-nums; }
.usage-track { height: 7px; margin: 10px 0 8px; overflow: hidden; background: #edf2f7; border-radius: 3px; }
.usage-track span { display: block; height: 100%; background: #0ea5e9; border-radius: 3px; transition: width 0.25s ease; }
.type-meta { justify-content: flex-start; color: #94a3b8; font-size: 12px; }

@media (max-width: 1280px) {
  .metric-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 960px) {
  .chart-grid, .lower-grid { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .page-heading { align-items: flex-start; flex-direction: column; }
  .heading-actions { width: 100%; justify-content: space-between; }
  .metric-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .metric-item { padding: 15px; }
  .chart-panel { padding: 16px; }
  .chart-wide, .chart-compact { height: 300px; }
  .panel-heading { flex-direction: column; }
}
</style>
