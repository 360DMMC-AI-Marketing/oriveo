import { Router } from "express";
import { LANGUAGE_LIST, SUPPORTED_LANGUAGES } from "../config/languages.js";

const router = Router();

router.get("/", (req, res) => {
  res.json({ languages: LANGUAGE_LIST });
});

router.get("/:code", (req, res) => {
  const cfg = SUPPORTED_LANGUAGES[req.params.code];
  if (!cfg) return res.status(404).json({ message: "Language not supported" });
  res.json({ code: req.params.code, label: cfg.label });
});

export default router;
