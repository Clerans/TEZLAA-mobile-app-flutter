import { Response } from 'express';
import addressService from '../services/address.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { AuthenticatedRequest } from '../types/index.js';

export class AddressController {
  getUserAddresses = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const addresses = await addressService.getUserAddresses(userId);
    return ApiResponse.success(res, addresses, 'Addresses retrieved successfully');
  });

  createAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const address = await addressService.createAddress({
      userId,
      ...req.body,
    });
    return ApiResponse.created(res, address, 'Delivery address added successfully');
  });

  updateAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const { id } = req.params;
    const address = await addressService.updateAddress(id, userId, req.body);
    return ApiResponse.success(res, address, 'Delivery address updated successfully');
  });

  deleteAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const { id } = req.params;
    await addressService.deleteAddress(id, userId);
    return ApiResponse.success(res, null, 'Delivery address deleted successfully');
  });

  setDefaultAddress = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) throw ApiError.unauthorized('Unauthorized');

    const { id } = req.params;
    const address = await addressService.setDefaultAddress(id, userId);
    return ApiResponse.success(res, address, 'Default address updated successfully');
  });
}

export const addressController = new AddressController();
export default addressController;
