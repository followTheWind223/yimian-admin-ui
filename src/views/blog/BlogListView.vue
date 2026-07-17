<template>
  <div class="blog-list">
    <el-card class="search-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="关键词">
          <el-input
            v-model="query.keyword"
            placeholder="标题 / 摘要 / 正文"
            clearable
            style="width: 240px"
            @keyup.enter="fetchList"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 140px">
            <el-option label="草稿" :value="0" />
            <el-option label="已发布" :value="1" />
            <el-option label="审核中" :value="2" />
            <el-option label="已屏蔽" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchList">搜索</el-button>
          <el-button :icon="RefreshRight" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>博客管理</span>
          <span class="meta">共 {{ total }} 条</span>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="170" show-overflow-tooltip />
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column label="作者" min-width="150">
          <template #default="{ row }">
            <div class="author-cell">
              <el-avatar :size="28" :src="row.authorAvatar || undefined">{{ authorInitial(row) }}</el-avatar>
              <span>{{ row.authorName || `用户 ${row.authorId}` }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="话题" min-width="180">
          <template #default="{ row }">
            <el-tag
              v-for="topic in row.topics"
              :key="topic.id"
              size="small"
              :color="topic.color || undefined"
              effect="dark"
              class="topic-tag"
            >
              {{ topic.name }}
            </el-tag>
            <span v-if="!row.topics?.length" class="empty-text">未关联</span>
          </template>
        </el-table-column>
        <el-table-column label="数据" width="160" align="center">
          <template #default="{ row }">
            <div class="stats">
              <span>看 {{ row.viewCount || 0 }}</span>
              <span>赞 {{ row.likeCount || 0 }}</span>
              <span>评 {{ row.commentCount || 0 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="230" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
            <el-dropdown
              trigger="click"
              :disabled="statusLoadingId === row.id"
              @command="handleStatusCommand(row, $event)"
            >
              <el-button link type="success" size="small" :loading="statusLoadingId === row.id">
                状态<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :command="0">设为草稿</el-dropdown-item>
                  <el-dropdown-item :command="1">发布</el-dropdown-item>
                  <el-dropdown-item :command="2">设为审核中</el-dropdown-item>
                  <el-dropdown-item :command="3">屏蔽</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-popconfirm title="确定删除这篇博客吗？" @confirm="handleDelete(row.id)">
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

    <el-dialog v-model="detailVisible" title="博客详情" width="820px" top="5vh">
      <div v-if="detail" class="detail">
        <h2>{{ detail.title }}</h2>
        <div class="detail-meta">
          <el-tag :type="statusType(detail.status)" size="small">{{ statusLabel(detail.status) }}</el-tag>
          <span>{{ detail.authorName || `用户 ${detail.authorId}` }}</span>
          <span>{{ detail.createdAt }}</span>
        </div>
        <p v-if="detail.summary" class="summary">{{ detail.summary }}</p>
        <div v-if="detail.images?.length" class="image-list">
          <el-image
            v-for="image in detail.images"
            :key="image"
            :src="image"
            fit="cover"
            :preview-src-list="detail.images"
            preview-teleported
          />
        </div>
        <div class="markdown-body" v-html="renderedContent" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown, RefreshRight, Search } from '@element-plus/icons-vue'
import { marked } from 'marked'
import {
  deleteAdminBlogApi,
  getAdminBlogListApi,
  updateAdminBlogStatusApi,
} from '../../api'
import type { Blog, BlogQuery } from '../../types/api'

const query = reactive<BlogQuery>({ page: 1, size: 10 })
const list = ref<Blog[]>([])
const total = ref(0)
const loading = ref(false)
const statusLoadingId = ref<number | null>(null)

async function fetchList() {
  loading.value = true
  try {
    const res = await getAdminBlogListApi(query)
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

function statusLabel(status: number) {
  return status === 0 ? '草稿' : status === 1 ? '已发布' : status === 2 ? '审核中' : '已屏蔽'
}

function statusType(status: number) {
  return status === 1 ? 'success' : status === 2 ? 'warning' : status === 3 ? 'danger' : 'info'
}

function authorInitial(row: Blog) {
  return (row.authorName || String(row.authorId || '')).slice(0, 1)
}

async function handleStatusChange(row: Blog, status: number) {
  if (row.status === status) return
  statusLoadingId.value = row.id
  try {
    const res = await updateAdminBlogStatusApi(row.id, status)
    row.status = res.data.data?.status ?? status
    ElMessage.success('状态已更新')
  } finally {
    statusLoadingId.value = null
  }
}

function handleStatusCommand(row: Blog, status: string | number | object) {
  handleStatusChange(row, Number(status))
}

async function handleDelete(id: number) {
  await deleteAdminBlogApi(id)
  ElMessage.success('删除成功')
  await fetchList()
}

const detailVisible = ref(false)
const detail = ref<Blog | null>(null)

function openDetail(row: Blog) {
  detail.value = row
  detailVisible.value = true
}

const renderedContent = computed(() => {
  if (!detail.value?.content) return ''
  return marked(detail.value.content) as string
})

onMounted(fetchList)
</script>

<style scoped>
.search-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meta,
.empty-text {
  color: #909399;
  font-size: 13px;
}

.author-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topic-tag {
  margin: 0 4px 4px 0;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 8px;
  color: #606266;
  font-size: 12px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.detail h2 {
  margin: 0 0 10px;
  font-size: 22px;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #909399;
  font-size: 13px;
  margin-bottom: 14px;
}

.summary {
  color: #606266;
  background: #f5f7fa;
  border-radius: 6px;
  padding: 10px 12px;
}

.image-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  margin: 12px 0;
}

.image-list .el-image {
  width: 100%;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
}

.markdown-body {
  max-height: 58vh;
  overflow-y: auto;
  line-height: 1.8;
  color: #303133;
}

.markdown-body :deep(pre) {
  background: #282c34;
  color: #abb2bf;
  padding: 14px;
  border-radius: 6px;
  overflow-x: auto;
}

.markdown-body :deep(code) {
  background: #f0f2f5;
  padding: 2px 5px;
  border-radius: 4px;
}

.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}
</style>
