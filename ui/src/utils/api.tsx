
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
    // 对于非登录请求，如果没有token直接跳转到登录页
    if (!token && !url.includes('/api/login')) {
      message.error('請先登錄');
      window.location.href = '/login';
      throw new Error('未登錄');
    }

    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });

    const response = await fetch(`${BASE_URL}${url}`, {
      ...options,
      headers
    });

    // 先尝试解析返回数据
    let data;
    try {
      const text = await response.text();
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('Response parsing error:', e);
      data = {};
    }

    if (!response.ok) {
      if (response.status === 401) {
        // 对于401错误，如果不是登录请求，才清除token并跳转
        if (!url.includes('/api/login')) {
          message.error('登錄已過期，請重新登錄');
          localStorage.removeItem(TOKEN_KEY);
          // 使用延时跳转，确保用户能看到提示信息
          setTimeout(() => {
            window.location.href = '/login';
          }, 1500);
        }
        throw new Error(data.message || '未登錄或登錄已過期');
      }
      throw new Error(data.message || `請求失敗: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    // 统一的错误处理
    console.error('API Error:', error);
    message.error(error.message || ERROR_MESSAGES.REQUEST_FAILED);
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
  try {
    const data = await handleRequest('/api/admin/all');
    return data;
  } catch (error) {
    console.error('Failed to fetch admin data:', error);
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
  try {
    const response = await handleRequest('/api/admin/catelog', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (response) {
      message.success('添加分類成功');
    }
    return response;
  } catch (error) {
    console.error('Add category failed:', error);
    // 错误已经在handleRequest中处理
    throw error;
  }
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
      // 确保先清除旧token
      localStorage.removeItem(TOKEN_KEY);
      // 设置新token
      localStorage.setItem(TOKEN_KEY, data.data.token);

      message.success('登錄成功');
      return data;
    }

    throw new Error(data.message || '登錄失敗');
  } catch (error) {
    console.error('Login failed:', error);
    message.error(error.message || '登錄失敗');
    throw error;
  }
};


export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  message.success('已登出');
  setTimeout(() => {
    window.location.href = '/login';
  }, 1000);
};


export const checkLogin = async () => {
  try {
    const response = await handleRequest('/api/check-token');
    return true;
  } catch (error) {
    return false;
  }
};