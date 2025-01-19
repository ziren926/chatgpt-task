
import { message } from 'antd';

// Types
export interface Tool {
  id: string;
  name: string;
  desc: string;
  url: string;
  logo: string;
  catelog: string;
  content?: string;
  hide?: boolean;
  sort?: number;
}

export interface Category {
  id: string;
  name: string;
}

export interface ApiToken {
  id: string;
  token: string;
  createdAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
  };
}

export interface ApiResponse {
  tools: Tool[];
  catelogs: string[];
  setting?: {
    hideGithub?: boolean;
    favicon?: string;
    title?: string;
    govRecord?: string;
  };
}

// Constants
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:6412';
const TOKEN_KEY = '_token';

// Error Messages
const ERROR_MESSAGES = {
  NO_TOKEN: '未登录或登录已过期',
  REQUEST_FAILED: '请求失败，请稍后重试',
  NETWORK_ERROR: '网络错误，请检查网络连接',
  SERVER_ERROR: '服务器错误',
};

// Helper Functions
const getToken = () => localStorage.getItem(TOKEN_KEY);

const handleError = (error: any) => {
  console.error('API Error:', error);
  if (error.response?.status === 401) {
    message.error(ERROR_MESSAGES.NO_TOKEN);
    logout();
    return;
  }
  message.error(error.message || ERROR_MESSAGES.REQUEST_FAILED);
  throw error;
};

// 通用请求处理函数
const handleRequest = async (url: string, options: RequestInit = {}) => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });

    // 移除 credentials: 'include'，因为我们使用 Bearer token
    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers: headers
    });

    if (!response.ok) {
      if (response.status === 401) {
        // 只对非登录请求清除 token
        if (!url.includes('/api/login')) {
          localStorage.removeItem(TOKEN_KEY);
          window.location.href = '/login';
        }
        throw new Error('未登錄或登錄已過期');
      }
      throw new Error(`請求失敗: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// API Functions
// 工具列表相关
export const FetchList = async (): Promise<ApiResponse> => {
  try {
    const data = await handleRequest('/api/tools');
    return {
      ...data,
      tools: data.tools.map((tool: Tool) => ({
        ...tool,
        id: tool.id || String(Math.random())
      }))
    };
  } catch (error) {
    console.error('Failed to fetch tools:', error);
    return { tools: [], catelogs: ["全部工具"] };
  }
};

export const fetchAdminData = async () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error('未登錄');
  }

  try {
    // 先验证token
    const isValid = await checkLogin();
    if (!isValid) {
      throw new Error('Token无效');
    }

    const data = await handleRequest('/api/admin/all');
    return data;
  } catch (error) {
    console.error('Failed to fetch admin data:', error);
    if (error.message.includes('401')) {
      logout();
    }
    throw error;
  }
};

// 工具管理
export const fetchAddTool = async (data: Omit<Tool, 'id'>) => {
  return handleRequest('/api/tools', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const fetchUpdateTool = async (id: string, data: Partial<Tool>) => {
  return handleRequest(`/api/tools/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const fetchDeleteTool = async (id: string) => {
  return handleRequest(`/api/tools/${id}`, {
    method: 'DELETE'
  });
};

export const fetchExportTools = async () => {
  return handleRequest('/api/tools/export', {
    method: 'GET'
  });
};

export const fetchImportTools = async (data: Tool[]) => {
  return handleRequest('/api/tools/import', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const fetchUpdateToolsSort = async (updates: { id: string; sort: number }[]) => {
  return handleRequest('/api/tools/sort', {
    method: 'PUT',
    body: JSON.stringify({ ids: updates.map(update => update.id) })
  });
};

// 分类管理
export const fetchAddCateLog = async (data: { name: string }) => {
  return handleRequest('/api/admin/catelog', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};

export const fetchUpdateCateLog = async (id: string, data: { name: string }) => {
  return handleRequest(`/api/admin/catelog/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const fetchDeleteCatelog = async (id: string) => {
  return handleRequest(`/api/admin/catelog/${id}`, {
    method: 'DELETE'
  });
};

// API Token 管理
export const fetchAddApiToken = async () => {
  return handleRequest('/api/admin/tokens', {
    method: 'POST'
  });
};

export const fetchDeleteApiToken = async (id: string) => {
  return handleRequest(`/api/admin/tokens/${id}`, {
    method: 'DELETE'
  });
};

// 用户设置
export const fetchUpdateUser = async (data: {
  username?: string;
  password?: string;
  oldPassword?: string;
}) => {
  return handleRequest('/api/admin/user', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

export const fetchUpdateSetting = async (data: {
  hideGithub?: boolean;
  favicon?: string;
  title?: string;
  govRecord?: string;
}) => {
  return handleRequest('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
};

// 认证相关
export const login = async (username: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: username, password }),
    });

    const data = await response.json();

    if (data.success && data.data?.token) {
      // 先清除旧token，再设置新token
      localStorage.removeItem(TOKEN_KEY);
      localStorage.setItem(TOKEN_KEY, data.data.token);

      // 验证token是否正确存储
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (!storedToken) {
        throw new Error('Token存储失败');
      }

      return data;
    }

    throw new Error(data.message || '登錄失敗');
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};


export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = '/login';
};

export const checkLogin = async () => {
  const token = getToken();
  if (!token) return false;

  try {
    await handleRequest('/api/check-token');
    return true;
  } catch (error) {
    console.error('Token validation failed:', error);
    if (error.message.includes('401')) {
      logout();
    }
    return false;
  }
};