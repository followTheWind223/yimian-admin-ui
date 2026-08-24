<template>
  <div class="announcement-page">
    <el-card class="publish-card">
      <template #header>
        <div class="card-header">
          <span>发布系统公告</span>
          <el-tag type="warning" effect="plain">重要公告会弹窗提醒用户</el-tag>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="公告标题" prop="title">
          <el-input v-model="form.title" maxlength="120" show-word-limit placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="公告内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="5"
            maxlength="2000"
            show-word-limit
            placeholder="请输入要通知给用户的内容"
          />
        </el-form-item>
        <div class="form-actions">
          <el-checkbox v-model="form.important">重要消息，用户进入页面时弹窗告知</el-checkbox>
          <el-button type="primary" :loading="publishing" @click="publish">发布公告</el-button>
        </div>
      </el-form>
    </el-card>

    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>发布记录</span>
          <div class="filters">
            <el-input v-model="query.keyword" clearable placeholder="搜索标题或内容" style="width: 220px" @keyup.enter="fetchList" />
            <el-select v-model="query.important" clearable placeholder="类型" style="width: 130px" @change="fetchList">
              <el-option label="重要" :value="true" />
              <el-option label="普通" :value="false" />
            </el-select>
            <el-button :icon="Search" type="primary" @click="fetchList">搜索</el-button>
          </div>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" min-width="220" show-overflow-tooltip />
        <el-table-column prop="content" label="内容" min-width="320" show-overflow-tooltip />
        <el-table-column label="类型" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.important ? 'danger' : 'info'" size="small">
              {{ row.important ? '重要' : '普通' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creatorName" label="发布人" width="130" />
        <el-table-column prop="createdAt" label="发布时间" width="170" />
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getSystemAnnouncementListApi, publishSystemAnnouncementApi } from '../../api'
import type {
  SystemAnnouncement,
  SystemAnnouncementCreateParams,
  SystemAnnouncementQuery,
} from '../../types/api'

const formRef = ref<FormInstance>()
const publishing = ref(false)
const loading = ref(false)
const list = ref<SystemAnnouncement[]>([])
const total = ref(0)

const form = reactive<SystemAnnouncementCreateParams>({
  title: '',
  content: '',
  important: false,
})

const query = reactive<SystemAnnouncementQuery>({
  page: 1,
  size: 10,
})

const rules: FormRules<SystemAnnouncementCreateParams> = {
  title: [
    { required: true, message: '请输入公告标题', trigger: 'blur' },
    { max: 120, message: '公告标题最长120字', trigger: 'blur' },
  ],
  content: [
    { required: true, message: '请输入公告内容', trigger: 'blur' },
    { max: 2000, message: '公告内容最长2000字', trigger: 'blur' },
  ],
}

async function publish() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  publishing.value = true
  try {
    await publishSystemAnnouncementApi({
      title: form.title.trim(),
      content: form.content.trim(),
      important: form.important,
    })
    ElMessage.success('系统公告已发布')
    form.title = ''
    form.content = ''
    form.important = false
    query.page = 1
    await fetchList()
  } finally {
    publishing.value = false
  }
}

async function fetchList() {
  loading.value = true
  try {
    const res = await getSystemAnnouncementListApi(query)
    const data = res.data.data
    list.value = data.list || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

onMounted(fetchList)
</script>

<style scoped>
.announcement-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card-header,
.filters,
.form-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.form-actions {
  margin-top: 4px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
