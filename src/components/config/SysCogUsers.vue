<template>
  <div class="users-page">
    <div class="toolbar">
      <h2>{{ $t('userMgmt.title') }}</h2>
      <el-button type="primary" @click="openCreate">{{ $t('userMgmt.create') }}</el-button>
    </div>

    <el-table :data="users" v-loading="loading" stripe>
      <el-table-column prop="username" :label="$t('userMgmt.username')" min-width="120" />
      <el-table-column prop="displayName" :label="$t('userMgmt.displayName')" min-width="120" />
      <el-table-column :label="$t('userMgmt.status')" width="100">
        <template #default="{ row }">
          <el-tag :type="row.disabled ? 'danger' : 'success'" size="small">
            {{ row.disabled ? $t('userMgmt.disabled') : $t('userMgmt.enabled') }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="$t('userMgmt.actions')" min-width="280">
        <template #default="{ row }">
          <el-button size="small" @click="toggleDisabled(row)">
            {{ row.disabled ? $t('userMgmt.enabled') : $t('userMgmt.disabled') }}
          </el-button>
          <el-button size="small" @click="openReset(row)">{{ $t('userMgmt.resetPassword') }}</el-button>
          <el-button size="small" type="danger" @click="removeUser(row)">{{ $t('userMgmt.delete') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="createVisible" :title="$t('userMgmt.create')" width="420px">
      <el-form label-width="90px">
        <el-form-item :label="$t('userMgmt.username')">
          <el-input v-model="createForm.username" />
        </el-form-item>
        <el-form-item :label="$t('userMgmt.password')">
          <el-input v-model="createForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item :label="$t('userMgmt.displayName')">
          <el-input v-model="createForm.displayName" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="submitCreate">OK</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resetVisible" :title="$t('userMgmt.resetPassword')" width="420px">
      <el-form label-width="90px">
        <el-form-item :label="$t('userMgmt.newPassword')">
          <el-input v-model="resetPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetVisible = false">Cancel</el-button>
        <el-button type="primary" :loading="saving" @click="submitReset">OK</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import axios from '@/utils/axios'

export default {
  name: 'SysCogUsers',
  data() {
    return {
      users: [],
      loading: false,
      saving: false,
      createVisible: false,
      resetVisible: false,
      createForm: { username: '', password: '', displayName: '' },
      resetTarget: null,
      resetPassword: '',
    }
  },
  mounted() {
    this.loadUsers()
  },
  methods: {
    async loadUsers() {
      this.loading = true
      try {
        const res = await axios.get('/api/manage/users', { withCredentials: true })
        this.users = res.data?.users || []
      } catch (e) {
        this.$message.error(e.response?.data?.error || e.message)
      } finally {
        this.loading = false
      }
    },
    openCreate() {
      this.createForm = { username: '', password: '', displayName: '' }
      this.createVisible = true
    },
    async submitCreate() {
      this.saving = true
      try {
        await axios.post('/api/manage/users', this.createForm, { withCredentials: true })
        this.$message.success(this.$t('userMgmt.createSuccess'))
        this.createVisible = false
        await this.loadUsers()
      } catch (e) {
        this.$message.error(e.response?.data?.error || e.message)
      } finally {
        this.saving = false
      }
    },
    async toggleDisabled(row) {
      try {
        await axios.put('/api/manage/users', {
          id: row.id,
          disabled: !row.disabled,
        }, { withCredentials: true })
        this.$message.success(this.$t('userMgmt.updateSuccess'))
        await this.loadUsers()
      } catch (e) {
        this.$message.error(e.response?.data?.error || e.message)
      }
    },
    openReset(row) {
      this.resetTarget = row
      this.resetPassword = ''
      this.resetVisible = true
    },
    async submitReset() {
      if (!this.resetTarget) return
      this.saving = true
      try {
        await axios.patch('/api/manage/users', {
          id: this.resetTarget.id,
          password: this.resetPassword,
        }, { withCredentials: true })
        this.$message.success(this.$t('userMgmt.updateSuccess'))
        this.resetVisible = false
      } catch (e) {
        this.$message.error(e.response?.data?.error || e.message)
      } finally {
        this.saving = false
      }
    },
    async removeUser(row) {
      try {
        await this.$confirm(this.$t('userMgmt.deleteConfirm'), 'Warning', { type: 'warning' })
      } catch {
        return
      }
      try {
        await axios.delete(`/api/manage/users?id=${encodeURIComponent(row.id)}`, { withCredentials: true })
        this.$message.success(this.$t('userMgmt.updateSuccess'))
        await this.loadUsers()
      } catch (e) {
        this.$message.error(e.response?.data?.error || e.message)
      }
    },
  },
}
</script>

<style scoped>
.users-page {
  padding: 20px 24px;
  max-width: 1100px;
}
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.toolbar h2 {
  margin: 0;
  font-size: 1.25rem;
}
</style>
