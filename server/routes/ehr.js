import { Router } from "express";
import { protect, authorize } from "../middleware/auth.js";
import * as athena from "../services/ehrAthena.js";

const router = Router();

router.use(protect);

router.get("/status", async (req, res) => {
  res.json({
    configured: athena.isAthenaConfigured(),
    provider: "athenahealth",
  });
});

router.get("/departments", authorize("admin", "doctor"), async (req, res) => {
  try {
    if (!athena.isAthenaConfigured()) return res.status(400).json({ message: "athenahealth not configured" });
    const data = await athena.getDepartments();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/appointment-types/:departmentId", authorize("admin", "doctor"), async (req, res) => {
  try {
    if (!athena.isAthenaConfigured()) return res.status(400).json({ message: "athenahealth not configured" });
    const data = await athena.getAppointmentTypes(req.params.departmentId);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/patients", authorize("admin", "doctor"), async (req, res) => {
  try {
    if (!athena.isAthenaConfigured()) return res.status(400).json({ message: "athenahealth not configured" });
    const data = await athena.getPatients(req.query.search);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/patients/:id", authorize("admin", "doctor"), async (req, res) => {
  try {
    if (!athena.isAthenaConfigured()) return res.status(400).json({ message: "athenahealth not configured" });
    const data = await athena.getPatient(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/appointments", authorize("admin", "doctor"), async (req, res) => {
  try {
    if (!athena.isAthenaConfigured()) return res.status(400).json({ message: "athenahealth not configured" });
    const { departmentId, startDate, endDate } = req.query;
    if (!departmentId || !startDate || !endDate) {
      return res.status(400).json({ message: "departmentId, startDate, endDate required" });
    }
    const data = await athena.getAppointments(departmentId, startDate, endDate);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/appointments", authorize("admin", "doctor"), async (req, res) => {
  try {
    if (!athena.isAthenaConfigured()) return res.status(400).json({ message: "athenahealth not configured" });
    const { patientId, departmentId, appointmentTypeId, date, time } = req.body;
    if (!patientId || !departmentId || !appointmentTypeId || !date || !time) {
      return res.status(400).json({ message: "patientId, departmentId, appointmentTypeId, date, time required" });
    }
    const data = await athena.createAppointment(patientId, departmentId, appointmentTypeId, date, time);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/patients/:id/notes", authorize("admin", "doctor"), async (req, res) => {
  try {
    if (!athena.isAthenaConfigured()) return res.status(400).json({ message: "athenahealth not configured" });
    const { note } = req.body;
    if (!note) return res.status(400).json({ message: "note required" });
    const data = await athena.writeClinicalNote(req.params.id, note);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
