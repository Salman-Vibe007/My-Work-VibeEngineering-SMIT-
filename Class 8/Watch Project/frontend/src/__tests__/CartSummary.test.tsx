import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CartSummary from "@/components/CartSummary";
import { useCartStore } from "@/store/cart";
import { makeProduct } from "./fixtures";

vi.mock("next/link", () => ({
  default: (props: { href: string; children: React.ReactNode }) => (
    <a href={props.href}>{props.children}</a>
  ),
}));

describe("CartSummary", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("shows subtotal, shipping, tax, and total below the free-shipping threshold", () => {
    useCartStore.setState({
      items: [{ product: makeProduct({ price: 100 }), quantity: 2 }],
    });
    render(<CartSummary />);
    expect(screen.getByText("Subtotal (1 items)")).toBeInTheDocument();
    expect(screen.getByText("$200.00")).toBeInTheDocument();
    expect(screen.getByText("$25.00")).toBeInTheDocument();
    expect(screen.getByText("$16.00")).toBeInTheDocument();
    expect(screen.getByText("$241.00")).toBeInTheDocument();
    expect(
      screen.getByText("Add $300.00 more for free shipping")
    ).toBeInTheDocument();
  });

  it("shows free shipping at or above the threshold", () => {
    useCartStore.setState({
      items: [{ product: makeProduct({ price: 500 }), quantity: 1 }],
    });
    render(<CartSummary />);
    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("$540.00")).toBeInTheDocument();
    expect(
      screen.queryByText(/more for free shipping/i)
    ).not.toBeInTheDocument();
  });

  it("links to checkout and the catalog", () => {
    render(<CartSummary />);
    expect(screen.getByRole("link", { name: "Proceed to Checkout" })).toHaveAttribute(
      "href",
      "/checkout"
    );
    expect(screen.getByRole("link", { name: "Continue Shopping" })).toHaveAttribute(
      "href",
      "/products"
    );
  });
});
