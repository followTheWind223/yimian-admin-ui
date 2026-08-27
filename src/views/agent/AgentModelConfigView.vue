<template>
  <div class="model-config-page">
    <div class="page-heading">
      <div>
        <h1>AI 模型配置</h1>
        <p>管理模型供应商、API Key 和可用模型。</p>
      </div>
      <el-button :icon="Refresh" @click="loadAll" :loading="loading">刷新</el-button>
    </div>

    <el-tabs v-model="activeTab" class="config-tabs">
      <el-tab-pane label="供应商与 API Key" name="providers">
        <el-card shadow="never" class="config-card">
          <template #header>
            <div class="card-header">
              <div>
                <strong>模型供应商</strong>
                <span>API Key 仅保存为加密密文，列表只显示掩码。</span>
              </div>
              <el-button v-if="canManage" type="primary" :icon="Plus" @click="openProviderDialog()">新增供应商</el-button>
            </div>
          </template>
          <el-table :data="providers" v-loading="loading" stripe>
            <el-table-column prop="displayName" label="供应商" min-width="150">
              <template #default="{ row }">
                <div class="provider-name">{{ row.displayName }}</div>
                <code>{{ row.providerCode }}</code>
              </template>
            </el-table-column>
            <el-table-column prop="protocolType" label="协议" width="160" />
            <el-table-column prop="baseUrl" label="Base URL" min-width="240" show-overflow-tooltip />
            <el-table-column label="API Key" width="180">
              <template #default="{ row }">
                <el-tag :type="row.credentialConfigured ? 'success' : 'danger'" effect="plain">
                  {{ row.credentialConfigured ? row.credentialMasked || '已配置' : '未配置' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="连通性" width="150">
              <template #default="{ row }">
                <el-tag v-if="row.lastTestStatus === 'success'" type="success" effect="plain">连接成功</el-tag>
                <el-tag v-else-if="row.lastTestStatus === 'failed'" type="danger" effect="plain">连接失败</el-tag>
                <span v-else class="muted">未测试</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="plain">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="190" fixed="right">
              <template #default="{ row }">
                <el-button v-if="canManage" link type="primary" :loading="testingId === row.id" @click="testProvider(row)">测试连接</el-button>
                <el-button v-if="canManage" link type="primary" @click="openProviderDialog(row)">编辑</el-button>
              </template>
            </el-table-column>
            <template #empty><el-empty description="暂无供应商配置" /></template>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="模型部署" name="models">
        <el-card shadow="never" class="config-card">
          <template #header>
            <div class="card-header">
              <div>
                <strong>模型部署</strong>
                <span>同一供应商可以配置多个模型，后续可绑定到不同小易 profile。</span>
              </div>
              <el-button v-if="canManage" type="primary" :icon="Plus" :disabled="!providers.length" @click="openModelDialog()">新增模型</el-button>
            </div>
          </template>
          <el-table :data="models" v-loading="loading" stripe>
            <el-table-column label="模型" min-width="180">
              <template #default="{ row }">
                <div class="provider-name">{{ row.displayName }}</div>
                <code>{{ row.modelCode }}</code>
              </template>
            </el-table-column>
            <el-table-column label="供应商" min-width="150">
              <template #default="{ row }">{{ row.providerDisplayName }}<code class="inline-code">{{ row.providerCode }}</code></template>
            </el-table-column>
            <el-table-column prop="upstreamModelName" label="上游模型" min-width="180" show-overflow-tooltip />
            <el-table-column prop="modelType" label="类型" width="100" />
            <el-table-column label="上下文 / 最大输出" width="160">
              <template #default="{ row }">{{ row.contextWindow.toLocaleString() }} / {{ row.maxOutputTokens.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'info'" effect="plain">{{ row.status === 1 ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="90" fixed="right">
              <template #default="{ row }"><el-button v-if="canManage" link type="primary" @click="openModelDialog(row)">编辑</el-button></template>
            </el-table-column>
            <template #empty><el-empty description="暂无模型配置" /></template>
          </el-table>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="小易配置" name="profiles">
        <el-card shadow="never" class="config-card">
          <template #header><div class="card-header"><strong>小易 profile</strong><span>用于隔离不同会话类型的模型与记忆配置。</span></div></template>
          <el-table :data="profiles" v-loading="loading" stripe>
            <el-table-column prop="displayName" label="配置名称" min-width="180" />
            <el-table-column prop="profileCode" label="编码" min-width="180" />
            <el-table-column prop="sessionType" label="会话类型" width="120" />
            <el-table-column label="允许用户选模型" width="150">
              <template #default="{ row }">{{ row.allowUserModelSelection ? '是' : '否' }}</template>
            </el-table-column>
            <el-table-column label="可用模型" min-width="360">
              <template #default="{ row }">
                <el-select v-model="profileSelections[row.profileCode]" multiple collapse-tags collapse-tags-tooltip filterable placeholder="选择模型" style="width: 280px">
                  <el-option v-for="model in models" :key="model.modelCode" :label="`${model.displayName} (${model.providerCode})`" :value="model.modelCode" />
                </el-select>
                <el-button v-if="canManage" link type="primary" :loading="profileSaving === row.profileCode" @click="saveProfileModels(row)">保存</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="providerDialogVisible" :title="editingProvider ? '编辑供应商' : '新增供应商'" width="560px" destroy-on-close>
      <el-form ref="providerFormRef" :model="providerForm" :rules="providerRules" label-width="110px">
        <el-form-item label="供应商编码" prop="providerCode"><el-input v-model="providerForm.providerCode" :disabled="!!editingProvider" placeholder="例如 qwen" /></el-form-item>
        <el-form-item label="显示名称" prop="displayName"><el-input v-model="providerForm.displayName" placeholder="例如 通义千问" /></el-form-item>
        <el-form-item label="协议类型" prop="protocolType"><el-select v-model="providerForm.protocolType" style="width: 100%"><el-option label="OpenAI Compatible" value="openai_compatible" /><el-option label="Anthropic" value="anthropic" /></el-select></el-form-item>
        <el-form-item label="Base URL" prop="baseUrl"><el-input v-model="providerForm.baseUrl" placeholder="https://dashscope.aliyuncs.com/compatible-mode" /></el-form-item>
        <el-form-item label="API Key" prop="apiKey"><el-input v-model="providerForm.apiKey" type="password" show-password autocomplete="new-password" :placeholder="editingProvider ? '留空表示保留当前密钥' : '请输入 API Key'" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="providerForm.enabled" active-text="启用" inactive-text="停用" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="providerDialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveProvider">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="modelDialogVisible" :title="editingModel ? '编辑模型' : '新增模型'" width="620px" destroy-on-close>
      <el-form ref="modelFormRef" :model="modelForm" :rules="modelRules" label-width="125px">
        <el-form-item label="模型编码" prop="modelCode"><el-input v-model="modelForm.modelCode" :disabled="!!editingModel" placeholder="例如 qwen3" /></el-form-item>
        <el-form-item label="供应商" prop="providerAccountId"><el-select v-model="modelForm.providerAccountId" style="width: 100%"><el-option v-for="item in providers" :key="item.id" :label="`${item.displayName} (${item.providerCode})`" :value="item.id" /></el-select></el-form-item>
        <el-form-item label="上游模型名" prop="upstreamModelName"><el-input v-model="modelForm.upstreamModelName" placeholder="例如 qwen3-max" /></el-form-item>
        <el-form-item label="显示名称" prop="displayName"><el-input v-model="modelForm.displayName" placeholder="例如 Qwen3 通用对话" /></el-form-item>
        <el-form-item label="模型类型" prop="modelType"><el-select v-model="modelForm.modelType" style="width: 100%"><el-option label="Chat" value="chat" /><el-option label="Embedding" value="embedding" /><el-option label="Rerank" value="rerank" /></el-select></el-form-item>
        <el-form-item label="上下文窗口"><el-input-number v-model="modelForm.contextWindow" :min="1024" :max="2000000" /></el-form-item>
        <el-form-item label="最大输出 Token"><el-input-number v-model="modelForm.maxOutputTokens" :min="1" :max="200000" /></el-form-item>
        <el-form-item label="状态"><el-switch v-model="modelForm.enabled" active-text="启用" inactive-text="停用" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="modelDialogVisible = false">取消</el-button><el-button type="primary" :loading="saving" @click="saveModel">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Plus, Refresh } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'
import {
  createAgentModelApi,
  createAgentProviderApi,
  getAgentModelsApi,
  getAgentProfileModelsApi,
  getAgentProfilesApi,
  getAgentProvidersApi,
  testAgentProviderApi,
  updateAgentProfileModelsApi,
  updateAgentModelApi,
  updateAgentProviderApi,
} from '../../api'
import type {
  AgentModelCreateParams,
  AgentModelDeployment,
  AgentModelUpdateParams,
  AgentProfile,
  AgentProfileModel,
  AgentProfileModelBinding,
  AgentProvider,
  AgentProviderCreateParams,
  AgentProviderUpdateParams,
} from '../../types/api'

const authStore = useAuthStore()
const canManage = computed(() => authStore.isAdmin || authStore.hasPermission('agent:model:manage'))
const activeTab = ref('providers')
const loading = ref(false)
const saving = ref(false)
const testingId = ref<number | null>(null)
const providers = ref<AgentProvider[]>([])
const models = ref<AgentModelDeployment[]>([])
const profiles = ref<AgentProfile[]>([])
const profileModels = ref<Record<string, AgentProfileModel[]>>({})
const profileSelections = reactive<Record<string, string[]>>({})
const profileSaving = ref<string | null>(null)

const providerDialogVisible = ref(false)
const editingProvider = ref<AgentProvider | null>(null)
const providerFormRef = ref<FormInstance>()
const providerForm = reactive({ providerCode: '', displayName: '', protocolType: 'openai_compatible' as 'openai_compatible' | 'anthropic', baseUrl: '', apiKey: '', enabled: true })
const providerRules: FormRules = {
  providerCode: [{ required: true, pattern: /^[a-z][a-z0-9_-]*$/, message: '请输入小写编码', trigger: 'blur' }],
  displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
  protocolType: [{ required: true, message: '请选择协议', trigger: 'change' }],
  baseUrl: [{ required: true, type: 'url', message: '请输入完整 URL', trigger: 'blur' }],
  apiKey: [{ validator: (_rule, value, callback) => (!editingProvider.value && !value ? callback(new Error('请输入 API Key')) : callback()), trigger: 'blur' }],
}

const modelDialogVisible = ref(false)
const editingModel = ref<AgentModelDeployment | null>(null)
const modelFormRef = ref<FormInstance>()
const modelForm = reactive({ modelCode: '', providerAccountId: 0, upstreamModelName: '', displayName: '', modelType: 'chat' as 'chat' | 'embedding' | 'rerank', contextWindow: 32768, maxOutputTokens: 4096, enabled: true })
const modelRules: FormRules = {
  modelCode: [{ required: true, pattern: /^[a-z][a-z0-9_.-]*$/, message: '请输入小写编码', trigger: 'blur' }],
  providerAccountId: [{ required: true, message: '请选择供应商', trigger: 'change' }],
  upstreamModelName: [{ required: true, message: '请输入上游模型名', trigger: 'blur' }],
  displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
}

async function loadAll() {
  loading.value = true
  try {
    const [providerResult, modelResult, profileResult] = await Promise.all([getAgentProvidersApi(), getAgentModelsApi(), getAgentProfilesApi()])
    providers.value = providerResult.data.data
    models.value = modelResult.data.data
    profiles.value = profileResult.data.data
    const entries = await Promise.all(profiles.value.map(async profile => [profile.profileCode, (await getAgentProfileModelsApi(profile.profileCode)).data.data] as const))
    profileModels.value = Object.fromEntries(entries)
    for (const [profileCode, bindings] of entries) profileSelections[profileCode] = bindings.map(item => item.modelCode)
  } catch {
    ElMessage.error('模型配置加载失败，请检查 Agent 服务状态')
  } finally {
    loading.value = false
  }
}

async function saveProfileModels(profile: AgentProfile) {
  const selected = profileSelections[profile.profileCode] || []
  const current = profileModels.value[profile.profileCode] || []
  const bindings: AgentProfileModelBinding[] = selected.map((modelCode, index) => {
    const old = current.find(item => item.modelCode === modelCode)
    return { modelCode, isDefault: old?.isDefault ?? index === 0, userSelectable: old?.userSelectable ?? profile.allowUserModelSelection, fallbackPriority: old?.fallbackPriority ?? index + 1, status: 1 }
  })
  if (bindings.length && !bindings.some(item => item.isDefault)) bindings[0].isDefault = true
  if (bindings.filter(item => item.isDefault).length > 1) bindings.forEach((item, index) => { item.isDefault = index === 0 })
  profileSaving.value = profile.profileCode
  try {
    const result = await updateAgentProfileModelsApi(profile.profileCode, bindings)
    profileModels.value[profile.profileCode] = result.data.data
    ElMessage.success('模型绑定已保存')
  } catch {
    ElMessage.error('模型绑定保存失败')
  } finally {
    profileSaving.value = null
  }
}

function openProviderDialog(row?: AgentProvider) {
  editingProvider.value = row || null
  Object.assign(providerForm, { providerCode: row?.providerCode || '', displayName: row?.displayName || '', protocolType: row?.protocolType === 'anthropic' ? 'anthropic' : 'openai_compatible', baseUrl: row?.baseUrl || '', apiKey: '', enabled: row ? row.status === 1 : true })
  providerDialogVisible.value = true
}

async function saveProvider() {
  if (!(await providerFormRef.value?.validate())) return
  saving.value = true
  try {
    if (editingProvider.value) {
      const data: AgentProviderUpdateParams = { displayName: providerForm.displayName, protocolType: providerForm.protocolType, baseUrl: providerForm.baseUrl, status: providerForm.enabled ? 1 : 0 }
      if (providerForm.apiKey) data.apiKey = providerForm.apiKey
      await updateAgentProviderApi(editingProvider.value.id, data)
    } else {
      const data: AgentProviderCreateParams = { providerCode: providerForm.providerCode, displayName: providerForm.displayName, protocolType: providerForm.protocolType, baseUrl: providerForm.baseUrl, apiKey: providerForm.apiKey, status: providerForm.enabled ? 1 : 0 }
      await createAgentProviderApi(data)
    }
    ElMessage.success('供应商已保存')
    providerDialogVisible.value = false
    await loadAll()
  } catch {
    ElMessage.error('供应商保存失败')
  } finally {
    saving.value = false
  }
}

async function testProvider(row: AgentProvider) {
  testingId.value = row.id
  try {
    const result = await testAgentProviderApi(row.id)
    ElMessage.success(result.data.data.message || '连接成功')
    await loadAll()
  } catch {
    ElMessage.error('连接失败，请检查 Base URL 和 API Key')
  } finally {
    testingId.value = null
  }
}

function openModelDialog(row?: AgentModelDeployment) {
  editingModel.value = row || null
  Object.assign(modelForm, { modelCode: row?.modelCode || '', providerAccountId: row?.providerAccountId || providers.value[0]?.id || 0, upstreamModelName: row?.upstreamModelName || '', displayName: row?.displayName || '', modelType: row?.modelType === 'embedding' || row?.modelType === 'rerank' ? row.modelType : 'chat', contextWindow: row?.contextWindow || 32768, maxOutputTokens: row?.maxOutputTokens || 4096, enabled: row ? row.status === 1 : true })
  modelDialogVisible.value = true
}

async function saveModel() {
  if (!(await modelFormRef.value?.validate())) return
  saving.value = true
  try {
    const data = { providerAccountId: modelForm.providerAccountId, upstreamModelName: modelForm.upstreamModelName, displayName: modelForm.displayName, modelType: modelForm.modelType, contextWindow: modelForm.contextWindow, maxOutputTokens: modelForm.maxOutputTokens, status: modelForm.enabled ? 1 : 0, inputPrice: 0, outputPrice: 0, cachedInputPrice: 0, reasoningPrice: 0 } as AgentModelCreateParams & AgentModelUpdateParams
    if (editingModel.value) await updateAgentModelApi(editingModel.value.id, data)
    else await createAgentModelApi({ ...data, modelCode: modelForm.modelCode })
    ElMessage.success('模型已保存')
    modelDialogVisible.value = false
    await loadAll()
  } catch {
    ElMessage.error('模型保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadAll)
</script>

<style scoped>
.model-config-page { min-height: 100%; }
.page-heading { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.page-heading h1 { margin: 0; color: #17223b; font-size: 28px; }
.page-heading p { margin: 8px 0 0; color: #8190aa; }
.config-tabs { background: transparent; }
.config-card { border: 1px solid #e5ebf3; border-radius: 8px; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; }
.card-header strong { display: block; color: #17223b; font-size: 17px; }
.card-header span { display: block; margin-top: 5px; color: #8a98ae; font-size: 13px; }
.provider-name { color: #263451; font-weight: 600; }
code { color: #7b8ba5; font-size: 12px; }
.inline-code { margin-left: 8px; }
.muted { color: #9aa7ba; }
.model-tags { display: flex; flex-wrap: wrap; gap: 6px; }
@media (max-width: 900px) {
  .page-heading { align-items: stretch; gap: 12px; flex-direction: column; }
  .card-header { align-items: flex-start; flex-direction: column; }
}
</style>
