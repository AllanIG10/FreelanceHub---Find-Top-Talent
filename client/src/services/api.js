import axios from 'axios'

// ============================================================
// Base axios instance
// ============================================================
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
})

// Request interceptor – attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor – handle 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error.response?.data || error)
  }
)

// ============================================================
// AUTH API
// ============================================================
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  googleAuth: () => { window.location.href = '/api/auth/google' },
}

// ============================================================
// JOBS API
// ============================================================
export const jobsAPI = {
  getJobs: (params = {}) => api.get('/jobs', { params }),
  getJob: (id) => api.get(`/jobs/${id}`),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/jobs/${id}`),
  getClientJobs: (params = {}) => api.get('/jobs/client/my-jobs', { params }),
  getJobProposals: (jobId, params = {}) => api.get(`/jobs/${jobId}/proposals`, { params }),
  searchJobs: (query) => api.get('/jobs/search', { params: { q: query } }),
  getFeaturedJobs: () => api.get('/jobs/featured'),
  getSimilarJobs: (id) => api.get(`/jobs/${id}/similar`),
  saveDraft: (data) => api.post('/jobs/draft', data),
}

// ============================================================
// PROPOSALS API
// ============================================================
export const proposalsAPI = {
  submitProposal: (data) => api.post('/proposals', data),
  getMyProposals: (params = {}) => api.get('/proposals/my', { params }),
  getProposal: (id) => api.get(`/proposals/${id}`),
  updateProposalStatus: (id, status) => api.patch(`/proposals/${id}/status`, { status }),
  withdrawProposal: (id) => api.delete(`/proposals/${id}`),
  updateProposal: (id, data) => api.put(`/proposals/${id}`, data),
}

// ============================================================
// USERS API
// ============================================================
export const usersAPI = {
  getProfile: (id) => api.get(`/users/profile/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadAvatar: (file) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return api.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getDashboardStats: () => api.get('/users/stats/dashboard'),
  getFreelancers: (params = {}) => api.get('/users/freelancers', { params }),
  getUserReviews: (userId) => api.get(`/users/${userId}/reviews`),
  updateAvailability: (status) => api.patch('/users/availability', { status }),
}

// ============================================================
// MESSAGES API
// ============================================================
export const messagesAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getOrCreateConversation: (userId) => api.post('/messages/conversations', { userId }),
  getMessages: (convId, params = {}) => api.get(`/messages/conversations/${convId}/messages`, { params }),
  sendMessage: (convId, content, attachments = []) =>
    api.post(`/messages/conversations/${convId}/messages`, { content, attachments }),
  markAsRead: (convId) => api.patch(`/messages/conversations/${convId}/read`),
  deleteMessage: (msgId) => api.delete(`/messages/${msgId}`),
}

// ============================================================
// REVIEWS API
// ============================================================
export const reviewsAPI = {
  submitReview: (data) => api.post('/reviews', data),
  getUserReviews: (userId) => api.get(`/reviews/user/${userId}`),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
}

// ============================================================
// ADMIN API
// ============================================================
export const adminAPI = {
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  suspendUser: (id) => api.patch(`/admin/users/${id}/suspend`),
  getAnalytics: () => api.get('/admin/analytics'),
  getJobs: (params = {}) => api.get('/admin/jobs', { params }),
  getAdminJobs: (params = {}) => api.get('/admin/jobs', { params }),
  deleteJob: (id) => api.delete(`/admin/jobs/${id}`),
  updateJob: (id, data) => api.put(`/admin/jobs/${id}`, data),
  getAdminProposals: (params = {}) => api.get('/admin/proposals', { params }),
  getRevenue: () => api.get('/admin/revenue'),
  getActivityTimeline: (days = 30) => api.get('/admin/activity', { params: { days } }),
}

// ============================================================
// AI API
// ============================================================
export const aiAPI = {
  generateProposal: (data) => api.post('/ai/generate-proposal', data),
  recommendJobs: (data) => api.post('/ai/recommend-jobs', data),
  analyzeResume: (data) => {
    const formData = new FormData()
    if (data.file) formData.append('resume', data.file)
    if (data.skills) formData.append('skills', JSON.stringify(data.skills))
    return api.post('/ai/analyze-resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  improveProfile: (data) => api.post('/ai/improve-profile', data),
  suggestBid: (data) => api.post('/ai/suggest-bid', data),
}

// ============================================================
// NOTIFICATIONS API
// ============================================================
export const notificationsAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
}

export default api
