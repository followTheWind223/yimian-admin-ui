<template>
  <AdminDashboard v-if="authStore.isAdmin" />
  <UserDashboard v-else />
</template>

<script setup lang="ts">
import { useAuthStore } from '../../stores/auth'
import AdminDashboard from './AdminDashboard.vue'
import UserDashboard from './UserDashboard.vue'

const authStore = useAuthStore()
</script>
