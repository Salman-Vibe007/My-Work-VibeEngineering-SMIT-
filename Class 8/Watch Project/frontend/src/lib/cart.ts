export interface OrderTotals {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export interface OrderTotalsOptions {
  freeShippingThreshold?: number;
  flatShippingCost?: number;
  taxRate?: number;
}

const DEFAULTS = {
  freeShippingThreshold: 500,
  flatShippingCost: 25,
  taxRate: 0.08,
};

/**
 * Computes order totals from a cart subtotal.
 * Free shipping applies when the subtotal meets the threshold.
 */
export function calcOrderTotals(
  subtotal: number,
  {
    freeShippingThreshold = DEFAULTS.freeShippingThreshold,
    flatShippingCost = DEFAULTS.flatShippingCost,
    taxRate = DEFAULTS.taxRate,
  }: OrderTotalsOptions = {}
): OrderTotals {
  const safeSubtotal = Number.isFinite(subtotal) ? Math.max(0, subtotal) : 0;
  const shipping = safeSubtotal >= freeShippingThreshold ? 0 : flatShippingCost;
  const tax = safeSubtotal * taxRate;
  const total = safeSubtotal + shipping + tax;
  return {
    subtotal: safeSubtotal,
    shipping,
    tax,
    total,
  };
}

/** Amount still needed to unlock free shipping (0 if already qualified). */
export function amountForFreeShipping(
  subtotal: number,
  freeShippingThreshold = DEFAULTS.freeShippingThreshold
): number {
  return Math.max(0, freeShippingThreshold - subtotal);
}
