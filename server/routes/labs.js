import { Router } from "express";
import mongoose from "mongoose";
import { protect, authorize } from "../middleware/auth.js";
import LabResult from "../models/LabResult.js";
import Patient from "../models/Patient.js";
import { assertPatientInOrg } from "../utils/tenant.js";

const router = Router();

router.use(protect);

function deriveTestStatus(test) {
  if (test.status === "pending") return "pending";
  const v = parseFloat(test.value);
  if (Number.isNaN(v)) return test.status || "pending";
  const lo = test.referenceLow === "" || test.referenceLow === null || test.referenceLow === undefined ? null : parseFloat(test.referenceLow);
  const hi = test.referenceHigh === "" || test.referenceHigh === null || test.referenceHigh === undefined ? null : parseFloat(test.referenceHigh);
  if (hi !== null && v > hi * 1.25) return "critical";
  if (lo !== null && v < lo * 0.75) return "critical";
  if (hi !== null && v > hi) return "high";
  if (lo !== null && v < lo) return "low";
  return "normal";
}

router.get("/", async (req, res) => {
  try {
    const filter = { ...req.tenantFilter };
    if (req.query.patient) filter.patient = req.query.patient;
    if (req.query.status) filter.status = req.query.status;
    if (req.user.role === "doctor" || req.user.role === "nurse") {
      const patients = await Patient.find({ assignedDoctor: req.user._id }).select("_id");
      filter.patient = { $in: patients.map((p) => p._id) };
    }
    const results = await LabResult.find(filter)
      .populate("patient", "name phone")
      .populate("orderedBy", "name")
      .sort({ orderedAt: -1 });
    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const match = { ...req.tenantFilter };
    const [total, completed, pending, abnormal] = await Promise.all([
      LabResult.countDocuments(match),
      LabResult.countDocuments({ ...match, status: "completed" }),
      LabResult.countDocuments({ ...match, status: { $in: ["ordered", "collected", "in-progress"] } }),
      LabResult.countDocuments({
        ...match,
        "tests.status": { $in: ["high", "low", "critical"] },
      }),
    ]);
    res.json({ total, completed, pending, abnormal });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await LabResult.findOne({ _id: req.params.id, ...req.tenantFilter })
      .populate("patient", "name dob gender")
      .populate("orderedBy", "name");
    if (!result) return res.status(404).json({ message: "Lab result not found" });
    res.json({ result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", authorize("admin", "doctor", "nurse"), async (req, res) => {
  try {
    const { patient, panel, orderedAt, tests, notes, status } = req.body;
    if (!patient || !mongoose.Types.ObjectId.isValid(patient)) {
      return res.status(400).json({ message: "Valid patient ID required" });
    }
    if (!(await assertPatientInOrg(req, patient))) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const result = await LabResult.create({
      organization: req.user.organization,
      patient,
      orderedBy: req.user._id,
      panel: panel || "General",
      orderedAt: orderedAt || new Date(),
      tests: (tests || []).map((t) => ({ ...t, status: deriveTestStatus(t) })),
      notes: notes || "",
      status: status || (tests?.length ? "completed" : "ordered"),
      completedAt: tests?.length ? new Date() : null,
    });
    res.status(201).json({ result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", authorize("admin", "doctor", "nurse"), async (req, res) => {
  try {
    const result = await LabResult.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!result) return res.status(404).json({ message: "Lab result not found" });
    const allowed = ["panel", "status", "orderedAt", "collectedAt", "notes", "tests"];
    for (const key of allowed) {
      if (req.body[key] !== undefined) result[key] = req.body[key];
    }
    if (Array.isArray(req.body.tests)) {
      result.tests = req.body.tests.map((t) => ({ ...t, status: deriveTestStatus(t) }));
    }
    if (req.body.status === "completed" && !result.completedAt) result.completedAt = new Date();
    if (req.body.status === "cancelled") result.completedAt = null;
    await result.save();
    res.json({ result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", authorize("admin", "doctor"), async (req, res) => {
  try {
    await LabResult.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    res.json({ message: "Lab result deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id/fhir", async (req, res) => {
  try {
    const result = await LabResult.findOne({ _id: req.params.id, ...req.tenantFilter }).populate("patient", "name gender dob");
    if (!result) return res.status(404).json({ message: "Lab result not found" });
    const bundle = {
      resourceType: "Bundle",
      type: "transaction",
      entry: [
        {
          resource: {
            resourceType: "Observation",
            status: result.status === "completed" ? "final" : "preliminary",
            subject: { reference: `Patient/${result.patient?._id}` },
            code: { text: result.panel },
            issued: result.completedAt || result.orderedAt,
            performer: result.orderedBy ? [{ reference: `Practitioner/${result.orderedBy}` }] : [],
          },
        },
        ...(result.tests || []).map((t) => ({
          resource: {
            resourceType: "Observation",
            status: t.status === "pending" ? "preliminary" : "final",
            code: { text: t.name, ...(t.loinc ? { coding: [{ system: "http://loinc.org", code: t.loinc }] } : {}) },
            valueQuantity: t.unit
              ? { value: parseFloat(t.value) || undefined, unit: t.unit, system: "http://unitsofmeasure.org", code: t.unit }
              : { valueString: t.value },
            interpretation: t.status && t.status !== "normal" ? [{ system: "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation", code: t.status.toUpperCase() }] : [],
            referenceRange: t.referenceLow || t.referenceHigh ? [{ low: { value: parseFloat(t.referenceLow) || 0 }, high: { value: parseFloat(t.referenceHigh) || 0 } }] : [],
          },
        })),
      ],
    };
    res.json(bundle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
