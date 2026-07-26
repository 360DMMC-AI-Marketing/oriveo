import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import { SPECIALTIES_BY_TYPE } from "../config/specialties.js";

export const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (!req.user.isActive) {
      return res.status(403).json({ message: "Account is deactivated" });
    }
    if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== req.user.tokenVersion) {
      return res.status(401).json({ message: "Session expired, please login again" });
    }
    req.tenantFilter = req.user.superAdmin ? {} : { organization: req.user.organization || null };
    if (!req.user.superAdmin && req.user.organization) {
      const org = await Organization.findById(req.user.organization);
      if (org) {
        const validIds = (SPECIALTIES_BY_TYPE[org.clinicType] || []).map(s => s.id);
        if (validIds.length > 0 && !validIds.includes(org.specialty)) {
          org.specialty = validIds[0];
          await org.save();
        }
        req.tenantFilter.specialty = org.specialty;
      }
    }
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired, please login again" });
    }
    return res.status(401).json({ message: "Not authorized, token failed" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (req.user.superAdmin) return next();
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role '${req.user.role}' is not authorized for this action` });
    }
    next();
  };
};
