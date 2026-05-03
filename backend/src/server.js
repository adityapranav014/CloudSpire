/**
 * src/server.js — Dev entry shim
 *
 * The canonical, production-grade server entry is `backend/server.js`
 * (the file one directory above this one). That file owns ALL startup:
 *   ✓ MongoDB connection
 *   ✓ BullMQ report worker
 *   ✓ Cron jobs (anomaly detection, report cleanup)
 *   ✓ Sample data seeding
 *   ✓ Socket.IO initialization
 *   ✓ Graceful shutdown (SIGINT / SIGTERM)
 *   ✓ Unhandled rejection + uncaught exception guards
 *
 * `npm run dev`  → nodemon src/server.js  (watches src/**)
 * `npm start`    → node src/server.js
 * Both are equivalent — all logic lives one level up.
 *
 * DO NOT duplicate startup logic here. Add everything to ../server.js.
 */
import '../server.js';
