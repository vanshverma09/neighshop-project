export interface ISubcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  created_at?: string;
}

export interface ICategory {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  display_order: number;
  created_at?: string;
  subcategories?: ISubcategory[];
}
