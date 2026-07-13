import { Router } from "express";
import { getUsers, getDoctors, createUser, updateUser, deleteUser } from "../controllers/userController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createUserSchema, updateUserSchema } from "../validators/user.js";

const router = Router();

router.get("/doctors", protect, getDoctors);
router.use(protect);
router.use(authorize("admin"));
router.get("/", getUsers);
router.post("/", validate(createUserSchema), createUser);
router.put("/:id", validate(updateUserSchema), updateUser);
router.delete("/:id", deleteUser);

export default router;
