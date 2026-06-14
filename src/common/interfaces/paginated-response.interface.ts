export interface IPaginationMeta {
  total: number;
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  totalPages: number;
}

export interface IPaginatedResponse<T> {
  edges: T[];
  pagination: IPaginationMeta;
}
