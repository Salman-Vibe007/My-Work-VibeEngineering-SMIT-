import { beforeEach, describe, expect, it } from "vitest";
import { useCartStore } from "@/store/cart";
import { makeProduct } from "./fixtures";

describe("cart store", () => {
  const product = makeProduct({ price: 100 });
  const other = makeProduct({ id: "prod-2", name: "Other Watch", price: 50 });

  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("adds a new product with default quantity 1", () => {
    useCartStore.getState().addItem(product);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].product.id).toBe("prod-1");
    expect(items[0].quantity).toBe(1);
  });

  it("merges quantity when the same product is added again", () => {
    const { addItem } = useCartStore.getState();
    addItem(product, 1);
    addItem(product, 2);
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].quantity).toBe(3);
  });

  it("keeps distinct products separate", () => {
    const { addItem } = useCartStore.getState();
    addItem(product);
    addItem(other);
    expect(useCartStore.getState().items).toHaveLength(2);
  });

  it("updates quantity for an existing line", () => {
    useCartStore.getState().addItem(product, 1);
    useCartStore.getState().updateQuantity("prod-1", 4);
    expect(useCartStore.getState().items[0].quantity).toBe(4);
  });

  it("removes a line when quantity is set to zero or negative", () => {
    useCartStore.getState().addItem(product);
    useCartStore.getState().updateQuantity("prod-1", 0);
    expect(useCartStore.getState().items).toHaveLength(0);

    useCartStore.getState().addItem(product);
    useCartStore.getState().updateQuantity("prod-1", -1);
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("removes a single line without touching others", () => {
    const { addItem, removeItem } = useCartStore.getState();
    addItem(product);
    addItem(other);
    removeItem("prod-1");
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].product.id).toBe("prod-2");
  });

  it("clears the whole cart", () => {
    const { addItem, clearCart } = useCartStore.getState();
    addItem(product);
    addItem(other);
    clearCart();
    expect(useCartStore.getState().items).toHaveLength(0);
  });

  it("computes the total as price * quantity per line", () => {
    const { addItem, getTotal, getItemCount } = useCartStore.getState();
    addItem(product, 2);
    addItem(other, 3);
    expect(getTotal()).toBe(2 * 100 + 3 * 50);
    expect(getItemCount()).toBe(5);
  });

  it("returns zero totals for an empty cart", () => {
    expect(useCartStore.getState().getTotal()).toBe(0);
    expect(useCartStore.getState().getItemCount()).toBe(0);
  });
});
