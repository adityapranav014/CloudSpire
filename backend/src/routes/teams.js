import express from 'express';
import * as teamsController from '../controllers/teams.js';

const router = express.Router();
router.get('/', teamsController.getIndex);

export default router;
