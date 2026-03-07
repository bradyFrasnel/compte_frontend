import { defineStore } from 'pinia'

export type UserRole = 'USER' | 'ADMIN'

export interface AuthUser {
  id: number | string
  username: string
  email: string
  role: UserRole
}

interface AuthState {
  token: string | null
  user: AuthUser | null
}

function parseUserFromToken(token: string): AuthUser | null {
  try {
    const [, payloadBase64] = token.split('.')
    if (!payloadBase64) return null

    const payloadJson = atob(payloadBase64)
    const payload = JSON.parse(payloadJson) as {
      sub?: number | string
      username?: string
      email?: string
      role?: UserRole
    }

    if (!payload.sub || !payload.email || !payload.role) {
      return null
    }

    return {
      id: payload.sub,
      username: payload.username || 'Utilisateur',
      email: payload.email,
      role: payload.role,
    }
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    isAdmin: (state) => state.user?.role === 'ADMIN',
  },
  actions: {
    setToken(token: string) {
      this.token = token
      localStorage.setItem('token', token)
      this.user = parseUserFromToken(token)
    },
    clear() {
      this.token = null
      this.user = null
      localStorage.removeItem('token')
    },
    initFromStorage() {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        this.token = storedToken
        this.user = parseUserFromToken(storedToken)

        // Si le token est invalide, on nettoie
        if (!this.user) {
          this.clear()
        }
      }
    },
  },
})

