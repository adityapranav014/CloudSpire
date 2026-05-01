import express from 'express';
import * as usersController from '../controllers/users.js';

const router = express.Router();
router.get('/', usersController.getIndex);

export default router;
