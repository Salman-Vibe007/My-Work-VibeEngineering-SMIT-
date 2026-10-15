import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ProductCard from "@/components/ProductCard";
import { useCartStore } from "@/store/cart";
import { makeProduct } from "./fixtures";

vi.mock("next/image", () => ({
  default: (props: { src?: string; alt?: string }) => (
    <img src={props.src} alt={props.alt} />
  ),
}));

vi.mock("next/link", () => ({
  default: (props: { href: string; children: React.ReactNode }) => (
    <a href={props.href}>{props.children}</a>
  ),
}));

describe("ProductCard", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("renders brand, name, price, and details", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.getByText("Chronos")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /chronos automatic 42/i })).toBeInTheDocument();
    expect(screen.getByText("$499.99")).toBeInTheDocument();
    expect(screen.getByText(/automatic/i)).toBeInTheDocument();
    expect(screen.getByText(/stainless steel/i)).toBeInTheDocument();
  });

  it("shows a discount badge when original price is higher", () => {
    render(
      <ProductCard
        product={makeProduct({ price: 500, original_price: 1000 })}
      />
    );
    expect(screen.getByText("-50%")).toBeInTheDocument();
    expect(screen.getByText("$1,000.00")).toBeInTheDocument();
  });

  it("shows no discount badge when there is no original price", () => {
    render(<ProductCard product={makeProduct()} />);
    expect(screen.queryByText(/^-/)).not.toBeInTheDocument();
  });

  it("shows the Featured badge", () => {
    render(<ProductCard product={makeProduct({ featured: true })} />);
    expect(screen.getByText("Featured")).toBeInTheDocument();
  });

  it("renders a watch placeholder when there are no images", () => {
    const { container } = render(
      <ProductCard product={makeProduct({ images: [] })} />
    );
    expect(container.querySelector("img")).toBeNull();
  });

  it("adds the product to the cart when in stock", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={makeProduct()} />);
    await user.click(screen.getByRole("button", { name: "Add to Cart" }));
    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].product.id).toBe("prod-1");
    expect(items[0].quantity).toBe(1);
  });

  it("shows an overlay and disables the button when out of stock", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={makeProduct({ stock: 0 })} />);
    expect(screen.getByText("Out of Stock")).toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Out of Stock" });
    expect(button).toBeDisabled();
    await user.click(button).catch(() => undefined);
    expect(useCartStore.getState().items).toHaveLength(0);
  });
});
