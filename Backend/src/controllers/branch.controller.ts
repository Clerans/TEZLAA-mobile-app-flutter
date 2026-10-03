import { Request, Response } from 'express';
import branchService from '../services/branch.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class BranchController {
  getBranches = asyncHandler(async (req: Request, res: Response) => {
    const branches = await branchService.getAllBranches();
    return ApiResponse.success(res, branches, 'Branches retrieved successfully');
  });

  getBranchById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const branch = await branchService.getBranchByIdOrSlug(id);
    return ApiResponse.success(res, branch, 'Branch details retrieved successfully');
  });
}

export const branchController = new BranchController();
export default branchController;
