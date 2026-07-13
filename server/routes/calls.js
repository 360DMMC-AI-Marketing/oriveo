import { Router } from "express";
import {
  getCalls,
  getCall,
  createCall,
  updateCall,
  updateCallStatus,
  recallCall,
  deleteCall,
  getPatientCallHistory,
  emergencyCall,
  transferCall,
  getActiveCalls,
} from "../controllers/callController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createCallSchema, updateCallSchema, updateCallStatusSchema, transferCallSchema } from "../validators/call.js";

const router = Router();

router.use(protect);
router.get("/", getCalls);
router.get("/patient/:patientId/history", getPatientCallHistory);
router.get("/active", getActiveCalls);
router.get("/:id", getCall);
router.post("/", authorize("admin", "doctor", "nurse"), validate(createCallSchema), createCall);
router.put("/:id", authorize("admin", "doctor", "nurse"), validate(updateCallSchema), updateCall);
router.put("/:id/status", authorize("admin", "doctor"), validate(updateCallStatusSchema), updateCallStatus);
router.post("/:id/recall", authorize("admin", "doctor", "nurse"), recallCall);
router.delete("/:id", authorize("admin", "doctor", "nurse"), deleteCall);
router.post("/:id/transfer", authorize("admin", "doctor"), validate(transferCallSchema), transferCall);
router.post("/:id/emergency/call", authorize("admin", "doctor"), emergencyCall);

export default router;
