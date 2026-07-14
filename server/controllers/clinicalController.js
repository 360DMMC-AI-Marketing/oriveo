import ClinicalNote from "../models/ClinicalNote.js";
import ClinicalTemplate from "../models/ClinicalTemplate.js";
import Icd10Code from "../models/Icd10Code.js";

export const getClinicalNotes = async (req, res) => {
  try {
    const query = { patient: req.params.id, isActive: true };
    if (req.query.specialty) query.specialty = req.query.specialty;
    const notes = await ClinicalNote.find(query)
      .sort({ encounterDate: -1 })
      .populate("createdBy", "name")
      .populate("signedBy", "name");
    res.json({ notes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createClinicalNote = async (req, res) => {
  try {
    const note = await ClinicalNote.create({
      ...req.body,
      patient: req.params.id,
      organization: req.user.organization || null,
      createdBy: req.user._id,
    });
    const populated = await note.populate("createdBy", "name");
    res.status(201).json({ note: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getClinicalNote = async (req, res) => {
  try {
    const note = await ClinicalNote.findOne({
      _id: req.params.noteId,
      patient: req.params.id,
      isActive: true,
    }).populate("createdBy", "name").populate("signedBy", "name");
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateClinicalNote = async (req, res) => {
  try {
    const note = await ClinicalNote.findOneAndUpdate(
      { _id: req.params.noteId, patient: req.params.id, isActive: true, isSigned: false },
      { $set: req.body },
      { new: true, runValidators: true }
    ).populate("createdBy", "name").populate("signedBy", "name");
    if (!note) return res.status(404).json({ message: "Note not found or already signed" });
    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteClinicalNote = async (req, res) => {
  try {
    const note = await ClinicalNote.findOneAndUpdate(
      { _id: req.params.noteId, patient: req.params.id },
      { isActive: false },
      { new: true }
    );
    if (!note) return res.status(404).json({ message: "Note not found" });
    res.json({ message: "Note deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const signClinicalNote = async (req, res) => {
  try {
    const { signatureTitle } = req.body;
    const note = await ClinicalNote.findOneAndUpdate(
      { _id: req.params.noteId, patient: req.params.id, isActive: true, isSigned: false },
      {
        $set: {
          isSigned: true,
          signedBy: req.user._id,
          signedAt: new Date(),
          signatureName: req.user.name,
          signatureTitle: signatureTitle || req.user.role || "",
        },
      },
      { new: true }
    ).populate("createdBy", "name").populate("signedBy", "name");
    if (!note) return res.status(404).json({ message: "Note not found or already signed" });
    res.json({ note });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- Templates ---

export const getClinicalTemplates = async (req, res) => {
  try {
    const query = {
      $or: [
        { organization: req.user.organization || null },
        { isBuiltIn: true },
      ],
      isActive: true,
    };
    if (req.query.specialty) query.specialty = req.query.specialty;
    const templates = await ClinicalTemplate.find(query).sort({ name: 1 });
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createClinicalTemplate = async (req, res) => {
  try {
    const template = await ClinicalTemplate.create({
      ...req.body,
      organization: req.user.organization || null,
      createdBy: req.user._id,
      isBuiltIn: false,
    });
    res.status(201).json({ template });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- ICD-10 search ---

export const searchIcd10 = async (req, res) => {
  try {
    const q = req.query.q || "";
    if (!q || q.length < 2) return res.json({ codes: [] });
    const codes = await Icd10Code.find({
      $or: [
        { code: { $regex: q, $options: "i" } },
        { name: { $regex: q, $options: "i" } },
      ],
    }).limit(30).sort({ code: 1 });
    res.json({ codes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
