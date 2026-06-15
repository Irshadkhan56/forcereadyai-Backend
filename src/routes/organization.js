import express from 'express';
import {
  getOrganizations,
  getOrganizationById,
} from '../controllers/organizationController.js';

const router = express.Router();

router.get('/', getOrganizations);
router.get('/:id', getOrganizationById);

export default router;
