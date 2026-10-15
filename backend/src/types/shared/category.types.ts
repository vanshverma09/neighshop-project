export interface ISubcategory {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  display_order: number;
  created_at?: string;
}

export interface ICategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  description?: string | null;
  display_order: number;
  created_at?: string;
  ad_count?: number;
  subcategories?: ISubcategory[];
}
