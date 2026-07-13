import { Router } from "express";
import {
  getGroups,
  getGroup,
  createGroup,
  updateGroup,
  deleteGroup,
  addMember,
  removeMember,
  callGroup,
} from "../controllers/groupController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createGroupSchema, updateGroupSchema, addMemberSchema, callGroupSchema } from "../validators/group.js";

const router = Router();

router.use(protect);
router.get("/", getGroups);
router.get("/:id", getGroup);
router.post("/", authorize("admin", "doctor"), validate(createGroupSchema), createGroup);
router.put("/:id", authorize("admin", "doctor"), validate(updateGroupSchema), updateGroup);
router.delete("/:id", authorize("admin"), deleteGroup);
router.post("/:id/members", authorize("admin", "doctor"), validate(addMemberSchema), addMember);
router.delete("/:id/members/:patientId", authorize("admin", "doctor"), removeMember);
router.post("/:id/call", authorize("admin", "doctor"), validate(callGroupSchema), callGroup);

export default router;
