import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // Set axios default authorization header
  const setAuthHeader = (tok) => {
    if (tok) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${tok}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token')
      if (storedToken) {
        setAuthHeader(storedToken)
        try {
          const res = await axios.get('/api/auth/me')
          setUser(res.data.user || res.data)
          setToken(storedToken)
        } catch (err) {
          localStorage.removeItem('token')
          setToken(null)
          setUser(null)
          setAuthHeader(null)
        }
      }
      setLoading(false)
    }
    initAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password })
    const { token: newToken, user: newUser } = res.data || res
    localStorage.setItem('token', newToken)
    setAuthHeader(newToken)
    setToken(newToken)
    setUser(newUser)
    return newUser
  }, [])

  const register = useCallback(async (data) => {
    const res = await axios.post('/api/auth/register', data)
    const { token: newToken, user: newUser } = res.data || res
    localStorage.setItem('token', newToken)
    setAuthHeader(newToken)
    setToken(newToken)
    setUser(newUser)
    return newUser
  }, [])

  const loginWithGoogle = useCallback(() => {
    window.location.href = '/api/auth/google'
  }, [])

  const logout = useCallback(async () => {
    try {
      await axios.post('/api/auth/logout')
    } catch (_) {}
    localStorage.removeItem('token')
    setAuthHeader(null)
    setToken(null)
    setUser(null)
  }, [])

  const updateUser = useCallback((data) => {
    setUser(prev => ({ ...prev, ...data }))
  }, [])

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    loginWithGoogle,
    logout,
    updateUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
