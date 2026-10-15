import { describe, expect, it } from "vitest";
import { filterUsers, mergeUsersWithOrders } from "@/lib/users";
import { makeAdminUser, makeOrder, makeProfile } from "./fixtures";

describe("mergeUsersWithOrders", () => {
  it("attaches order stats to the owning user", () => {
    const profiles = [
      makeProfile(),
      makeProfile({ id: "user-2", full_name: "Dana Lee" }),
    ];
    const orders = [
      makeOrder({ user_id: "user-1", total: 100.1, created_at: "2026-03-01T00:00:00Z" }),
      makeOrder({
        user_id: "user-1",
        total: 50.25,
        created_at: "2026-04-01T00:00:00Z",
      }),
      makeOrder({ user_id: "user-2", total: 25, created_at: "2026-02-01T00:00:00Z" }),
    ];

    const users = mergeUsersWithOrders(profiles, orders);
    expect(users).toHaveLength(2);

    const sam = users.find((u) => u.id === "user-1");
    expect(sam?.order_count).toBe(2);
    expect(sam?.total_spent).toBe(150.35);
    expect(sam?.last_order_at).toBe("2026-04-01T00:00:00Z");
    expect(sam?.email).toBe("sam@example.com");

    const dana = users.find((u) => u.id === "user-2");
    expect(dana?.order_count).toBe(1);
    expect(dana?.total_spent).toBe(25);
  });

  it("defaults to empty stats for users without orders", () => {
    const users = mergeUsersWithOrders([makeProfile({ id: "user-9" })], []);
    expect(users[0]).toMatchObject({
      order_count: 0,
      total_spent: 0,
      last_order_at: null,
      email: null,
    });
  });

  it("ignores orders with no user", () => {
    const users = mergeUsersWithOrders(
      [makeProfile()],
      [makeOrder({ user_id: null, total: 999 })]
    );
    expect(users[0].order_count).toBe(0);
    expect(users[0].total_spent).toBe(0);
  });

  it("rounds lifetime spend to cents", () => {
    const users = mergeUsersWithOrders(
      [makeProfile()],
      [
        makeOrder({ total: 0.1, created_at: "2026-01-01T00:00:00Z" }),
        makeOrder({ total: 0.2, created_at: "2026-01-02T00:00:00Z" }),
      ]
    );
    expect(users[0].total_spent).toBe(0.3);
  });

  it("preserves profile identity fields", () => {
    const profile = makeProfile({ id: "user-x", full_name: "Xy", is_admin: true });
    const [user] = mergeUsersWithOrders([profile], []);
    expect(user.id).toBe("user-x");
    expect(user.full_name).toBe("Xy");
    expect(user.is_admin).toBe(true);
    expect(user.created_at).toBe(profile.created_at);
  });
});

describe("filterUsers", () => {
  const users = [
    makeAdminUser({ id: "u1", full_name: "Sam Carter", email: "sam@example.com" }),
    makeAdminUser({ id: "u2", full_name: "Dana Lee", email: "dana@example.com" }),
    makeAdminUser({ id: "u3", full_name: null, email: "ghost@example.com" }),
  ];

  it("returns all users for an empty or whitespace query", () => {
    expect(filterUsers(users, "")).toHaveLength(3);
    expect(filterUsers(users, "   ")).toHaveLength(3);
  });

  it("matches on full name case-insensitively", () => {
    expect(filterUsers(users, "SAm").map((u) => u.id)).toEqual(["u1"]);
  });

  it("matches on email case-insensitively", () => {
    expect(filterUsers(users, "DANA@example").map((u) => u.id)).toEqual(["u2"]);
  });

  it("matches users without a name by email", () => {
    expect(filterUsers(users, "ghost").map((u) => u.id)).toEqual(["u3"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(filterUsers(users, "nobody")).toHaveLength(0);
  });
});
