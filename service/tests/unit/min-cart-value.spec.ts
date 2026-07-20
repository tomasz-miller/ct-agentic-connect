import { describe, expect, test } from '@jest/globals';
import { evaluateMinCartValue } from '../../src/services/min-cart-value';

describe('evaluateMinCartValue', () => {
  const config = { minCentAmount: 1000, currencyCode: 'EUR' };

  test('allows empty cart', () => {
    expect(
      evaluateMinCartValue(
        {
          lineItems: [],
          totalPrice: { type: 'centPrecision', currencyCode: 'EUR', centAmount: 0, fractionDigits: 2 },
        },
        config
      )
    ).toEqual({ ok: true });
  });

  test('allows cart at or above minimum', () => {
    expect(
      evaluateMinCartValue(
        {
          lineItems: [{ id: 'li-1' } as never],
          totalPrice: {
            type: 'centPrecision',
            currencyCode: 'EUR',
            centAmount: 1000,
            fractionDigits: 2,
          },
        },
        config
      )
    ).toEqual({ ok: true });
  });

  test('rejects cart below minimum', () => {
    const result = evaluateMinCartValue(
      {
        lineItems: [{ id: 'li-1' } as never],
        totalPrice: {
          type: 'centPrecision',
          currencyCode: 'EUR',
          centAmount: 999,
          fractionDigits: 2,
        },
      },
      config
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0].code).toBe('InvalidInput');
      expect(result.errors[0].message).toContain('10.00 EUR');
    }
  });

  test('skips when currency does not match filter', () => {
    expect(
      evaluateMinCartValue(
        {
          lineItems: [{ id: 'li-1' } as never],
          totalPrice: {
            type: 'centPrecision',
            currencyCode: 'USD',
            centAmount: 100,
            fractionDigits: 2,
          },
        },
        config
      )
    ).toEqual({ ok: true });
  });
});
