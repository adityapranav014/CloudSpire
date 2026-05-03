import express from 'express';
import * as teamsController from '../controllers/teams.controller.js';
import { protect } from '../middleware/auth.js';
import { orgScope } from '../middleware/orgScope.js';
import { authorize, WRITE_ROLES } from '../middleware/rbac.js';

const router = express.Router();

// GET /teams — all authenticated roles can read
router.get('/', protect, orgScope, teamsController.getIndex);

// POST /teams — only admins and managers can create teams
// Spec: POST /teams → admin, manager only
router.post('/', protect, orgScope, authorize(...WRITE_ROLES), teamsController.createTeam);

// PATCH /teams/:id — only admins and managers can update teams
router.patch('/:id', protect, orgScope, authorize(...WRITE_ROLES), teamsController.updateTeam);

// GET /teams/:id — all authenticated roles can read a specific team
router.get('/:id', protect, orgScope, teamsController.getTeamById);

// PATCH /teams/:id/members — only admins and managers can add members to a team
router.patch('/:id/members', protect, orgScope, authorize(...WRITE_ROLES), teamsController.addMember);

export default router;
