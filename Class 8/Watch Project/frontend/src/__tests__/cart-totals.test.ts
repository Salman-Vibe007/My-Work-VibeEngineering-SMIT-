import { describe, expect, it } from "vitest";
import { amountForFreeShipping, calcOrderTotals } from "@/lib/cart";

describe("calcOrderTotals", () => {
  it("charges flat shipping below the $500 threshold", () => {
    const t = calcOrderTotals(100);
    expect(t).toEqual({ subtotal: 100, shipping: 25, tax: 8, total: 133 });
  });

  it("waives shipping at exactly the $500 threshold", () => {
    const t = calcOrderTotals(500);
    expect(t.shipping).toBe(0);
    expect(t.total).toBe(540);
  });

  it("waives shipping above the threshold", () => {
    expect(calcOrderTotals(750).shipping).toBe(0);
  });

  it("applies the 8% tax rate", () => {
    expect(calcOrderTotals(200).tax).toBeCloseTo(16);
    expect(calcOrderTotals(499.99).tax).toBeCloseTo(39.9992);
  });

  it("totals to subtotal + shipping + tax", () => {
    const t = calcOrderTotals(240.5);
    expect(t.total).toBeCloseTo(240.5 + 25 + 240.5 * 0.08);
  });

  it("clamps negative subtotals to zero", () => {
    const t = calcOrderTotals(-50);
    expect(t.subtotal).toBe(0);
    expect(t.total).toBe(25);
  });

  it("treats non-finite subtotals as zero", () => {
    expect(calcOrderTotals(Number.NaN).subtotal).toBe(0);
    expect(calcOrderTotals(Infinity).subtotal).toBe(0);
  });

  it("honors custom options", () => {
    const t = calcOrderTotals(100, {
      freeShippingThreshold: 50,
      flatShippingCost: 10,
      taxRate: 0.1,
    });
    expect(t).toEqual({ subtotal: 100, shipping: 0, tax: 10, total: 110 });
  });
});

describe("amountForFreeShipping", () => {
  it("returns the remaining amount below the threshold", () => {
    expect(amountForFreeShipping(320)).toBe(180);
  });

  it("returns zero at or above the threshold", () => {
    expect(amountForFreeShipping(500)).toBe(0);
    expect(amountForFreeShipping(999)).toBe(0);
  });
});
