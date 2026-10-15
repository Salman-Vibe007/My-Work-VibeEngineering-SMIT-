import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AdminSidebar from "@/components/AdminSidebar";

const { pathnameMock } = vi.hoisted(() => ({ pathnameMock: { value: "/admin" } }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock.value,
}));

vi.mock("next/link", () => ({
  default: (props: { href: string; children: React.ReactNode }) => (
    <a href={props.href}>{props.children}</a>
  ),
}));

describe("AdminSidebar", () => {
  it("renders all admin navigation links", () => {
    render(<AdminSidebar />);
    expect(screen.getByRole("link", { name: /dashboard/i })).toHaveAttribute("href", "/admin");
    expect(screen.getByRole("link", { name: /products/i })).toHaveAttribute("href", "/admin/products");
    expect(screen.getByRole("link", { name: /orders/i })).toHaveAttribute("href", "/admin/orders");
    expect(screen.getByRole("link", { name: /users/i })).toHaveAttribute("href", "/admin/users");
    expect(screen.getByRole("link", { name: /settings/i })).toHaveAttribute("href", "/admin/settings");
  });

  it("renders a link back to the storefront", () => {
    render(<AdminSidebar />);
    expect(screen.getByRole("link", { name: /view store/i })).toHaveAttribute("href", "/");
  });

  it("marks the active section with the accent style", () => {
    pathnameMock.value = "/admin/users";
    render(<AdminSidebar />);
    const usersLink = screen.getByRole("link", { name: /users/i });
    expect(usersLink.className).toContain("bg-[#4682B4]/20");
    const dashboardLink = screen.getByRole("link", { name: /dashboard/i });
    expect(dashboardLink.className).not.toContain("bg-[#4682B4]/20");
  });
});
