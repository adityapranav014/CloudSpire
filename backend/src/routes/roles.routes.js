import express from 'express';
import * as rolesController from '../controllers/roles.controller.js';

const router = express.Router();
router.get('/', rolesController.getIndex);

export default router;
