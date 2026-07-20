import type { Cart, Money } from '@commercetools/platform-sdk';

export type MinCartConfig = {
  minCentAmount: number;
  currencyCode?: string;
};

export type ExtensionError = {
  code: string;
  message: string;
};

export type MinCartResult =
  | { ok: true }
  | { ok: false; errors: ExtensionError[] };

/**
 * Reject carts that have line items but total below the configured minimum.
 * Empty carts always pass (so create/clear still works).
 */
export function evaluateMinCartValue(
  cart: Pick<Cart, 'lineItems' | 'totalPrice'>,
  config: MinCartConfig
): MinCartResult {
  if (!cart.lineItems?.length) {
    return { ok: true };
  }

  const total = cart.totalPrice as Money | undefined;
  if (!total || typeof total.centAmount !== 'number') {
    return {
      ok: false,
      errors: [
        {
          code: 'InvalidInput',
          message: 'Cart is missing totalPrice; cannot enforce minimum cart value.',
        },
      ],
    };
  }

  if (config.currencyCode && total.currencyCode !== config.currencyCode) {
    return { ok: true };
  }

  if (total.centAmount < config.minCentAmount) {
    const major = (config.minCentAmount / 100).toFixed(2);
    return {
      ok: false,
      errors: [
        {
          code: 'InvalidInput',
          message: `Cart total must be at least ${major} ${total.currencyCode} (PoC minimum cart value).`,
        },
      ],
    };
  }

  return { ok: true };
}

export function readMinCartConfigFromEnv(
  env: NodeJS.ProcessEnv = process.env
): MinCartConfig {
  const raw = env.MIN_CART_CENT_AMOUNT ?? '1000';
  const minCentAmount = Number.parseInt(raw, 10);
  if (!Number.isFinite(minCentAmount) || minCentAmount < 0) {
    throw new Error(`Invalid MIN_CART_CENT_AMOUNT: ${raw}`);
  }

  const currencyCode = (env.MIN_CART_CURRENCY ?? '').trim() || undefined;
  return { minCentAmount, currencyCode };
}
