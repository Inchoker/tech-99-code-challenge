export interface Book {
  id?: number;
  title: string;
  author: string;
  isbn?: string;
  publishedYear?: number;
  genre?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBookRequest {
  title: string;
  author: string;
  isbn?: string;
  publishedYear?: number;
  genre?: string;
  description?: string;
}

export interface UpdateBookRequest {
  title?: string;
  author?: string;
  isbn?: string;
  publishedYear?: number;
  genre?: string;
  description?: string;
}

export interface BookFilters {
  title?: string;
  author?: string;
  genre?: string;
  limit?: number;
  offset?: number;
}
