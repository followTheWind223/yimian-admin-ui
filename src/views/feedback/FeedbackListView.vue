<template>
  <div class="feedback-list">
    <el-card class="search-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="标题、内容或用户名" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 130px">
            <el-option v-for="item in statusOptions" :key="item.value" :label="item.label" :value="item.value" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchList">搜索</el-button>
          <el-button :icon="RefreshRight" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <span>反馈管理</span>
      </template>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="180" show-overflow-tooltip />
        <el-table-column prop="title" label="问题标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="username" label="反馈用户" width="120" />
        <el-table-column prop="pageUrl" label="问题所在" min-width="220" show-overflow-tooltip />
        <el-table-column label="状态" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="statusMeta(row.status).type" size="small">{{ statusMeta(row.status).label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="提交时间" width="170" />
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showDetail(row)">查看</el-button>
            <el-dropdown trigger="click" @command="(status: number) => changeStatus(row, status)">
              <el-button link type="primary" size="small">改状态</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="item in statusOptions" :key="item.value" :command="item.value">
                    {{ item.label }}
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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

    <el-dialog v-model="detailVisible" title="反馈详情" width="720px">
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMeta(detail.status).type" size="small">{{ statusMeta(detail.status).label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="反馈用户">{{ detail.username }} (ID: {{ detail.userId }})</el-descriptions-item>
        <el-descriptions-item label="联系方式">{{ detail.contact || '-' }}</el-descriptions-item>
        <el-descriptions-item label="问题标题" :span="2">{{ detail.title }}</el-descriptions-item>
        <el-descriptions-item label="问题所在" :span="2">
          <span class="breakable">{{ detail.pageUrl || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="提交时间">{{ detail.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ detail.updatedAt }}</el-descriptions-item>
        <el-descriptions-item label="问题描述" :span="2">
          <div class="content-block">{{ detail.content }}</div>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { RefreshRight, Search } from '@element-plus/icons-vue'
import { getBugFeedbackDetailApi, getBugFeedbackListApi, updateBugFeedbackStatusApi } from '../../api'
import type { BugFeedback, BugFeedbackQuery } from '../../types/api'

const statusOptions = [
  { label: '待处理', value: 0, type: 'warning' },
  { label: '处理中', value: 1, type: 'primary' },
  { label: '已解决', value: 2, type: 'success' },
  { label: '已忽略', value: 3, type: 'info' },
] as const

const query = reactive<BugFeedbackQuery>({ page: 1, size: 10 })
const list = ref<BugFeedback[]>([])
const total = ref(0)
const loading = ref(false)
const detailVisible = ref(false)
const detail = ref<BugFeedback | null>(null)

function statusMeta(status: number) {
  return statusOptions.find((item) => item.value === status) || statusOptions[0]
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getBugFeedbackListApi(query)
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
  query.status = undefined
  fetchList()
}

async function showDetail(row: BugFeedback) {
  const res = await getBugFeedbackDetailApi(row.id)
  detail.value = res.data.data
  detailVisible.value = true
}

async function changeStatus(row: BugFeedback, status: number) {
  await updateBugFeedbackStatusApi(row.id, status)
  ElMessage.success('反馈状态已更新')
  if (detail.value && String(detail.value.id) === String(row.id)) {
    detail.value.status = status as BugFeedback['status']
  }
  await fetchList()
}

onMounted(fetchList)
</script>

<style scoped>
.search-card {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.breakable {
  word-break: break-all;
}

.content-block {
  min-height: 120px;
  max-height: 320px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.7;
  background: #f5f7fa;
  border-radius: 4px;
  padding: 12px;
}
</style>
