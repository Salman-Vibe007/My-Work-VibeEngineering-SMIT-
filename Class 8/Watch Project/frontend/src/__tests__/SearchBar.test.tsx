import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SearchBar from "@/components/SearchBar";

const { routerMock } = vi.hoisted(() => ({ routerMock: { push: vi.fn() } }));

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

describe("SearchBar", () => {
  it("submits the trimmed query as the q param", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);
    const input = screen.getByRole("textbox");
    await user.type(input, "  omega speedmaster  ");
    await user.click(screen.getByRole("button"));
    expect(routerMock.push).toHaveBeenCalledWith("/products?q=omega%20speedmaster");
  });

  it("keeps the default value in the input", () => {
    render(<SearchBar defaultValue="rolex" />);
    expect(screen.getByRole("textbox")).toHaveValue("rolex");
  });

  it("navigates to the bare catalog when the query is empty", async () => {
    const user = userEvent.setup();
    render(<SearchBar defaultValue="x" />);
    const input = screen.getByRole("textbox");
    await user.clear(input);
    await user.click(screen.getByRole("button"));
    expect(routerMock.push).toHaveBeenCalledWith("/products?");
  });
});
