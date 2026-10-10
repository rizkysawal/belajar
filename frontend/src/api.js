const API_BASE = '/api';

// Helper for HTTP requests
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('belajar_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || `Request gagal dengan status ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error [${endpoint}]:`, err);
    throw err;
  }
}

export const api = {
  // Auth
  getUsers: () => request('/auth/users'),
  login: (userId, pin) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ userId, pin })
  }),
  getMe: () => request('/auth/me'),

  // Modules (Student)
  getModules: (target, userId, grade = null, category = null) => {
    const params = new URLSearchParams();
    if (target) params.append('target', target);
    if (userId) params.append('userId', userId);
    if (grade) params.append('grade', grade);
    if (category) params.append('category', category);
    return request(`/modules?${params.toString()}`);
  },
  getModule: (id) => request(`/modules/${id}`),

  // Quiz
  submitQuiz: (data) => request('/quiz/submit', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getUserStats: (userId) => request(`/quiz/user-stats/${userId}`),

  // Admin Portal
  getAdminOverview: () => request('/admin/overview'),
  getAdminActivities: ({ child = 'all', days = 'all', search = '' } = {}) => {
    const params = new URLSearchParams();
    if (child) params.append('child', child);
    if (days) params.append('days', days);
    if (search) params.append('search', search);
    return request(`/admin/activities?${params.toString()}`);
  },
  getAdminModules: () => request('/admin/modules'),
  uploadAdminModuleFile: (data) => request('/admin/modules/upload', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  createAdminModule: (data) => request('/admin/modules', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateAdminModule: (id, data) => request(`/admin/modules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteAdminModule: (id) => request(`/admin/modules/${id}`, {
    method: 'DELETE'
  }),
  changeGrade: (userId, grade) => request('/admin/change-grade', {
    method: 'POST',
    body: JSON.stringify({ userId, grade })
  }),
  changePin: (userId, newPin) => request('/admin/change-pin', {
    method: 'POST',
    body: JSON.stringify({ userId, newPin })
  }),
  resetProgress: (userId) => request('/admin/reset-progress', {
    method: 'POST',
    body: JSON.stringify({ userId })
  }),
  // Categories
  getCategories: (grade = null) => {
    const params = new URLSearchParams();
    if (grade) params.append('grade', grade);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request(`/categories${query}`);
  },
  getAdminCategories: () => request('/admin/categories'),
  createAdminCategory: (data) => request('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateAdminCategory: (id, data) => request(`/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteAdminCategory: (id) => request(`/admin/categories/${id}`, {
    method: 'DELETE'
  }),
  seedSampleModules: () => request('/admin/seed-sample-modules', {
    method: 'POST'
  })
};
