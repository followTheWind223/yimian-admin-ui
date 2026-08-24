// ==================== 标签管理 ====================
import type { ApiId } from '../types/api'

export interface Tag {
  id: ApiId
  name: string
  color: string
  sort: number
  usageCount?: number
  createdAt: string
  updatedAt: string
}

export interface CreateTagParams {
  name: string
  color: string
  sort?: number
}

export interface UpdateTagParams {
  name?: string
  color?: string
  sort?: number
}
