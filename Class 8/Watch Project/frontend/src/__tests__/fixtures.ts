import type { AdminUser, Order, Product, Profile } from "@/types/database";

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    name: "Chronos Automatic 42",
    brand: "Chronos",
    description: "Swiss automatic movement",
    price: 499.99,
    original_price: null,
    images: ["/watches/chronos-42.jpg"],
    movement_type: "automatic",
    case_material: "stainless steel",
    case_size: "42mm",
    dial_color: "black",
    water_resistance: "100m",
    style: "dress",
    stock: 10,
    sku: "CH-AUTO-42",
    featured: false,
    category_id: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user-1",
    full_name: "Sam Carter",
    phone: null,
    is_admin: false,
    created_at: "2026-02-01T00:00:00Z",
    ...overrides,
  };
}

export function makeAdminUser(overrides: Partial<AdminUser> = {}): AdminUser {
  return {
    id: "user-1",
    full_name: "Sam Carter",
    email: "sam@example.com",
    is_admin: false,
    created_at: "2026-02-01T00:00:00Z",
    order_count: 0,
    total_spent: 0,
    last_order_at: null,
    ...overrides,
  };
}

export function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    user_id: "user-1",
    status: "confirmed",
    total: 100,
    shipping_name: "Sam Carter",
    shipping_email: "sam@example.com",
    shipping_address: "1 Main St",
    shipping_city: "Springfield",
    shipping_state: null,
    shipping_postal_code: "11111",
    shipping_country: "US",
    payment_method: "mock",
    payment_status: "paid",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    ...overrides,
  };
}
