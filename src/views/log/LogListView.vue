<template>
  <div class="log-list">
    <!-- 筛选区域 -->
    <el-card class="search-card">
      <el-form :inline="true" :model="query">
        <el-form-item label="操作人">
          <el-input v-model="query.username" placeholder="用户名" clearable style="width: 160px" />
        </el-form-item>
        <el-form-item label="模块">
          <el-select v-model="query.module" placeholder="全部" clearable style="width: 140px">
            <el-option
              v-for="m in modules"
              :key="m.code"
              :label="m.name"
              :value="m.code"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="结果">
          <el-select v-model="query.status" placeholder="全部" clearable style="width: 100px">
            <el-option label="成功" :value="1" />
            <el-option label="失败" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
            style="width: 250px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchList">搜索</el-button>
          <el-button :icon="RefreshRight" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志表格 -->
    <el-card class="table-card">
      <template #header>
        <span>操作日志</span>
      </template>
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="操作人" width="110" />
        <el-table-column prop="moduleName" label="模块" width="110">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.moduleName || row.module }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="operation" label="操作" min-width="120" />
        <el-table-column prop="description" label="详情" min-width="200" show-overflow-tooltip />
        <el-table-column prop="requestUri" label="请求路径" min-width="180" show-overflow-tooltip />
        <el-table-column label="结果" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="耗时" width="90" align="center">
          <template #default="{ row }">{{ row.duration }}ms</template>
        </el-table-column>
        <el-table-column prop="ip" label="IP" width="140" />
        <el-table-column prop="createdAt" label="时间" width="170" />
        <el-table-column label="详情" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showDetail(row)">查看</el-button>
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

    <!-- 日志详情弹窗 -->
    <el-dialog v-model="detailVisible" title="日志详情" width="700px">
      <el-descriptions :column="2" border size="small" v-if="detail">
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ detail.username || '-' }} (ID: {{ detail.userId ?? '-' }})</el-descriptions-item>
        <el-descriptions-item label="模块">{{ detail.moduleName || detail.module }}</el-descriptions-item>
        <el-descriptions-item label="操作">{{ detail.operation }}</el-descriptions-item>
        <el-descriptions-item label="HTTP 方法">{{ detail.method }}</el-descriptions-item>
        <el-descriptions-item label="请求路径" :span="1">{{ detail.requestUri }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ detail.ip || '-' }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detail.duration }}ms</el-descriptions-item>
        <el-descriptions-item label="结果">
          <el-tag :type="detail.status === 1 ? 'success' : 'danger'" size="small">
            {{ detail.status === 1 ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="HTTP 状态码">{{ detail.responseCode ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="业务码">{{ detail.resultCode ?? '-' }}</el-descriptions-item>
        <el-descriptions-item label="业务消息">{{ detail.resultMsg || '-' }}</el-descriptions-item>
        <el-descriptions-item label="时间" :span="2">{{ detail.createdAt }}</el-descriptions-item>
        <el-descriptions-item label="类方法" :span="2">
          <span class="mono">{{ detail.classMethod || '-' }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <div class="json-block">{{ formatJson(detail.requestParams) }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="异常信息" :span="2" v-if="detail.errorMsg">
          <div class="error-msg">{{ detail.errorMsg }}</div>
        </el-descriptions-item>
        <el-descriptions-item label="User-Agent" :span="2">
          <span class="mono small">{{ detail.userAgent || '-' }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, watch } from 'vue'
import { Search, RefreshRight } from '@element-plus/icons-vue'
import { getLogListApi, getLogModuleEnabledApi } from '../../api'
import type { OperationLog, LogQuery, LogModule } from '../../types/api'

const query = reactive<LogQuery>({ page: 1, size: 10 })
const dateRange = ref<string[] | null>(null)
const list = ref<OperationLog[]>([])
const total = ref(0)
const loading = ref(false)
const modules = ref<LogModule[]>([])

async function loadModules() {
  try {
    const res = await getLogModuleEnabledApi()
    modules.value = res.data.data || []
  } catch { /* ignore */ }
}

// 日期范围变化时同步到 query
watch(dateRange, (val) => {
  query.startDate = val?.[0]
  query.endDate = val?.[1]
})

async function fetchList() {
  loading.value = true
  try {
    const res = await getLogListApi(query)
    const data = res.data.data
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}
function resetQuery() {
  query.page = 1
  query.username = ''
  query.module = ''
  query.status = undefined
  dateRange.value = null
  fetchList()
}

// 详情
const detailVisible = ref(false)
const detail = ref<OperationLog | null>(null)
function showDetail(row: OperationLog) {
  detail.value = row
  detailVisible.value = true
}
function formatJson(str: string | null) {
  if (!str) return '-'
  try {
    return JSON.stringify(JSON.parse(str), null, 2)
  } catch {
    return str
  }
}

onMounted(() => { fetchList(); loadModules() })
</script>

<style scoped>
.search-card { margin-bottom: 16px; }
.table-card { }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
.mono { font-family: ui-monospace, Consolas, monospace; font-size: 13px; }
.small { font-size: 12px; color: #909399; word-break: break-all; }
.json-block { background: #f5f7fa; padding: 12px; border-radius: 4px; font-family: ui-monospace, Consolas, monospace; font-size: 13px; white-space: pre-wrap; max-height: 300px; overflow: auto; }
.error-msg { color: #f56c6c; background: #fef0f0; padding: 8px 12px; border-radius: 4px; font-size: 13px; word-break: break-all; }
</style>
