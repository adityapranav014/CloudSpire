import express from 'express';
import * as teamsController from '../controllers/teams.js';
import { protect } from '../middleware/auth.js';
import { orgScope } from '../middleware/orgScope.js';

const router = express.Router();

router.get('/', protect, orgScope, teamsController.getIndex);
router.post('/', protect, orgScope, teamsController.createTeam);
router.patch('/:id', protect, orgScope, teamsController.updateTeam);

export default router;
