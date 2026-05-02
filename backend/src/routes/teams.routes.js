import express from 'express';
import * as teamsController from '../controllers/teams.controller.js';

const router = express.Router();
router.get('/', teamsController.getIndex);

export default router;
