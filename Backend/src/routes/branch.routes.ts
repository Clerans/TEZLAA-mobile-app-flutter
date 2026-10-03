import { Router } from 'express';
import branchController from '../controllers/branch.controller.js';
import { validate } from '../middleware/validate.js';
import { idParamSchema } from '../validators/catalog.validator.js';

const router = Router();

// GET /api/v1/branches
router.get('/', branchController.getBranches);

// GET /api/v1/branches/:id
router.get('/:id', validate(idParamSchema), branchController.getBranchById);

export default router;
