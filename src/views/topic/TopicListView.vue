<template>
  <div class="topic-list">
    <el-card class="search-card">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input
            v-model="searchForm.keyword"
            placeholder="话题名称"
            clearable
            style="width: 220px"
            @keyup.enter="fetchList"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="fetchList">搜索</el-button>
          <el-button :icon="RefreshRight" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>话题管理</span>
          <el-button type="primary" :icon="Plus" @click="openCreate">新增话题</el-button>
        </div>
      </template>

      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="170" show-overflow-tooltip />
        <el-table-column prop="name" label="话题名称" min-width="180">
          <template #default="{ row }">
            <span class="topic-name">
              <span class="color-dot" :style="{ background: row.color || '#6366f1' }" />
              {{ row.name }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="220" show-overflow-tooltip />
        <el-table-column label="颜色" width="130" align="center">
          <template #default="{ row }">
            <el-tag :color="row.color || '#6366f1'" effect="dark" size="small">
              {{ row.color || '#6366f1' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="90" align="center" />
        <el-table-column prop="blogCount" label="博客数" width="100" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除这个话题吗？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑话题' : '新增话题'" width="480px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="82px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：Java 面试" maxlength="50" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="颜色">
          <div class="color-row">
            <el-color-picker v-model="form.color" />
            <el-input v-model="form.color" placeholder="#6366f1" />
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.loading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, RefreshRight, Search } from '@element-plus/icons-vue'
import { createTopicApi, deleteTopicApi, getTopicListApi, updateTopicApi } from '../../api'
import type { Topic, TopicParams } from '../../types/api'

const searchForm = reactive({ keyword: '' })
const list = ref<Topic[]>([])
const loading = ref(false)

async function fetchList() {
  loading.value = true
  try {
    const res = await getTopicListApi(searchForm.keyword || undefined)
    list.value = res.data.data || []
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  searchForm.keyword = ''
  fetchList()
}

const dialog = reactive({ visible: false, isEdit: false, loading: false })
const formRef = ref<FormInstance>()
const editId = ref<number | null>(null)
const form = reactive<TopicParams>({ name: '', description: '', color: '#6366f1', sort: 0 })
const formRules: FormRules = {
  name: [{ required: true, message: '请输入话题名称', trigger: 'blur' }],
}

function resetForm() {
  formRef.value?.resetFields()
  Object.assign(form, { name: '', description: '', color: '#6366f1', sort: 0 })
  editId.value = null
}

function openCreate() {
  dialog.isEdit = false
  resetForm()
  dialog.visible = true
}

function openEdit(row: Topic) {
  dialog.isEdit = true
  editId.value = row.id
  Object.assign(form, {
    name: row.name,
    description: row.description || '',
    color: row.color || '#6366f1',
    sort: row.sort || 0,
  })
  dialog.visible = true
}

async function submitForm() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  dialog.loading = true
  try {
    const payload: TopicParams = {
      name: form.name.trim(),
      description: form.description?.trim() || undefined,
      color: form.color?.trim() || undefined,
      sort: form.sort,
    }
    if (dialog.isEdit && editId.value) {
      await updateTopicApi(editId.value, payload)
      ElMessage.success('话题已更新')
    } else {
      await createTopicApi(payload)
      ElMessage.success('话题已创建')
    }
    dialog.visible = false
    await fetchList()
  } finally {
    dialog.loading = false
  }
}

async function handleDelete(id: number) {
  await deleteTopicApi(id)
  ElMessage.success('删除成功')
  await fetchList()
}

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

.topic-name {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex: 0 0 auto;
}

.color-row {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  width: 100%;
}
</style>
