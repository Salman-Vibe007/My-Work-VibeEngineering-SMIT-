import { describe, expect, it } from "vitest";
import { cn, formatPrice, getDiscountPercent } from "@/lib/utils";

describe("formatPrice", () => {
  it("formats whole dollar amounts with cents", () => {
    expect(formatPrice(1234)).toBe("$1,234.00");
  });

  it("keeps fractional cents", () => {
    expect(formatPrice(499.99)).toBe("$499.99");
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe("$0.00");
  });

  it("adds thousands separators", () => {
    expect(formatPrice(1234567.5)).toBe("$1,234,567.50");
  });
});

describe("cn", () => {
  it("joins truthy classes with spaces", () => {
    expect(cn("a", "b", "c")).toBe("a b c");
  });

  it("drops falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  it("returns an empty string when nothing is truthy", () => {
    expect(cn(false, null, undefined)).toBe("");
  });
});

describe("getDiscountPercent", () => {
  it("computes the rounded discount percentage", () => {
    expect(getDiscountPercent(75, 100)).toBe(25);
  });

  it("returns null when there is no original price", () => {
    expect(getDiscountPercent(100, null)).toBeNull();
  });

  it("returns null when the original price is not higher", () => {
    expect(getDiscountPercent(100, 100)).toBeNull();
    expect(getDiscountPercent(120, 100)).toBeNull();
  });

  it("rounds to the nearest whole percent", () => {
    expect(getDiscountPercent(33.33, 100)).toBe(67);
  });
});
