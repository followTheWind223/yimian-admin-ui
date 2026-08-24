<template>
  <div class="knowledge-audit">
    <el-card class="audit-switch-card">
      <div class="audit-switch-card__main">
        <div>
          <div class="audit-switch-card__label">题目审核策略</div>
          <div class="audit-switch-card__title">
            {{ auditEnabled ? '已开启审核' : '已关闭审核' }}
          </div>
          <p>
            {{ auditEnabled ? '用户提交题目后进入待审核列表，由管理员审核通过后公开。' : '用户提交题目后直接公开，不进入审核队列。' }}
          </p>
        </div>
        <el-switch
          v-model="auditEnabled"
          :loading="auditSwitchLoading"
          inline-prompt
          active-text="审核"
          inactive-text="直发"
          @change="handleAuditSwitchChange"
        />
      </div>
    </el-card>

    <!-- 搜索区域 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="标题/内容" clearable style="width: 200px" @keyup.enter="fetchList" />
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="query.difficulty" placeholder="全部" clearable style="width: 120px">
            <el-option label="简单" :value="1" />
            <el-option label="中等" :value="2" />
            <el-option label="困难" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchList">搜索</el-button>
          <el-button :icon="RefreshRight" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 题目列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>待审核题目</span>
          <span class="tip">共 {{ total }} 条待审核</span>
        </div>
      </template>
      <el-table :data="list" v-loading="loading" stripe @selection-change="onSelectionChange" ref="tableRef">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="题目" min-width="200" show-overflow-tooltip />
        <el-table-column label="难度" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="difficultyType(row.difficulty)" size="small">{{ difficultyLabel(row.difficulty) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitUserId" label="提交人ID" width="100" align="center" />
        <el-table-column label="标签" min-width="180">
          <template #default="{ row }">
            <el-tag v-for="t in row.tags" :key="t.id" size="small" :color="t.color" effect="dark" style="margin-right: 4px">
              {{ t.name }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="170" />
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showDetail(row)">详情</el-button>
            <el-button link type="success" size="small" @click="handleApprove(row)">通过</el-button>
            <el-button link type="danger" size="small" @click="openReject(row)">拒绝</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 批量操作 -->
      <div class="batch-bar" v-if="selectedIds.length > 0">
        <span class="batch-info">已选 {{ selectedIds.length }} 条</span>
        <el-button type="success" size="small" @click="batchApprove">批量通过</el-button>
        <el-button type="danger" size="small" @click="openBatchReject">批量拒绝</el-button>
      </div>

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

    <!-- 题目详情弹窗 -->
    <el-dialog v-model="detailVisible" title="题目详情" width="750px" top="5vh">
      <div class="detail-content" v-if="detail">
        <div class="detail-header">
          <h3>{{ detail.title }}</h3>
          <div class="detail-meta">
            <el-tag :type="difficultyType(detail.difficulty)" size="small">{{ difficultyLabel(detail.difficulty) }}</el-tag>
            <span>提交人ID: {{ detail.submitUserId }}</span>
            <span>提交时间: {{ detail.createdAt }}</span>
          </div>
          <div class="detail-tags" v-if="detail.tags?.length">
            <el-tag v-for="t in detail.tags" :key="t.id" size="small" :color="t.color" effect="dark">
              {{ t.name }}
            </el-tag>
          </div>
        </div>
        <div class="detail-body markdown-body" v-html="renderedContent" />
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="success" @click="detailVisible = false; handleApprove(detail!)">审核通过</el-button>
        <el-button type="danger" @click="detailVisible = false; openReject(detail!)">审核拒绝</el-button>
      </template>
    </el-dialog>

    <!-- 拒绝原因弹窗 -->
    <el-dialog v-model="rejectDialog.visible" title="审核拒绝" width="440px">
      <el-form :model="rejectDialog" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-input v-model="rejectDialog.remark" type="textarea" :rows="3" placeholder="请填写拒绝原因（500字内）" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialog.visible = false">取消</el-button>
        <el-button type="danger" :loading="rejectDialog.loading" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, RefreshRight } from '@element-plus/icons-vue'
import { marked } from 'marked'
import {
  getKnowledgePendingApi,
  approveKnowledgeApi,
  rejectKnowledgeApi,
  batchAuditApi,
  getKnowledgeAuditSwitchApi,
  setKnowledgeAuditSwitchApi,
} from '../../api'
import type { Knowledge, KnowledgeQuery } from '../../types/api'

const query = reactive<KnowledgeQuery>({ page: 1, size: 10 })
const list = ref<Knowledge[]>([])
const total = ref(0)
const loading = ref(false)
const selectedIds = ref<number[]>([])
const auditEnabled = ref(true)
const auditSwitchLoading = ref(false)

async function loadAuditSwitch() {
  try {
    const res = await getKnowledgeAuditSwitchApi()
    auditEnabled.value = res.data.data ?? true
  } catch {
    auditEnabled.value = true
  }
}

async function handleAuditSwitchChange(value: string | number | boolean) {
  const next = Boolean(value)
  const previous = !next
  auditSwitchLoading.value = true
  try {
    const res = await setKnowledgeAuditSwitchApi(next)
    auditEnabled.value = res.data.data ?? next
    ElMessage.success(auditEnabled.value ? '题目审核已开启' : '题目审核已关闭，提交后将直接公开')
  } catch {
    auditEnabled.value = previous
  } finally {
    auditSwitchLoading.value = false
  }
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getKnowledgePendingApi(query)
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
  query.difficulty = undefined
  fetchList()
}

function onSelectionChange(rows: Knowledge[]) {
  selectedIds.value = rows.map(r => r.id)
}

// 难度展示
function difficultyType(d: number) { return d === 1 ? 'success' : d === 2 ? 'warning' : 'danger' as const }
function difficultyLabel(d: number) { return d === 1 ? '简单' : d === 2 ? '中等' : '困难' }

// 审核通过
async function handleApprove(row: Knowledge) {
  try {
    await approveKnowledgeApi(row.id)
    ElMessage.success(`题目「${row.title}」已审核通过`)
    fetchList()
  } catch { /* handled by interceptor */ }
}

// 审核拒绝
const rejectDialog = reactive({ visible: false, loading: false, remark: '' })
const rejectTarget = ref<{ id: number; isBatch: boolean } | null>(null)

function openReject(row: Knowledge) {
  rejectTarget.value = { id: row.id, isBatch: false }
  rejectDialog.remark = ''
  rejectDialog.visible = true
}

async function confirmReject() {
  if (!rejectDialog.remark.trim()) {
    ElMessage.warning('请填写拒绝原因')
    return
  }
  rejectDialog.loading = true
  try {
    if (rejectTarget.value!.isBatch) {
      await batchAuditApi({ ids: selectedIds.value, approve: false, remark: rejectDialog.remark })
      ElMessage.success(`已批量拒绝 ${selectedIds.value.length} 条题目`)
    } else {
      await rejectKnowledgeApi(rejectTarget.value!.id, rejectDialog.remark)
      ElMessage.success('已拒绝该题目')
    }
    rejectDialog.visible = false
    fetchList()
  } catch { /* handled by interceptor */ }
  finally { rejectDialog.loading = false }
}

// 批量操作
async function batchApprove() {
  try {
    await batchAuditApi({ ids: selectedIds.value, approve: true })
    ElMessage.success(`已批量通过 ${selectedIds.value.length} 条题目`)
    fetchList()
  } catch { /* handled by interceptor */ }
}

function openBatchReject() {
  rejectTarget.value = { id: 0, isBatch: true }
  rejectDialog.remark = ''
  rejectDialog.visible = true
}

// 详情
const detailVisible = ref(false)
const detail = ref<Knowledge | null>(null)

function showDetail(row: Knowledge) {
  detail.value = row
  detailVisible.value = true
}

const renderedContent = computed(() => {
  if (!detail.value?.content) return ''
  return marked(detail.value.content) as string
})

onMounted(() => {
  loadAuditSwitch()
  fetchList()
})
</script>

<style scoped>
.audit-switch-card { margin-bottom: 16px; }
.audit-switch-card__main {
  min-height: 86px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}
.audit-switch-card__label {
  margin-bottom: 6px;
  color: #409eff;
  font-size: 13px;
  font-weight: 700;
}
.audit-switch-card__title {
  color: #1f2937;
  font-size: 20px;
  font-weight: 800;
}
.audit-switch-card p {
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 14px;
}
.search-card { margin-bottom: 16px; }
.table-card { }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.tip { font-size: 13px; color: #909399; }

.batch-bar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; margin-top: 12px;
  background: #f5f7fa; border-radius: 6px;
}
.batch-info { font-size: 14px; color: #606266; }

.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }

.detail-content { }
.detail-header { margin-bottom: 16px; }
.detail-header h3 { margin: 0 0 10px 0; font-size: 20px; }
.detail-meta { display: flex; align-items: center; gap: 16px; font-size: 13px; color: #909399; margin-bottom: 10px; }
.detail-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
.detail-body { padding: 16px; background: #f9fafb; border-radius: 6px; max-height: 55vh; overflow-y: auto; }

/* Markdown 渲染样式 */
.markdown-body { font-size: 14px; line-height: 1.8; color: #333; }
.markdown-body :deep(h2) { font-size: 18px; margin-top: 20px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
.markdown-body :deep(h3) { font-size: 16px; margin-top: 16px; }
.markdown-body :deep(code) { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 13px; }
.markdown-body :deep(pre) { background: #282c34; color: #abb2bf; padding: 16px; border-radius: 6px; overflow-x: auto; }
.markdown-body :deep(pre code) { background: transparent; padding: 0; color: inherit; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { padding-left: 20px; }
.markdown-body :deep(blockquote) { border-left: 3px solid #6366f1; padding: 4px 16px; margin: 12px 0; background: #f0f1ff; color: #555; }
.markdown-body :deep(table) { border-collapse: collapse; width: 100%; margin: 12px 0; }
.markdown-body :deep(th), .markdown-body :deep(td) { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
.markdown-body :deep(th) { background: #f5f7fa; }

@media (max-width: 720px) {
  .audit-switch-card__main {
    align-items: flex-start;
    flex-direction: column;
    gap: 14px;
  }
}
</style>
