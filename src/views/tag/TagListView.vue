<template>
  <div class="tag-list">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>标签管理</span>
          <el-button type="primary" :icon="Plus" @click="openCreate">新增标签</el-button>
        </div>
      </template>
      <el-table :data="list" v-loading="loading" stripe border>
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="name" label="标签名称" min-width="160">
          <template #default="{ row }">
            <span :style="{ display:'inline-block', width:10, height:10, borderRadius:'50%', background: row.color, marginRight:8 }"></span>
            {{ row.name }}
          </template>
        </el-table-column>
        <el-table-column prop="color" label="颜色代码" width="130" align="center">
          <template #default="{ row }">
            <el-tag :color="row.color" size="small" effect="dark">{{ row.color }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column prop="usageCount" label="题目数" width="80" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="170" />
        <el-table-column label="操作" width="180" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除？关联数据也会一并清理" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button link type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑标签' : '新增标签'" width="440px" @closed="resetForm">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如 Java" maxlength="50" />
        </el-form-item>
        <el-form-item label="颜色" prop="color">
          <el-input v-model="form.color" placeholder="#e74c3c">
            <template #prefix>
              <span :style="{ display:'inline-block', width:14, height:14, borderRadius:'50%', background: form.color, border:'1px solid #ddd', verticalAlign:'middle' }"></span>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getTagListApi, createTagApi, updateTagApi, deleteTagApi } from '../../api'
import type { Tag } from '../../api/tag'

const list = ref<Tag[]>([])
const loading = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const dialog = reactive({ visible: false, isEdit: false })
const editId = ref<number | null>(null)
const form = reactive({ name: '', color: '#6366f1', sort: 0 })

const formRules: FormRules = {
  name: [{ required: true, message: '请输入标签名称', trigger: 'blur' }],
  color: [{ required: true, message: '请输入颜色值', trigger: 'blur' }],
}

async function loadList() {
  loading.value = true
  try {
    const res = await getTagListApi()
    list.value = res.data.data || []
  } catch { ElMessage.error('加载标签列表失败') }
  finally { loading.value = false }
}

function openCreate() {
  dialog.visible = true; dialog.isEdit = false; editId.value = null
  form.name = ''; form.color = '#6366f1'; form.sort = 0
}
function openEdit(row: Tag) {
  dialog.visible = true; dialog.isEdit = true; editId.value = row.id
  form.name = row.name; form.color = row.color; form.sort = row.sort
}
function resetForm() { formRef.value?.resetFields() }

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = { name: form.name, color: form.color, sort: form.sort }
    if (dialog.isEdit && editId.value) {
      await updateTagApi(editId.value, payload)
      ElMessage.success('标签已更新')
    } else {
      await createTagApi(payload)
      ElMessage.success('标签已创建')
    }
    dialog.visible = false
    await loadList()
  } catch { ElMessage.error('操作失败') }
  finally { saving.value = false }
}

async function handleDelete(id: number) {
  try {
    await deleteTagApi(id)
    ElMessage.success('标签已删除')
    await loadList()
  } catch { ElMessage.error('删除失败') }
}

onMounted(loadList)
</script>
