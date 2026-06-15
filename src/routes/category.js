import express from 'express';
import { getCategories, getCategoriesByOrganization } from '../controllers/categoryController.js';

const router = express.Router();

// GET all categories for a specific organization (primary cascading route)
router.get('/:organizationId', getCategoriesByOrganization);

// GET all categories (admin/debug)
router.get('/', getCategories);

export default router;
