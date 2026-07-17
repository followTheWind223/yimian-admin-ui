// ==================== 标签管理 ====================
export interface Tag {
  id: number
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
