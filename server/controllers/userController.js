import User from "../models/User.js";

export const getUsers = async (req, res) => {
  try {
    const users = await User.find(req.tenantFilter).sort({ createdAt: -1 });
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctors = async (req, res) => {
  try {
    const doctors = await User.find({ ...req.tenantFilter, role: "doctor", isActive: true }).select("name email specialty phone");
    res.json({ doctors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, phone, specialty } = req.body;
    const user = await User.create({ name, email, password, role, phone, specialty, organization: req.user.organization || null });
    res.status(201).json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, role, phone, specialty, language, isActive } = req.body;
    const update = {};
    if (name) update.name = name;
    if (role) update.role = role;
    if (phone !== undefined) update.phone = phone;
    if (specialty !== undefined) update.specialty = specialty;
    if (language) update.language = language;
    if (isActive !== undefined) update.isActive = isActive;
    const user = await User.findOneAndUpdate({ _id: req.params.id, ...req.tenantFilter }, update, { new: true });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "Cannot delete yourself" });
    }
    const user = await User.findOneAndDelete({ _id: req.params.id, ...req.tenantFilter });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
