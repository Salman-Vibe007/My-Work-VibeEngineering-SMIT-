import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminUsersClient from "@/components/AdminUsersClient";
import { makeAdminUser } from "./fixtures";

const { usersState } = vi.hoisted(() => ({
  usersState: {
    updates: [] as Array<{ table: string; payload: unknown; eq: [string, unknown] }>,
    updateError: null as { message: string } | null,
  },
}));

function makeUsersClient() {
  return {
    from: (table: string) => {
      let payload: unknown;
      const chain = {
        update: (p: unknown) => {
          payload = p;
          return chain;
        },
        eq: (col: string, value: unknown) => {
          usersState.updates.push({ table, payload, eq: [col, value] });
          return Promise.resolve({ data: null, error: usersState.updateError });
        },
      };
      return chain;
    },
    auth: {
      getUser: async () => ({ data: { user: { id: "admin-1" } }, error: null }),
    },
  };
}

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => makeUsersClient(),
}));

const users = [
  makeAdminUser({
    id: "admin-1",
    full_name: "Alex Admin",
    email: "alex@example.com",
    is_admin: true,
    order_count: 0,
  }),
  makeAdminUser({
    id: "user-1",
    full_name: "Sam Carter",
    email: "sam@example.com",
    order_count: 2,
    total_spent: 549.98,
    last_order_at: "2026-04-01T00:00:00Z",
  }),
  makeAdminUser({ id: "user-2", full_name: null, email: "ghost@example.com" }),
];

describe("AdminUsersClient", () => {
  beforeEach(() => {
    usersState.updates = [];
    usersState.updateError = null;
  });

  it("renders a row per user with stats and role badge", () => {
    render(<AdminUsersClient users={users} currentUserId="admin-1" />);
    expect(screen.getByText("3 registered users")).toBeInTheDocument();
    expect(screen.getByText("Alex Admin")).toBeInTheDocument();
    expect(screen.getByText("sam@example.com")).toBeInTheDocument();
    expect(screen.getByText("no email on file")).toBeInTheDocument();
    expect(screen.getByText("2", { selector: "td" })).toBeInTheDocument();
    expect(screen.getByText("$549.98")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getAllByText("Customer")).toHaveLength(2);
    expect(screen.getByText("(you)")).toBeInTheDocument();
  });

  it("filters users by name as the query changes", async () => {
    const user = userEvent.setup();
    render(<AdminUsersClient users={users} currentUserId="admin-1" />);
    await user.type(screen.getByRole("searchbox"), "sam");
    expect(screen.getByText("Sam Carter")).toBeInTheDocument();
    expect(screen.queryByText("Alex Admin")).not.toBeInTheDocument();
    await user.type(screen.getByRole("searchbox"), " @example.com");
    expect(screen.getByText("ghost@example.com")).toBeInTheDocument();
  });

  it("shows an empty state when no users match the search", async () => {
    const user = userEvent.setup();
    render(<AdminUsersClient users={users} currentUserId="admin-1" />);
    await user.type(screen.getByRole("searchbox"), "nobody-here");
    expect(screen.getByText("No users match your search.")).toBeInTheDocument();
  });

  it("grants the admin role through a profiles update", async () => {
    const user = userEvent.setup();
    render(<AdminUsersClient users={users} currentUserId="admin-1" />);
    const samRow = screen.getByText("Sam Carter").closest("tr") as HTMLElement;
    await user.click(within(samRow).getByRole("button", { name: "Make admin" }));
    await waitFor(() =>
      expect(usersState.updates).toEqual([
        {
          table: "profiles",
          payload: { is_admin: true },
          eq: ["id", "user-1"],
        },
      ])
    );
    await waitFor(() => expect(screen.getByText("Alex Admin")).toBeInTheDocument());
    // Sam should now read as admin
    await waitFor(() => expect(screen.getAllByText("Admin")).toHaveLength(2));
    // Sam now has a Revoke admin button
    expect(
      within(samRow).getByRole("button", { name: "Revoke admin" })
    ).toBeInTheDocument();
  });

  it("revokes the admin role for a customer with admin access", async () => {
    const user = userEvent.setup();
    const mixed = [
      makeAdminUser({
        id: "user-9",
        full_name: "Dev Oliner",
        is_admin: true,
      }),
    ];
    render(<AdminUsersClient users={mixed} currentUserId="admin-1" />);
    await user.click(screen.getByRole("button", { name: "Revoke admin" }));
    await waitFor(() =>
      expect(usersState.updates).toEqual([
        {
          table: "profiles",
          payload: { is_admin: false },
          eq: ["id", "user-9"],
        },
      ])
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Make admin" })
      ).toBeInTheDocument()
    );
  });

  it("disables role changes for the current user", () => {
    render(<AdminUsersClient users={users} currentUserId="admin-1" />);
    const buttons = screen.getAllByRole("button");
    const selfButton = buttons.find((b) => b.title === "You cannot change your own role");
    expect(selfButton).toBeTruthy();
    expect(selfButton).toBeDisabled();
  });

  it("reverts and surfaces an error when the update fails", async () => {
    usersState.updateError = { message: "row-level security violation" };
    const user = userEvent.setup();
    render(<AdminUsersClient users={users} currentUserId="admin-1" />);
    const samRow = screen.getByText("Sam Carter").closest("tr") as HTMLElement;
    await user.click(within(samRow).getByRole("button", { name: "Make admin" }));
    await waitFor(() =>
      expect(
        screen.getByRole("alert")
      ).toHaveTextContent("Failed to update role for Sam Carter.")
    );
    // Reverted: Sam is back to a customer
    expect(screen.getAllByText("Customer")).toHaveLength(2);
  });
});
