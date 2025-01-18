// src/utils/searchEngine.ts
import { Tool } from '../types/api';

export const generateSearchEngineCard = (searchString: string): Tool[] => {
  if (!searchString) return [];

  return [{
    id: String(Date.now()), // 确保返回字符串类型的 id
    name: '搜索引擎',
    url: `https://www.google.com/search?q=${encodeURIComponent(searchString)}`,
    desc: `搜索: ${searchString}`,
    logo: '',
    catelog: '搜索',
    hide: false
  }];
};