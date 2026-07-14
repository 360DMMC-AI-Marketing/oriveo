import Group from "../models/Group.js";
import Patient from "../models/Patient.js";
import Call from "../models/Call.js";
import confirmAppointments from "../utils/confirmAppointments.js";

async function syncMembers(group) {
  if (!group.diagnosisFilter || !group.diagnosisFilter.trim()) return;
  const filter = group.diagnosisFilter.trim().toLowerCase();
  const baseQuery = {
    $or: [
      { primaryDiagnosis: { $regex: filter, $options: "i" } },
      { chronicConditions: { $regex: filter, $options: "i" } },
    ],
    isActive: true,
  };
  if (group.organization) baseQuery.organization = group.organization;
  if (group.specialty) baseQuery.specialty = group.specialty;
  const matching = await Patient.find(baseQuery).select("_id");
  const matchIds = matching.map((p) => p._id.toString());
  const existingIds = group.members.map((m) => m.toString());
  const merged = new Set([...existingIds, ...matchIds]);
  group.members = [...merged].map((id) => id);
  await group.save();
}

export const getGroups = async (req, res) => {
  try {
    const query = { ...req.tenantFilter };
    if (req.user.role !== "admin") query.createdBy = req.user._id;
    const groups = await Group.find(query)
      .populate("members", "name phone primaryDiagnosis language")
      .populate("createdBy", "name")
      .sort({ updatedAt: -1 });
    res.json({ groups });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGroup = async (req, res) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, ...req.tenantFilter })
      .populate("members", "name phone primaryDiagnosis chronicConditions language doNotCall")
      .populate("createdBy", "name");
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json({ group });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createGroup = async (req, res) => {
  try {
    const data = { ...req.body, createdBy: req.user._id, organization: req.user.organization || null, specialty: req.tenantFilter?.specialty || "general" };
    if (!data.members) data.members = [];
    const group = await Group.create(data);
    if (group.diagnosisFilter) await syncMembers(group);
    const populated = await Group.findById(group._id)
      .populate("members", "name phone primaryDiagnosis language")
      .populate("createdBy", "name");
    res.status(201).json({ group: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateGroup = async (req, res) => {
  try {
    const group = await Group.findOneAndUpdate({ _id: req.params.id, ...req.tenantFilter }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (req.body.diagnosisFilter !== undefined) await syncMembers(group);
    const populated = await Group.findById(group._id)
      .populate("members", "name phone primaryDiagnosis language")
      .populate("createdBy", "name");
    res.json({ group: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!group) return res.status(404).json({ message: "Group not found" });
    res.json({ message: "Group deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addMember = async (req, res) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!group) return res.status(404).json({ message: "Group not found" });
    const { patientId } = req.body;
    const alreadyMember = group.members.some(
      (m) => m.toString() === patientId
    );
    if (alreadyMember) {
      const populated = await Group.findById(group._id)
        .populate("members", "name phone primaryDiagnosis language");
      return res.json({ group: populated });
    }
    group.members.push(patientId);
    await group.save();
    const populated = await Group.findById(group._id)
      .populate("members", "name phone primaryDiagnosis language");
    res.json({ group: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const removeMember = async (req, res) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, ...req.tenantFilter });
    if (!group) return res.status(404).json({ message: "Group not found" });
    group.members = group.members.filter(
      (m) => m.toString() !== req.params.patientId
    );
    await group.save();
    const populated = await Group.findById(group._id)
      .populate("members", "name phone primaryDiagnosis language");
    res.json({ group: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const callGroup = async (req, res) => {
  try {
    const group = await Group.findOne({ _id: req.params.id, ...req.tenantFilter }).populate("members", "name phone doNotCall");
    if (!group) return res.status(404).json({ message: "Group not found" });

    const { questionnaire, scheduledAt, language, customQuestions } = req.body;
    const calls = [];
    const skipped = [];

    for (const patient of group.members) {
      if (patient.doNotCall) {
        skipped.push(patient.name);
        continue;
      }
      if (!patient.phone) {
        skipped.push(patient.name);
        continue;
      }
      const call = await Call.create({
        patient: patient._id,
        questionnaire: questionnaire || null,
        customQuestions: customQuestions || [],
        scheduledAt: scheduledAt || new Date(),
        startedBy: req.user._id,
        language: language || "en",
      });
      calls.push(call._id);
      confirmAppointments(patient._id, call._id);
    }

    group.callCount += calls.length;
    group.lastCalledAt = new Date();
    await group.save();

    res.json({
      message: `Created ${calls.length} calls${skipped.length > 0 ? `, skipped ${skipped.length} (DNC/no phone)` : ""}`,
      callCount: calls.length,
      skipped,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
