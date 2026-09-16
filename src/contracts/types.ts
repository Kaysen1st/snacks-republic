export type Role = 'admin' | 'manager' | 'cashier' | 'kitchen';
export type OrderStatus = 'accepted' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export interface Variant { id: number; product_id: number; serving_option_id: number; serving: string; sku: string; price: string | null; recipe_ready: boolean }
export interface ProductOption { id: number; name: string; group_id: number; group_name: string; required: boolean; price: string; variant_id: number }
export interface Product { id: number; category_id: number; category: string; name: string; slug: string; description: string; image_path: string; is_published: boolean; deleted_at: string | null; variants: Variant[]; options: ProductOption[] }
export interface Category { id: number; name: string; slug: string }
export interface Staff { id: number; name: string; role: Role }
export interface CartItem { key: string; product: Product; variant: Variant; option_ids: number[]; quantity: number }
export interface OrderInput { items: { variant_id: number; quantity: number; option_ids: number[] }[]; customer_name: string; notes?: string; payment_method?: 'cash' | 'gcash'; tendered?: string; reference?: string; expected_total?: string }
export interface Order { id: number; order_number: string; customer_name: string; channel: string; status: OrderStatus; payment_status: string; total_amount: string; notes: string; created_at: string; items: { id: number; product_name: string; serving: string; quantity: number; unit_price: string; line_total: string; options: { name: string; price: string }[] }[]; tracking_token?: string }
export interface StoreSettings { name: string; headline: string; about: string; address: string | null; hours: string | null; phone: string | null; facebook_url: string; currency: string; accepting_orders: boolean }
export interface Catalog { products: Product[]; categories: Category[]; store: StoreSettings; demo: boolean }
