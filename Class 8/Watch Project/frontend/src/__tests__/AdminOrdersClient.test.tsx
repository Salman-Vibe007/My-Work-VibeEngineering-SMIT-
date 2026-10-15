import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminOrdersClient from "@/components/AdminOrdersClient";

const { ordersState } = vi.hoisted(() => ({
  ordersState: {
    updates: [] as Array<{ table: string; payload: unknown; eq: [string, unknown] }>,
    updateError: null as { message: string } | null,
  },
}));

function makeOrdersClient() {
  return {
    from: (table: string) => {
      let payload: unknown;
      const chain = {
        update: (p: unknown) => {
          payload = p;
          return chain;
        },
        eq: (col: string, value: unknown) => {
          ordersState.updates.push({ table, payload, eq: [col, value] });
          return Promise.resolve({ data: null, error: ordersState.updateError });
        },
      };
      return chain;
    },
  };
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => makeOrdersClient(),
}));

const orders = [
  {
    id: "abcdef123456",
    status: "pending",
    total: 149.99,
    shipping_name: "Sam Carter",
    shipping_email: "sam@example.com",
    shipping_address: "1 Main St",
    shipping_city: "Springfield",
    shipping_postal_code: "11111",
    payment_status: "paid",
    created_at: "2026-03-01T00:00:00Z",
    order_items: [
      {
        id: "oi-1",
        product_name: "Chronos Automatic 42",
        quantity: 1,
        price: 99.99,
      },
      {
        id: "oi-2",
        product_name: "Steel Bracelet",
        quantity: 2,
        price: 25,
      },
    ],
  },
];

describe("AdminOrdersClient", () => {
  beforeEach(() => {
    ordersState.updates = [];
    ordersState.updateError = null;
  });

  it("renders the order summary row", () => {
    render(<AdminOrdersClient orders={orders} />);
    expect(screen.getByText("1 total orders")).toBeInTheDocument();
    expect(screen.getByText("abcdef12")).toBeInTheDocument();
    expect(screen.getByText("Sam Carter")).toBeInTheDocument();
    expect(screen.getByText("sam@example.com")).toBeInTheDocument();
    expect(screen.getByText("$149.99")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toHaveValue("pending");
  });

  it("persists a status change when Save is clicked", async () => {
    const user = userEvent.setup();
    render(<AdminOrdersClient orders={orders} />);
    await user.selectOptions(screen.getByRole("combobox"), "shipped");
    const save = screen.getByRole("button", { name: "Save" });
    await user.click(save);
    await waitFor(() =>
      expect(ordersState.updates).toEqual([
        { table: "orders", payload: { status: "shipped" }, eq: ["id", "abcdef123456"] },
      ])
    );
    // Save disappears once there is no pending change
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Save" })
      ).not.toBeInTheDocument()
    );
  });

  it("keeps the pending status when the update fails", async () => {
    ordersState.updateError = { message: "row-level security violation" };
    const user = userEvent.setup();
    render(<AdminOrdersClient orders={orders} />);
    await user.selectOptions(screen.getByRole("combobox"), "delivered");
    await user.click(screen.getByRole("button", { name: "Save" }));
    // Still awaiting with the failed status in the select
    await waitFor(() =>
      expect(screen.getByRole("combobox")).toHaveValue("delivered")
    );
  });

  it("expands order details with address and line items", async () => {
    const user = userEvent.setup();
    render(<AdminOrdersClient orders={orders} />);
    expect(screen.queryByText("Order Items")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Details" }));
    expect(screen.getByText("Shipping Address")).toBeInTheDocument();
    expect(screen.getByText("1 Main St")).toBeInTheDocument();
    expect(screen.getByText("Springfield, 11111")).toBeInTheDocument();
    const row = screen.getByText("Order Items").closest("tr") as HTMLElement;
    expect(within(row).getByText("Chronos Automatic 42 x 1")).toBeInTheDocument();
    expect(within(row).getByText("Steel Bracelet x 2")).toBeInTheDocument();
    // Collapses again
    await user.click(screen.getByRole("button", { name: "Hide" }));
    expect(screen.queryByText("Shipping Address")).not.toBeInTheDocument();
  });
});
