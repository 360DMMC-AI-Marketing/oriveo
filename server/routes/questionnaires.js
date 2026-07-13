import { Router } from "express";
import {
  getQuestionnaires,
  getQuestionnaire,
  createQuestionnaire,
  updateQuestionnaire,
  deleteQuestionnaire,
  generateQuestions,
} from "../controllers/questionnaireController.js";
import { protect, authorize } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { createQuestionnaireSchema, updateQuestionnaireSchema } from "../validators/questionnaire.js";

const router = Router();

router.use(protect);
router.get("/", getQuestionnaires);
router.get("/:id", getQuestionnaire);
router.post("/", authorize("admin", "doctor"), validate(createQuestionnaireSchema), createQuestionnaire);
router.put("/:id", authorize("admin", "doctor"), validate(updateQuestionnaireSchema), updateQuestionnaire);
router.delete("/:id", authorize("admin"), deleteQuestionnaire);
router.post("/generate", authorize("admin", "doctor"), generateQuestions);

export default router;
