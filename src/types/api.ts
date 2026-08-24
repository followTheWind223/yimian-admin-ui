export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

export type ApiId = string | number

export interface PageResult<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
  page?: number
  size?: number
}

export interface AgentConversationStats {
  sessionCount: number
  activeSessionCount: number
  supportSessionCount: number
  quickSessionCount: number
  messageCount: number
  inputTokens: number
  outputTokens: number
  reasoningTokens: number
  cachedInputTokens: number
  totalTokens: number
  estimatedMessageCount: number
  totalCostUsd: number
}

export interface AgentConversationSession {
  id: string
  userId: string
  sessionType: 'support' | 'quick'
  scene: string
  title: string | null
  status: number
  deleted: boolean
  messageCount: number
  inputTokens: number
  outputTokens: number
  reasoningTokens: number
  cachedInputTokens: number
  totalTokens: number
  totalCostUsd: number
  modelProvider: string | null
  modelName: string | null
  lastActiveAt: string
  createdAt: string
  archivedAt: string | null
  deletedAt: string | null
}

export interface AgentConversationMessage {
  id: string
  sequenceNo: string
  role: string
  messageType: string
  status: number
  content: string | null
  toolName: string | null
  modelProvider: string | null
  modelName: string | null
  contentTokens: number
  inputTokens: number
  outputTokens: number
  reasoningTokens: number
  cachedInputTokens: number
  totalTokens: number
  tokenizerModel: string | null
  tokenEstimated: boolean
  latencyMs: number | null
  costUsd: number
  finishReason: string | null
  errorCode: string | null
  completedAt: string | null
  createdAt: string
}

export interface AgentConversationDetail {
  session: AgentConversationSession
  messages: PageResult<AgentConversationMessage>
}

export interface AgentConversationQuery {
  page: number
  size: number
  userId?: string
  sessionType?: 'support' | 'quick'
  status?: number
}

export interface UserInfo {
  id: ApiId
  username: string
  email: string | null
  phone: string | null
  nickname: string
  avatar: string | null
  roles: string[]
  permissions: string[]
  status: 0 | 1 | 2
  createdAt: string
  lastLoginTime?: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  tokenType: string
  expiresIn: number
  permissions: string[]
  userInfo: UserInfo
}

export interface LoginParams {
  username: string
  password: string
  captchaKey?: string
  captcha?: string
}

export interface RegisterParams {
  username: string
  password: string
  email?: string
  phone?: string
  nickname?: string
}

export interface UserQuery {
  page?: number
  size?: number
  keyword?: string
  role?: string
  status?: number
}

export interface CreateUserParams {
  username: string
  password: string
  email?: string
  phone?: string
  nickname?: string
  roleCodes?: string[]
}

export interface UpdateUserParams {
  nickname?: string
  email?: string
  phone?: string
  status?: number
}

export interface ResetPasswordParams {
  newPassword: string
}

export interface AssignRoleParams {
  roleCodes: string[]
}

export interface UpdateProfileParams {
  nickname?: string
  email?: string
  phone?: string
  avatar?: string
}

export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

// ==================== 问题反馈 ====================
export interface BugFeedback {
  id: string | number
  userId: string | number
  username: string
  title: string
  content: string
  pageUrl: string | null
  contact: string | null
  status: 0 | 1 | 2 | 3
  createdAt: string
  updatedAt: string
}

export interface BugFeedbackQuery {
  page?: number
  size?: number
  keyword?: string
  status?: number
}

// ==================== 系统公告 ====================
export interface SystemAnnouncement {
  id: ApiId
  notificationId?: ApiId | null
  title: string
  content: string
  important: boolean
  enabled: boolean
  creatorId: ApiId
  creatorName: string | null
  createdAt: string
  updatedAt: string
}

export interface SystemAnnouncementQuery {
  page?: number
  size?: number
  keyword?: string
  important?: boolean
}

export interface SystemAnnouncementCreateParams {
  title: string
  content: string
  important: boolean
}

export interface Role {
  id: number
  roleCode: string
  roleName: string
  description: string | null
  sort: number
  deleted: 0 | 1 | null
  createdAt: string
}

export interface CreateRoleParams {
  roleCode: string
  roleName: string
  description?: string
  sort?: number
}

export interface UpdateRoleParams {
  roleName?: string
  description?: string
  sort?: number
}

export interface AssignPermParams {
  permCodes: string[]
}

export interface Permission {
  id: number
  permCode: string
  permName: string
  description: string | null
  deleted: 0 | 1 | null
  createdAt: string
}

export interface CreatePermissionParams {
  permCode: string
  permName: string
  description?: string
}

export interface UpdatePermissionParams {
  permName?: string
  description?: string
}

// ==================== 操作日志 ====================
export interface OperationLog {
  id: number
  userId: number | null
  username: string | null
  module: string
  operation: string
  description: string | null
  method: string
  requestUri: string
  classMethod: string | null
  requestParams: string | null
  ip: string | null
  userAgent: string | null
  responseCode: number | null
  resultCode: number | null
  resultMsg: string | null
  errorMsg: string | null
  duration: number | null
  status: 0 | 1
  createdAt: string
  moduleName?: string
}

export interface LogQuery {
  page?: number
  size?: number
  username?: string
  module?: string
  status?: number
  startDate?: string
  endDate?: string
}

// ==================== 日志模块字典 ====================
export interface LogModule {
  id: number
  code: string
  name: string
  description: string | null
  sort: number
  enabled: number
  createdAt: string
  updatedAt: string
}

export interface CreateLogModuleParams {
  code: string
  name: string
  description?: string
  sort?: number
  enabled?: number
}

export interface UpdateLogModuleParams {
  name?: string
  description?: string
  sort?: number
  enabled?: number
}

// ==================== 文件上传 ====================
export interface FileVO {
  originalName: string
  fileName: string
  path: string
  url: string
  size: number
  contentType: string
  extension: string
}

// ==================== 知识管理 ====================
export interface Knowledge {
  id: number
  title: string
  content: string
  difficulty: 1 | 2 | 3
  status: 0 | 1 | 2 | 3
  auditRemark: string | null
  auditUserId: number | null
  auditTime: string | null
  submitUserId: number
  submitUserName: string | null
  viewCount: number
  likeCount: number
  collectCount: number
  commentCount: number
  tags: { id: number; name: string; color: string }[]
  createdAt: string
  updatedAt: string
}

export interface KnowledgeQuery {
  page?: number
  size?: number
  keyword?: string
  difficulty?: number
  tagId?: number
  status?: number
}

export interface BatchAuditParams {
  ids: number[]
  approve: boolean
  remark?: string
}

export interface Blog {
  id: number
  title: string
  content: string
  summary: string | null
  authorId: number
  authorName: string | null
  authorAvatar: string | null
  status: 0 | 1 | 2 | 3
  isPinned: number
  viewCount: number
  likeCount: number
  commentCount: number
  refType: string | null
  refId: number | null
  images: string[]
  topics: { id: number; name: string; color: string | null }[]
  collectCount?: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface BlogQuery {
  page?: number
  size?: number
  keyword?: string
  status?: number
}

export interface Topic {
  id: number
  name: string
  description: string | null
  color: string | null
  sort: number
  blogCount: number
  createdAt: string
  updatedAt: string
}

export interface TopicParams {
  name: string
  description?: string
  color?: string
  sort?: number
}
