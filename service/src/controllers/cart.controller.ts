import type { Cart } from '@commercetools/platform-sdk';

import CustomError from '../errors/custom.error';
import { logger } from '../utils/logger.utils';
import {
  evaluateMinCartValue,
  readMinCartConfigFromEnv,
} from '../services/min-cart-value';

type ExtensionResource = {
  typeId?: string;
  id?: string;
  obj?: Cart;
};

type CartExtensionResult =
  | { statusCode: 200; actions: [] }
  | { statusCode: 400; errors: Array<{ code: string; message: string }> };

const handleCart = (resource: ExtensionResource): CartExtensionResult => {
  const cart = resource.obj;
  if (!cart) {
    throw new CustomError(400, 'Bad request - Missing cart object on resource.');
  }

  const config = readMinCartConfigFromEnv();
  const result = evaluateMinCartValue(cart, config);

  if (!result.ok) {
    logger.info('Minimum cart value validation failed', {
      cartId: cart.id,
      totalPrice: cart.totalPrice,
      minCentAmount: config.minCentAmount,
    });
    return { statusCode: 400, errors: result.errors };
  }

  return { statusCode: 200, actions: [] };
};

/**
 * Cart API Extension entry — Create and Update.
 */
export const cartController = async (
  action: string,
  resource: ExtensionResource
): Promise<CartExtensionResult> => {
  switch (action) {
    case 'Create':
    case 'Update':
      return handleCart(resource);
    default:
      throw new CustomError(
        500,
        `Internal Server Error - Resource action not recognized. Allowed values are 'Create' or 'Update'.`
      );
  }
};
