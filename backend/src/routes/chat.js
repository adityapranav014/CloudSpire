import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import {
    listModels,
    getCloudContext,
    listSessions,
    createSession,
    getSession,
    updateSessionTitle,
    togglePinSession,
    deleteSession,
    clearAllSessions,
    sendMessage,
} from '../controllers/chat.js';

const router = Router();

// All chat routes require authentication
router.use(protect);

router.get('/models', listModels);
router.get('/context', getCloudContext);

router.route('/sessions')
    .get(listSessions)
    .post(createSession)
    .delete(clearAllSessions);

router.route('/sessions/:id')
    .get(getSession)
    .delete(deleteSession);

router.patch('/sessions/:id/title', updateSessionTitle);
router.patch('/sessions/:id/pin', togglePinSession);

router.post('/sessions/:id/messages', sendMessage);

export default router;
