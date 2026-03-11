import api from './axios';

export interface SearchArticle {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  image?: string;
}

export interface SearchResult {
  doctors: import('../types').Doctor[];
  hospitals: import('../types').Hospital[];
  articles: SearchArticle[];
}

export const searchApi = {
  search: (q: string, options?: { doctorsLimit?: number; hospitalsLimit?: number }) =>
    api.get<SearchResult>('/search', {
      params: { q: q || '', doctorsLimit: options?.doctorsLimit, hospitalsLimit: options?.hospitalsLimit },
    }),
};
