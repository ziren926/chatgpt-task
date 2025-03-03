// src/types/api.ts
export interface Tool {
  id: string;
  name: string;
  desc: string;
  url: string;
  logo: string;
  catelog: string;
  content?: string;
  hide?: boolean;
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

export interface ToolWithSort extends Tool {
  sort: number;
}

export interface ToolFormValues extends Omit<Tool, 'id'> {
  sort: number;
  hide: boolean;
}

export interface ToolUpdateValues extends ToolFormValues {
  id: string;
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