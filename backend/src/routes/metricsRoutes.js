import express from "express";
import * as metricsController from "../controllers/metrics.js";

const router = express.Router();

// GET /api/v1/metrics — full system metrics
router.get("/", metricsController.getMetrics);

// GET /api/v1/metrics/health — lightweight health check
router.get("/health", metricsController.getHealth);

export default router;
