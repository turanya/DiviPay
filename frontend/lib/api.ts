import { Expense } from '../types';

// Use correct environment variable name
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

console.log('🌐 API Base URL:', API_BASE_URL); // For debugging

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;

  const headers = new Headers({
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  });

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include' as RequestCredentials
  };

  try {
    console.log(`Making API call to: ${API_BASE_URL}${endpoint}`, { method: config.method });
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!isJson && !response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const error = new Error(data?.message || 'API request failed') as any;
      error.response = {
        status: response.status,
        data,
        headers: Object.fromEntries(response.headers.entries())
      };
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('API Error:', { endpoint, error: error.message });
    throw error;
  }
}

// Auth API calls
export const authAPI = {
  register: async (userData: any) => {
    const data = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  login: async (credentials: any) => {
    const data = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token && typeof window !== 'undefined') {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  getProfile: async () => {
    return await apiCall('/auth/profile');
  },

  updateProfile: async (profileData: any) => {
    return await apiCall('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
    return Promise.resolve();
  },

  changePassword: async (passwordData: any) => {
    return await apiCall('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }),
    });
  },
};

// Groups API calls
export const groupsAPI = {
  create: async (groupData: any) => {
    return await apiCall('/groups', {
      method: 'POST',
      body: JSON.stringify(groupData),
    });
  },

  getUserGroups: async () => {
    return await apiCall('/groups');
  },

  getGroupDetails: async (groupId: string) => {
    try {
      console.log('Fetching group details for ID:', groupId);
      const response = await apiCall(`/groups/${groupId}`);
      console.log('Group details response:', response);
      
      if (response.success && response.group) {
        return response.group;
      } else if (response._id || response.id) {
        return response;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error in getGroupDetails:', error);
      throw error;
    }
  },

  joinGroup: async (groupId: string) => {
    return await apiCall(`/groups/${groupId}/join`, { method: 'POST' });
  },

  leaveGroup: async (groupId: string) => {
    return await apiCall(`/groups/${groupId}/leave`, { method: 'POST' });
  },

  removeMember: async (groupId: string, memberId: string) => {
    return await apiCall(`/groups/${groupId}/members/${memberId}`, {
      method: 'DELETE',
    });
  },
};

// Expenses API calls
export const expensesAPI = {
  add: async (expenseData: Omit<Expense, '_id' | 'createdAt'> & { date: string }): Promise<Expense> => {
    try {
      const backendData = {
        description: expenseData.description,
        amount: expenseData.amount,
        groupId: expenseData.group,
        category: expenseData.category,
        splitBetween: expenseData.splitBetween?.map(split => ({
          user: split.user._id || split.user.id,
          amount: split.amount
        })) || []
      };

      console.log('Sending expense data to backend:', backendData);
      const response = await apiCall('/expenses', {
        method: 'POST',
        body: JSON.stringify(backendData),
      });

      console.log('Backend response:', response);
      
      if (!response || (!response._id && !response.expense?._id)) {
        throw new Error('Invalid response from server');
      }

      return response.expense || response;
    } catch (error) {
      console.error('Error in expensesAPI.add:', error);
      throw error;
    }
  },

  getUserExpenses: async (page = 1, limit = 20) => {
    return await apiCall(`/expenses/user?page=${page}&limit=${limit}`);
  },

  getGroupExpenses: async (groupId: string, page = 1, limit = 20) => {
    return await apiCall(`/expenses/group/${groupId}?page=${page}&limit=${limit}`);
  },

  getGroupBalance: async (groupId: string) => {
    return await apiCall(`/expenses/balance/${groupId}`);
  },

  update: async (expenseId: string, updateData: any) => {
    return await apiCall(`/expenses/${expenseId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  },

  delete: async (expenseId: string) => {
    return await apiCall(`/expenses/${expenseId}`, {
      method: 'DELETE',
    });
  },

  getSettlements: async () => {
    return await apiCall('/expenses/settlements');
  },

  markSettlement: async (settlementData: any) => {
    return await apiCall('/expenses/settle', {
      method: 'POST',
      body: JSON.stringify(settlementData),
    });
  },
};
