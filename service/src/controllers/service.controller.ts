import { Request, Response } from 'express';
import { apiSuccess } from '../api/success.api';
import CustomError from '../errors/custom.error';
import { cartController } from './cart.controller';

/**
 * API Extension HTTP endpoint.
 * Expects ExtensionInput: { action, resource }.
 */
export const post = async (request: Request, response: Response) => {
  const { action, resource } = request.body;

  if (!action || !resource) {
    throw new CustomError(400, 'Bad request - Missing body parameters.');
  }

  switch (resource.typeId) {
    case 'cart': {
      const data = await cartController(action, resource);

      if (data.statusCode === 200) {
        apiSuccess(200, data.actions, response);
        return;
      }

      // API Extension validation failed — HTTP 400 + errors[]
      response.status(400).json({ errors: data.errors });
      return;
    }

    default:
      throw new CustomError(
        500,
        `Internal Server Error - Resource not recognized. This PoC handles 'cart' only.`
      );
  }
};
