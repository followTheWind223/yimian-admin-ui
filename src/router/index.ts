import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    {
      path: '/login',
      name: 'Login',
      component: () => import('../views/login/LoginView.vue'),
      meta: { title: '管理员登录 - 易面' },
    },
    {
      path: '/admin',
      component: () => import('../views/layout/LayoutView.vue'),
      redirect: '/admin/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('../views/dashboard/DashboardView.vue'),
          meta: { title: '控制台' },
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('../views/profile/ProfileView.vue'),
          meta: { title: '个人中心' },
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('../views/user/UserListView.vue'),
          meta: { title: '用户管理', perm: 'user:list' },
        },
        {
          path: 'roles',
          name: 'Roles',
          component: () => import('../views/role/RoleListView.vue'),
          meta: { title: '角色管理', perm: 'role:list' },
        },
        {
          path: 'permissions',
          name: 'Permissions',
          component: () => import('../views/permission/PermissionListView.vue'),
          meta: { title: '权限管理', perm: 'perm:list' },
        },
        {
          path: 'logs',
          name: 'Logs',
          component: () => import('../views/log/LogListView.vue'),
          meta: { title: '操作日志', perm: 'log:list' },
        },
        {
          path: 'log-modules',
          name: 'LogModules',
          component: () => import('../views/log/LogModuleView.vue'),
          meta: { title: '日志模块字典', perm: 'log:module:list' },
        },
        {
          path: 'tags',
          name: 'Tags',
          component: () => import('../views/tag/TagListView.vue'),
          meta: { title: '标签管理', perm: 'knowledge:audit' },
        },
        {
          path: 'topics',
          name: 'Topics',
          component: () => import('../views/topic/TopicListView.vue'),
          meta: { title: '话题管理', perm: 'topic:list' },
        },
        {
          path: 'blogs',
          name: 'Blogs',
          component: () => import('../views/blog/BlogListView.vue'),
          meta: { title: '博客管理', perm: 'blog:list' },
        },
        {
          path: 'knowledge-audit',
          name: 'KnowledgeAudit',
          component: () => import('../views/knowledge/KnowledgeAuditView.vue'),
          meta: { title: '题目审核', perm: 'knowledge:audit' },
        },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '易面'}`

  const store = useAuthStore()
  const isPublic = !to.path.startsWith('/admin')
  const isLoginPage = to.path === '/login'

  if (store.accessToken && isLoginPage) {
    next('/admin/dashboard')
    return
  }

  if (!store.accessToken && !isPublic) {
    next('/login')
    return
  }

  if (store.accessToken && !isPublic && to.meta.perm) {
    const perm = to.meta.perm as string
    if (!store.hasPermission(perm)) {
      next('/admin/dashboard')
      return
    }
  }

  next()
})

export default router
