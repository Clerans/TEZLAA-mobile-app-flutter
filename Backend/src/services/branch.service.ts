import branchRepository from '../repositories/branch.repository.js';
import { ApiError } from '../utils/apiError.js';

export class BranchService {
  async getAllBranches() {
    return branchRepository.findAllActive();
  }

  async getBranchByIdOrSlug(identifier: string) {
    let branch = await branchRepository.findById(identifier);
    if (!branch) {
      branch = await branchRepository.findBySlug(identifier);
    }

    if (!branch) {
      throw new ApiError(404, `Branch not found with identifier: ${identifier}`);
    }

    return branch;
  }
}

export const branchService = new BranchService();
export default branchService;
