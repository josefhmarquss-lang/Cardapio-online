import type { Category, Product, Store } from "@/lib/types";

export type PublicStore = Omit<Store, "sound_enabled" | "is_active" | "created_at" | "updated_at">;
export type MenuCategory = Category & { products: Product[] };

export type CartLine = {
  key: string;
  product_id: number;
  quantity: number;
  option_ids: string[];
  notes: string;
};
