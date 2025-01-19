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
const RETRY_DELAY = 100;

// Error Messages
const ERROR_MESSAGES = {
  NO_TOKEN: '未登錄',
  REQUEST_FAILED: '請求失敗，請稍後重試',
  NETWORK_ERROR: '網絡錯誤，請檢查網絡連接',
  SERVER_ERROR: '服務器錯誤',
  LOGIN_EXPIRED: '登錄已過期，請重新登錄',
};

let isRedirecting = false;

const getToken = () => localStorage.getItem(TOKEN_KEY);

const setToken = async (token: string) => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.setItem(TOKEN_KEY, token);
  // 等待token设置完成
  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
};

const handleLogout = (errorMessage?: string) => {
  if (!isRedirecting) {
    isRedirecting = true;
    localStorage.removeItem(TOKEN_KEY);
    if (errorMessage) {
      message.error(errorMessage);
    }
    setTimeout(() => {
      window.location.href = '/login';
      isRedirecting = false;
    }, 1500);
  }
};

// 核心请求处理函数
const handleRequest = async (url: string, options: RequestInit = {}) => {
  const token = getToken();

  if (!token && !url.includes('/api/login') && !url.includes('/api/check-token')) {
    handleLogout(ERROR_MESSAGES.NO_TOKEN);
    return null;
  }

  try {
    const headers = new Headers({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });

    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      const response = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers
      });

      let data;
      try {
        const text = await response.text();
        data = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('Response parsing error:', e);
        throw new Error('服務器響應格式錯誤');
      }

      if (response.ok) {
        return data;
      }

      if (response.status === 401) {
        if (!url.includes('/api/login')) {
          if (retryCount === 0) {
            retryCount++;
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            continue;
          }
          handleLogout(ERROR_MESSAGES.LOGIN_EXPIRED);
          return null;
        }
      }

      throw new Error(data.message || ERROR_MESSAGES.REQUEST_FAILED);
    }

    throw new Error(ERROR_MESSAGES.REQUEST_FAILED);
  } catch (error) {
    if (!url.includes('/api/check-token')) {
      console.error('Request failed:', error);
      message.error((error as Error).message || ERROR_MESSAGES.REQUEST_FAILED);
    }
    return null;
  }
};

// API Functions
export const FetchList = async (): Promise<ApiResponse> => {
  try {
    const data = await handleRequest('/api/tools');
    if (!data) {
      return { tools: [], catelogs: ["全部工具"] };
    }
    return {
      ...data,
      tools: data.tools.map((tool: Tool) => ({
        ...tool,
        id: tool.id || String(Math.random())
      }))
    };
  } catch (error) {
    return { tools: [], catelogs: ["全部工具"] };
  }
};

export const fetchAdminData = async () => {
  await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
  try {
    const data = await handleRequest('/api/admin/all');
    return data;
  } catch (error) {
    console.error('Failed to fetch admin data:', error);
    return null;
  }
};

export const fetchAddTool = async (data: Omit<Tool, 'id'>) => {
  const response = await handleRequest('/api/tools', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (response) {
    message.success('添加工具成功');
  }
  return response;
};

export const fetchUpdateTool = async (id: string, data: Partial<Tool>) => {
  const response = await handleRequest(`/api/tools/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (response) {
    message.success('更新工具成功');
  }
  return response;
};

export const fetchDeleteTool = async (id: string) => {
  const response = await handleRequest(`/api/tools/${id}`, {
    method: 'DELETE'
  });
  if (response) {
    message.success('刪除工具成功');
  }
  return response;
};

export const fetchExportTools = async () => {
  return await handleRequest('/api/tools/export');
};

export const fetchImportTools = async (data: Tool[]) => {
  const response = await handleRequest('/api/tools/import', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (response) {
    message.success('導入工具成功');
  }
  return response;
};

export const fetchUpdateToolsSort = async (updates: { id: string; sort: number }[]) => {
  const response = await handleRequest('/api/tools/sort', {
    method: 'PUT',
    body: JSON.stringify({ ids: updates.map(update => update.id) })
  });
  if (response) {
    message.success('更新排序成功');
  }
  return response;
};

export const fetchAddCateLog = async (data: { name: string }) => {
  const response = await handleRequest('/api/admin/catelog', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  if (response) {
    message.success('添加分類成功');
  }
  return response;
};

export const fetchUpdateCateLog = async (id: string, data: { name: string }) => {
  const response = await handleRequest(`/api/admin/catelog/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (response) {
    message.success('更新分類成功');
  }
  return response;
};

export const fetchDeleteCatelog = async (id: string) => {
  const response = await handleRequest(`/api/admin/catelog/${id}`, {
    method: 'DELETE'
  });
  if (response) {
    message.success('刪除分類成功');
  }
  return response;
};

export const fetchAddApiToken = async () => {
  const response = await handleRequest('/api/admin/tokens', {
    method: 'POST'
  });
  if (response) {
    message.success('添加 API Token 成功');
  }
  return response;
};

export const fetchDeleteApiToken = async (id: string) => {
  const response = await handleRequest(`/api/admin/tokens/${id}`, {
    method: 'DELETE'
  });
  if (response) {
    message.success('刪除 API Token 成功');
  }
  return response;
};

export const fetchUpdateUser = async (data: {
  username?: string;
  password?: string;
  oldPassword?: string;
}) => {
  const response = await handleRequest('/api/admin/user', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (response) {
    message.success('更新用戶信息成功');
  }
  return response;
};

export const fetchUpdateSetting = async (data: {
  hideGithub?: boolean;
  favicon?: string;
  title?: string;
  govRecord?: string;
}) => {
  const response = await handleRequest('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify(data)
  });
  if (response) {
    message.success('更新設置成功');
  }
  return response;
};

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
      await setToken(data.data.token);
      message.success('登錄成功');
      return data;
    }

    throw new Error(data.message || '登錄失敗');
  } catch (error) {
    console.error('Login failed:', error);
    message.error((error as Error).message || '登錄失敗');
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
  const token = getToken();
  if (!token) {
    return false;
  }

  try {
    const response = await handleRequest('/api/check-token');
    return response !== null;
  } catch (error) {
    return false;
  }
};