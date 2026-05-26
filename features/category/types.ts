export interface Category {
  categoryId: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryCount {
  category: string;
  count: number;
}
