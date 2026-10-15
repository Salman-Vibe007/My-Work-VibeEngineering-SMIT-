import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "@supabase/supabase-js";
import CheckoutPage from "@/app/checkout/page";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { calcOrderTotals } from "@/lib/cart";
import { makeProduct } from "./fixtures";

const { routerMock, checkoutState } = vi.hoisted(() => ({
  routerMock: { push: vi.fn() },
  checkoutState: {
    inserts: [] as Array<{ table: string; payload: unknown }>,
    updates: [] as Array<{ table: string; payload: unknown; eq: [string, unknown] }>,
    failOrdersInsert: false,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("next/link", () => ({
  default: (props: { href: string; children: React.ReactNode }) => (
    <a href={props.href}>{props.children}</a>
  ),
}));

function makeCheckoutClient() {
  const orderRow = {
    id: "ord-1",
    user_id: "u1",
    status: "confirmed",
    total: 0,
    shipping_name: "",
    shipping_email: "",
    shipping_address: "",
    shipping_city: "",
    shipping_state: null,
    shipping_postal_code: "",
    shipping_country: "US",
    payment_method: "mock",
    payment_status: "paid",
    created_at: "2026-10-04T00:00:00Z",
    updated_at: "2026-10-04T00:00:00Z",
  };

  const insertThenable = (table: string, payload: unknown) => {
    checkoutState.inserts.push({ table, payload });
    const result = { data: payload, error: null };
    const obj = (checkoutState.failOrdersInsert && table === "orders"
      ? Promise.reject(new Error("database unavailable"))
      : Promise.resolve(result)
    ) as unknown as { [key: string]: unknown };
    obj.select = () => obj;
    obj.single = () =>
      checkoutState.failOrdersInsert && table === "orders"
        ? Promise.reject(new Error("database unavailable"))
        : Promise.resolve({ data: orderRow, error: null });
    obj.eq = () => Promise.resolve({ data: null, error: null });
    // Avoid unhandled-rejection noise when the orders insert is sabotaged.
    (obj as unknown as Promise<unknown>).catch?.(() => {});
    return obj;
  };

  return {
    from: (table: string) => {
      const builder: Record<string, unknown> = {};
      builder.update = (payload: unknown) => {
        builder.eq = (col: string, value: unknown) => {
          checkoutState.updates.push({ table, payload, eq: [col, value] });
          return Promise.resolve({ data: null, error: null });
        };
        return builder;
      };
      builder.insert = (payload: unknown) => insertThenable(table, payload);
      return builder;
    },
    auth: {
      getUser: async () => ({ data: { user: { id: "u1" } }, error: null }),
    },
  };
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => makeCheckoutClient(),
}));

const watch = makeProduct({ price: 100, stock: 5 });
const bracelet = makeProduct({ id: "prod-2", name: "Steel Bracelet", price: 50, stock: 3 });
// Subtotal: 2 * 100 + 1 * 50 = 250; shipping 25; tax 20; total 295
const expected = calcOrderTotals(250);

const fakeUser = {
  id: "u1",
  email: "sam@example.com",
  user_metadata: { full_name: "Sam Carter" },
} as unknown as User;

async function fillShipping(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Address"), "1 Main St");
  await user.type(screen.getByLabelText("City"), "Springfield");
  await user.type(screen.getByLabelText("Postal Code"), "11111");
  await user.type(screen.getByLabelText("Country"), "US");
}

beforeEach(() => {
  routerMock.push.mockClear();
  checkoutState.inserts = [];
  checkoutState.updates = [];
  checkoutState.failOrdersInsert = false;
  useCartStore.setState({
    items: [
      { product: watch, quantity: 2 },
      { product: bracelet, quantity: 1 },
    ],
  });
  useAuthStore.setState({ user: fakeUser, isAdmin: false, loading: false });
});

describe("checkout flow (integration)", () => {
  it("prefills shipping details from the signed-in user", async () => {
    render(<CheckoutPage />);
    await waitFor(() =>
      expect(screen.getByLabelText("Full Name")).toHaveValue("Sam Carter")
    );
    expect(screen.getByLabelText("Email")).toHaveValue("sam@example.com");
  });

  it("keeps the payment step hidden until shipping is valid", () => {
    render(<CheckoutPage />);
    expect(
      screen.getByRole("button", { name: "Continue to Payment" })
    ).toBeDisabled();
    expect(screen.queryByText("Payment Summary")).not.toBeInTheDocument();
  });

  it("shows the order summary computed from the cart", () => {
    render(<CheckoutPage />);
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("$250.00")).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
    expect(screen.getByText("Tax (8%)")).toBeInTheDocument();
    expect(screen.getByText("$20.00")).toBeInTheDocument();
    expect(screen.getByText("$295.00")).toBeInTheDocument();
    // 250 < 500, so the free-shipping upsell shows
    expect(
      screen.getByText("Add $250.00 more for free shipping")
    ).toBeInTheDocument();
  });

  it("completes the order end-to-end: persists order, items, stock, and redirects", async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);

    // Step 1: fill shipping (name + email are prefilled)
    await fillShipping(user);
    await user.click(screen.getByRole("button", { name: "Continue to Payment" }));

    // Step 2: pay
    await user.click(
      await screen.findByRole("button", {
        name: `Pay $${expected.total.toFixed(2)}`,
      })
    );

    await waitFor(() =>
      expect(routerMock.push).toHaveBeenCalledWith(
        "/checkout/success?orderId=ord-1"
      )
    );

    // Order persisted with the computed totals and the signed-in user
    const orderInsert = checkoutState.inserts.find((i) => i.table === "orders");
    expect(orderInsert?.payload).toMatchObject({
      user_id: "u1",
      status: "confirmed",
      total: expected.total,
      shipping_name: "Sam Carter",
      shipping_email: "sam@example.com",
      shipping_address: "1 Main St",
      shipping_city: "Springfield",
      shipping_postal_code: "11111",
      shipping_country: "US",
      payment_method: "mock",
      payment_status: "paid",
    });

    // Order items mirror the cart lines
    const itemsInsert = checkoutState.inserts.find((i) => i.table === "order_items");
    expect(itemsInsert?.payload).toEqual([
      expect.objectContaining({
        order_id: "ord-1",
        product_id: "prod-1",
        quantity: 2,
        price: 100,
      }),
      expect.objectContaining({
        order_id: "ord-1",
        product_id: "prod-2",
        quantity: 1,
        price: 50,
      }),
    ]);

    // Stock decremented per line
    expect(checkoutState.updates).toContainEqual({
      table: "products",
      payload: { stock: 3 },
      eq: ["id", "prod-1"],
    });
    expect(checkoutState.updates).toContainEqual({
      table: "products",
      payload: { stock: 2 },
      eq: ["id", "prod-2"],
    });

    // Cart cleared
    expect(useCartStore.getState().items).toHaveLength(0);
  }, 15000);

  it("surfaces an error and keeps the cart when order creation fails", async () => {
    checkoutState.failOrdersInsert = true;
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    render(<CheckoutPage />);

    await fillShipping(user);
    await user.click(screen.getByRole("button", { name: "Continue to Payment" }));
    await user.click(screen.getByRole("button", { name: "Pay $295.00" }));

    await waitFor(() => expect(alertSpy).toHaveBeenCalled());
    // Nothing was persisted downstream of the failed order insert
    expect(checkoutState.inserts.find((i) => i.table === "order_items")).toBeUndefined();
    expect(checkoutState.updates).toHaveLength(0);
    // Cart survives for retry
    expect(useCartStore.getState().items).toHaveLength(2);
    alertSpy.mockRestore();
  }, 15000);
});
