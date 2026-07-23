/**
 * 统一退出登录
 * 清除服务端 session cookie + 前端 vuex 身份
 */
import axios from '@/utils/axios'
import store from '@/store'

/**
 * @param {'user'|'admin'|null} authType - null 清除全部
 * @returns {Promise<void>}
 */
export async function logout(authType = 'user') {
    try {
        await axios.post(
            '/api/auth/logout',
            { authType },
            { withCredentials: true }
        )
    } catch {
        // 即使接口失败也清理本地状态，避免卡住
    }

    if (authType === 'admin') {
        store.commit('setAdminLoggedIn', false)
    } else if (authType === 'user') {
        store.commit('clearUserSession')
    } else {
        store.commit('setAdminLoggedIn', false)
        store.commit('clearUserSession')
    }
}

export async function logoutAndRedirect(router, authType = 'user') {
    await logout(authType)
    if (authType === 'admin') {
        router.push({ name: 'adminLogin' })
    } else {
        router.push({ name: 'login' })
    }
}
