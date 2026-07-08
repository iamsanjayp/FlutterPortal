import express from "express";
import { handleMockApi } from "../controllers/mock.controller.js";

const router = express.Router();

// Allow CORS for all mock API requests so browser iframes can fetch freely without CORS errors
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

router.all("/:problemId", handleMockApi);
router.all("/:problemId/*", handleMockApi);

export default router;
