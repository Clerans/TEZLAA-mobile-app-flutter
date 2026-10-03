import { Router } from 'express';
import addressController from '../controllers/address.controller.js';
import { authenticateJwt } from '../middleware/authMiddleware.js';
import { validate } from '../middleware/validate.js';
import { createAddressSchema, updateAddressSchema } from '../validators/order.validator.js';
import { idParamSchema } from '../validators/catalog.validator.js';

const router = Router();

// All address routes require JWT authentication
router.use(authenticateJwt as any);

// GET /api/v1/addresses
router.get('/', addressController.getUserAddresses as any);

// POST /api/v1/addresses
router.post('/', validate(createAddressSchema), addressController.createAddress as any);

// PUT /api/v1/addresses/:id
router.put('/:id', validate(updateAddressSchema), addressController.updateAddress as any);
router.patch('/:id', validate(updateAddressSchema), addressController.updateAddress as any);

// Set default address
router.patch('/:id/default', addressController.setDefaultAddress as any);
router.post('/:id/default', addressController.setDefaultAddress as any);

// DELETE /api/v1/addresses/:id
router.delete('/:id', validate(idParamSchema), addressController.deleteAddress as any);

export default router;
