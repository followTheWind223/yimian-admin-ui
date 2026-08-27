import request from '../utils/request'
import type { ApiResponse } from '../types/api'
import type {
  ApiId,
  LoginParams,
  LoginResult,
  RegisterParams,
  UserInfo,
  UserQuery,
  PageResult,
  CreateUserParams,
  UpdateUserParams,
  ResetPasswordParams,
  AssignRoleParams,
  UpdateProfileParams,
  ChangePasswordParams,
  BugFeedback,
  BugFeedbackQuery,
  SystemAnnouncement,
  SystemAnnouncementCreateParams,
  SystemAnnouncementQuery,
  Role,
  CreateRoleParams,
  UpdateRoleParams,
  AssignPermParams,
  Permission,
  CreatePermissionParams,
  UpdatePermissionParams,
  OperationLog,
  LogQuery,
  LogModule,
  CreateLogModuleParams,
  UpdateLogModuleParams,
  FileVO,
  Knowledge,
  KnowledgeQuery,
  BatchAuditParams,
  Blog,
  BlogQuery,
  Topic,
  TopicParams,
  AgentConversationStats,
  AgentConversationSession,
  AgentConversationDetail,
  AgentConversationQuery,
  AgentStatisticsPeriod,
  AgentUsageAnalytics,
  AgentProvider,
  AgentProviderCreateParams,
  AgentProviderUpdateParams,
  AgentProviderTestResult,
  AgentModelDeployment,
  AgentModelCreateParams,
  AgentModelUpdateParams,
  AgentProfile,
  AgentProfileModel,
  AgentProfileModelBinding,
} from '../types/api'
import type { Tag, CreateTagParams, UpdateTagParams } from './tag'

// ==================== 认证 ====================
export function loginApi(data: LoginParams) {
  return request.post<ApiResponse<LoginResult>>('/auth/login', data)
}
export function adminLoginApi(data: LoginParams) {
  return request.post<ApiResponse<LoginResult>>('/auth/admin/login', data)
}
export function registerApi(data: RegisterParams) {
  return request.post<ApiResponse<UserInfo>>('/auth/register', data)
}

// ==================== 个人中心 ====================
export function getProfileApi() {
  return request.get<ApiResponse<UserInfo>>('/user/profile')
}
export function updateProfileApi(data: UpdateProfileParams) {
  return request.put<ApiResponse<UserInfo>>('/user/profile', data)
}
export function changePasswordApi(data: ChangePasswordParams) {
  return request.put<ApiResponse<null>>('/user/password', data)
}

// ==================== 问题反馈 ====================
export function getBugFeedbackListApi(params: BugFeedbackQuery) {
  return request.get<ApiResponse<PageResult<BugFeedback>>>('/admin/feedback', { params })
}
export function getBugFeedbackDetailApi(id: string | number) {
  return request.get<ApiResponse<BugFeedback>>(`/admin/feedback/${id}`)
}
export function updateBugFeedbackStatusApi(id: string | number, status: number) {
  return request.put<ApiResponse<BugFeedback>>(`/admin/feedback/${id}/status`, null, { params: { status } })
}

// ==================== 系统公告 ====================
export function getSystemAnnouncementListApi(params: SystemAnnouncementQuery) {
  return request.get<ApiResponse<PageResult<SystemAnnouncement>>>('/admin/announcements', { params })
}

export function publishSystemAnnouncementApi(data: SystemAnnouncementCreateParams) {
  return request.post<ApiResponse<SystemAnnouncement>>('/admin/announcements', data)
}

// ==================== 用户管理 ====================
export function getUserListApi(params: UserQuery) {
  return request.get<ApiResponse<PageResult<UserInfo>>>('/admin/users', { params })
}
export function getUserDetailApi(id: ApiId) {
  return request.get<ApiResponse<UserInfo>>(`/admin/users/${id}`)
}
export function createUserApi(data: CreateUserParams) {
  return request.post<ApiResponse<UserInfo>>('/admin/users', data)
}
export function updateUserApi(id: ApiId, data: UpdateUserParams) {
  return request.put<ApiResponse<UserInfo>>(`/admin/users/${id}`, data)
}
export function resetPasswordApi(id: ApiId, data: ResetPasswordParams) {
  return request.put<ApiResponse<null>>(`/admin/users/${id}/password`, data)
}
export function deleteUserApi(id: ApiId) {
  return request.delete<ApiResponse<null>>(`/admin/users/${id}`)
}
export function assignRolesApi(id: ApiId, data: AssignRoleParams) {
  return request.put<ApiResponse<UserInfo>>(`/admin/users/${id}/roles`, data)
}

// ==================== 角色管理 ====================
export function getRoleListApi() {
  return request.get<ApiResponse<Role[]>>('/admin/roles')
}
export function getRoleDetailApi(id: number) {
  return request.get<ApiResponse<Role>>(`/admin/roles/${id}`)
}
export function createRoleApi(data: CreateRoleParams) {
  return request.post<ApiResponse<Role>>('/admin/roles', data)
}
export function updateRoleApi(id: number, data: UpdateRoleParams) {
  return request.put<ApiResponse<Role>>(`/admin/roles/${id}`, data)
}
export function deleteRoleApi(id: number) {
  return request.delete<ApiResponse<null>>(`/admin/roles/${id}`)
}
export function setRoleEnabledApi(id: number, enabled: boolean) {
  return request.put<ApiResponse<Role>>(`/admin/roles/${id}/enabled`, null, { params: { enabled } })
}
export function getRolePermissionsApi(id: number) {
  return request.get<ApiResponse<string[]>>(`/admin/roles/${id}/permissions`)
}
export function assignPermissionsApi(id: number, data: AssignPermParams) {
  return request.put<ApiResponse<null>>(`/admin/roles/${id}/permissions`, data)
}

// ==================== 权限管理 ====================
export function getPermissionListApi() {
  return request.get<ApiResponse<Permission[]>>('/admin/permissions')
}
export function getPermissionDetailApi(id: number) {
  return request.get<ApiResponse<Permission>>(`/admin/permissions/${id}`)
}
export function createPermissionApi(data: CreatePermissionParams) {
  return request.post<ApiResponse<Permission>>('/admin/permissions', data)
}
export function updatePermissionApi(id: number, data: UpdatePermissionParams) {
  return request.put<ApiResponse<Permission>>(`/admin/permissions/${id}`, data)
}
export function deletePermissionApi(id: number) {
  return request.delete<ApiResponse<null>>(`/admin/permissions/${id}`)
}
export function setPermissionEnabledApi(id: number, enabled: boolean) {
  return request.put<ApiResponse<Permission>>(`/admin/permissions/${id}/enabled`, null, { params: { enabled } })
}

// ==================== 操作日志 ====================
export function getLogListApi(params: LogQuery) {
  return request.get<ApiResponse<PageResult<OperationLog>>>('/admin/logs', { params })
}

// ==================== 日志模块字典 ====================
export function getLogModuleListApi() {
  return request.get<ApiResponse<LogModule[]>>('/admin/logs/modules')
}
export function getLogModuleEnabledApi() {
  return request.get<ApiResponse<LogModule[]>>('/admin/logs/modules/enabled')
}
export function getLogModuleDetailApi(id: number) {
  return request.get<ApiResponse<LogModule>>(`/admin/logs/modules/${id}`)
}
export function createLogModuleApi(data: CreateLogModuleParams) {
  return request.post<ApiResponse<LogModule>>('/admin/logs/modules', data)
}
export function updateLogModuleApi(id: number, data: UpdateLogModuleParams) {
  return request.put<ApiResponse<LogModule>>(`/admin/logs/modules/${id}`, data)
}
export function deleteLogModuleApi(id: number) {
  return request.delete<ApiResponse<null>>(`/admin/logs/modules/${id}`)
}

// ==================== 标签管理 ====================
export function getTagListApi() {
  return request.get<ApiResponse<Tag[]>>('/tags')
}
export function createTagApi(data: CreateTagParams) {
  return request.post<ApiResponse<Tag>>('/admin/tags', data)
}
export function updateTagApi(id: ApiId, data: UpdateTagParams) {
  return request.put<ApiResponse<Tag>>(`/admin/tags/${id}`, data)
}
export function deleteTagApi(id: ApiId) {
  return request.delete<ApiResponse<null>>(`/admin/tags/${id}`)
}

// ==================== 文件上传 ====================
export function uploadFileApi(file: File, scene = 'common') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('scene', scene)
  return request.post<ApiResponse<FileVO>>('/file/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

// ==================== 知识管理（管理员） ====================
export function getKnowledgeListApi(params?: KnowledgeQuery) {
  return request.get<ApiResponse<PageResult<Knowledge>>>('/knowledge', { params })
}
export function getKnowledgePendingApi(params?: KnowledgeQuery) {
  return request.get<ApiResponse<PageResult<Knowledge>>>('/admin/knowledge/pending', { params })
}
export function approveKnowledgeApi(id: number) {
  return request.put<ApiResponse<Knowledge>>(`/admin/knowledge/${id}/approve`)
}
export function rejectKnowledgeApi(id: number, remark: string) {
  return request.put<ApiResponse<Knowledge>>(`/admin/knowledge/${id}/reject`, null, { params: { remark } })
}
export function batchAuditApi(data: BatchAuditParams) {
  return request.put<ApiResponse<number>>('/admin/knowledge/batch-audit', data)
}
export function getKnowledgeAuditSwitchApi() {
  return request.get<ApiResponse<boolean>>('/knowledge/audit-switch')
}
export function setKnowledgeAuditSwitchApi(enabled: boolean) {
  return request.put<ApiResponse<boolean>>('/knowledge/audit-switch', null, { params: { enabled } })
}

// ==================== 博客管理（管理员） ====================
export function getAdminBlogListApi(params?: BlogQuery) {
  return request.get<ApiResponse<PageResult<Blog>>>('/admin/blogs', { params })
}
export function updateAdminBlogStatusApi(id: number, status: number) {
  return request.put<ApiResponse<Blog>>(`/admin/blogs/${id}/status`, null, { params: { status } })
}
export function deleteAdminBlogApi(id: number) {
  return request.delete<ApiResponse<null>>(`/admin/blogs/${id}`)
}

// ==================== 话题管理 ====================
export function getTopicListApi(keyword?: string) {
  return request.get<ApiResponse<Topic[]>>('/topics', { params: { keyword } })
}
export function createTopicApi(data: TopicParams) {
  return request.post<ApiResponse<Topic>>('/admin/topics', null, { params: data })
}
export function updateTopicApi(id: number, data: TopicParams) {
  return request.put<ApiResponse<Topic>>(`/admin/topics/${id}`, null, { params: data })
}
export function deleteTopicApi(id: number) {
  return request.delete<ApiResponse<null>>(`/admin/topics/${id}`)
}

// ==================== Agent 会话审计 ====================
export function getAgentConversationStatsApi() {
  return request.get<ApiResponse<AgentConversationStats>>('/admin/agent/conversations/stats')
}

export function getAgentConversationListApi(params: AgentConversationQuery) {
  return request.get<ApiResponse<PageResult<AgentConversationSession>>>('/admin/agent/conversations', { params })
}

export function getAgentConversationDetailApi(id: string, page = 1, size = 100) {
  return request.get<ApiResponse<AgentConversationDetail>>(`/admin/agent/conversations/${id}`, {
    params: { page, size },
  })
}

// ==================== Agent 用量统计 ====================
export function getAgentUsageAnalyticsApi(days: AgentStatisticsPeriod) {
  return request.get<ApiResponse<AgentUsageAnalytics>>('/admin/agent/statistics/usage', {
    params: { days },
  })
}

// ==================== Agent 妯″瀷閰嶇疆 ====================
export function getAgentProvidersApi() {
  return request.get<ApiResponse<AgentProvider[]>>('/admin/agent/models/providers')
}

export function createAgentProviderApi(data: AgentProviderCreateParams) {
  return request.post<ApiResponse<AgentProvider>>('/admin/agent/models/providers', data)
}

export function updateAgentProviderApi(id: number, data: AgentProviderUpdateParams) {
  return request.put<ApiResponse<AgentProvider>>(`/admin/agent/models/providers/${id}`, data)
}

export function testAgentProviderApi(id: number) {
  return request.post<ApiResponse<AgentProviderTestResult>>(`/admin/agent/models/providers/${id}/test`)
}

export function testAgentProviderConfigApi(data: AgentProviderCreateParams) {
  return request.post<ApiResponse<AgentProviderTestResult>>('/admin/agent/models/providers/test', data)
}

export function getAgentModelsApi() {
  return request.get<ApiResponse<AgentModelDeployment[]>>('/admin/agent/models')
}

export function createAgentModelApi(data: AgentModelCreateParams) {
  return request.post<ApiResponse<AgentModelDeployment>>('/admin/agent/models', data)
}

export function updateAgentModelApi(id: number, data: AgentModelUpdateParams) {
  return request.put<ApiResponse<AgentModelDeployment>>(`/admin/agent/models/${id}`, data)
}

export function getAgentProfilesApi() {
  return request.get<ApiResponse<AgentProfile[]>>('/admin/agent/models/profiles')
}

export function getAgentProfileModelsApi(profileCode: string) {
  return request.get<ApiResponse<AgentProfileModel[]>>(`/admin/agent/models/profiles/${profileCode}/models`)
}

export function updateAgentProfileModelsApi(profileCode: string, bindings: AgentProfileModelBinding[]) {
  return request.put<ApiResponse<AgentProfileModel[]>>(`/admin/agent/models/profiles/${profileCode}/models`, { bindings })
}
