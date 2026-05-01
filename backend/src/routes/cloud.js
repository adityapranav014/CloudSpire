import express from 'express';
import * as cloudController from '../controllers/cloud.js';

const router = express.Router();
router.get('/aws', cloudController.getAws);
router.get('/azure', cloudController.getAzure);
router.get('/gcp', cloudController.getGcp);

export default router;
