import Subscription from "../models/Subscription.js";

export function scopeQuery(user, baseQuery = {}) {
  if (user.superAdmin) return baseQuery;
  if (user.organization) return { ...baseQuery, organization: user.organization };
  return { ...baseQuery, organization: null };
}

export async function requireActiveSubscription(req, res, next) {
  if (req.user.superAdmin) return next();
  if (!req.user.organization) {
    return res.status(403).json({ message: "No organization assigned" });
  }
  try {
    const sub = await Subscription.findOne({ organization: req.user.organization });
    if (!sub || sub.status === "suspended" || sub.status === "cancelled" || sub.status === "expired") {
      return res.status(403).json({ message: "Organization subscription is not active. Contact your admin." });
    }
    next();
  } catch (err) {
    console.error("[requireActiveSubscription] DB error:", err.message);
    return res.status(500).json({ message: "Subscription check failed. Try again." });
  }
}
