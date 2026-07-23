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
      <el-table-column :label="$t('userMgmt.actions')" min-width="360">
        <template #default="{ row }">
          <el-button size="small" @click="toggleDisabled(row)">
            {{ row.disabled ? $t('userMgmt.enabled') : $t('userMgmt.disabled') }}
          </el-button>
          <el-button size="small" @click="openReset(row)">{{ $t('userMgmt.resetPassword') }}</el-button>
          <el-button size="small" type="primary" plain :disabled="row.disabled" @click="openIssueToken(row)">
            {{ $t('userMgmt.issueToken') }}
          </el-button>
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
        <el-button @click="createVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submitCreate">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="resetVisible" :title="$t('userMgmt.resetPassword')" width="420px">
      <el-form label-width="90px">
        <el-form-item :label="$t('userMgmt.newPassword')">
          <el-input v-model="resetPassword" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resetVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="submitReset">{{ $t('common.confirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 为指定用户签发 API Token -->
    <el-dialog v-model="tokenVisible" :title="$t('userMgmt.issueTokenTitle')" width="480px" @closed="resetTokenDialog">
      <template v-if="!issuedToken">
        <el-form label-width="100px">
          <el-form-item :label="$t('userMgmt.username')">
            <span>{{ tokenTarget?.username }}</span>
          </el-form-item>
          <el-form-item :label="$t('userMgmt.tokenName')">
            <el-input v-model="tokenForm.name" />
          </el-form-item>
          <el-form-item :label="$t('userMgmt.tokenPermissions')">
            <el-checkbox-group v-model="tokenForm.permissions">
              <el-checkbox label="upload">{{ $t('sysSecurity.permUpload') }}</el-checkbox>
              <el-checkbox label="list">{{ $t('sysSecurity.permList') }}</el-checkbox>
              <el-checkbox label="delete">{{ $t('sysSecurity.permDelete') }}</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <p class="token-hint">{{ $t('sysSecurity.userTokenPermHint') }}</p>
        </el-form>
      </template>
      <template v-else>
        <p class="token-warn">{{ $t('userMgmt.issueTokenSuccess') }}</p>
        <el-form label-width="100px">
          <el-form-item :label="$t('userMgmt.tokenName')">
            <span>{{ issuedToken.name }}</span>
          </el-form-item>
          <el-form-item :label="$t('userMgmt.fullToken')">
            <el-input v-model="issuedToken.token" readonly>
              <template #append>
                <el-button @click="copyIssuedToken">{{ $t('userMgmt.copyToken') }}</el-button>
              </template>
            </el-input>
          </el-form-item>
        </el-form>
      </template>
      <template #footer>
        <el-button v-if="!issuedToken" @click="tokenVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button v-if="!issuedToken" type="primary" :loading="saving" @click="submitIssueToken">
          {{ $t('common.confirm') }}
        </el-button>
        <el-button v-else type="primary" @click="tokenVisible = false">{{ $t('common.close') }}</el-button>
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
      tokenVisible: false,
      tokenTarget: null,
      tokenForm: { name: '', permissions: ['upload', 'list', 'delete'] },
      issuedToken: null,
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
    openIssueToken(row) {
      this.tokenTarget = row
      this.tokenForm = {
        name: `${row.username || 'user'}-api`,
        permissions: ['upload', 'list', 'delete'],
      }
      this.issuedToken = null
      this.tokenVisible = true
    },
    resetTokenDialog() {
      this.tokenTarget = null
      this.issuedToken = null
      this.tokenForm = { name: '', permissions: ['upload', 'list', 'delete'] }
    },
    async submitIssueToken() {
      if (!this.tokenTarget) return
      if (!this.tokenForm.name?.trim()) {
        this.$message.warning(this.$t('sysSecurity.tokenNameRequired'))
        return
      }
      if (!this.tokenForm.permissions?.length) {
        this.$message.warning(this.$t('sysSecurity.permissionsRequired'))
        return
      }
      this.saving = true
      try {
        const res = await axios.post('/api/manage/apiTokens', {
          name: this.tokenForm.name.trim(),
          owner: 'admin',
          permissions: this.tokenForm.permissions,
          scope: 'user',
          userId: this.tokenTarget.id,
          expiresAt: null,
          autoDelete: false,
        }, { withCredentials: true })
        this.issuedToken = {
          name: res.data?.name || this.tokenForm.name,
          token: res.data?.token || '',
        }
        this.$message.success(this.$t('userMgmt.issueTokenSuccess'))
      } catch (e) {
        this.$message.error(e.response?.data?.error || this.$t('userMgmt.issueTokenFailed'))
      } finally {
        this.saving = false
      }
    },
    async copyIssuedToken() {
      if (!this.issuedToken?.token) return
      try {
        await navigator.clipboard.writeText(this.issuedToken.token)
        this.$message.success(this.$t('userMgmt.tokenCopied'))
      } catch {
        this.$message.error(this.$t('sysSecurity.copyFailed'))
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
.token-hint {
  margin: 0 0 0 100px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.45;
}
.token-warn {
  margin: 0 0 12px;
  color: #e6a23c;
  font-size: 13px;
}
</style>
