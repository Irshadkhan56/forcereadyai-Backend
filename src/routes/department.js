import express from 'express';
import {
  getDepartments,
  getDepartmentByIdOrSlug,
} from '../controllers/departmentController.js';

const router = express.Router();

router.get('/', getDepartments);
router.get('/:idOrSlug', getDepartmentByIdOrSlug);

export default router;
