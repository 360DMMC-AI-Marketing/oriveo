export function getFeaturesForOrg(org) {
  if (!org) return getDefaultFeatures(false);
  const isLarge = org.clinicSize === "large";
  return {
    multiProvider: isLarge,
    roomManagement: isLarge,
    departments: isLarge,
    advancedReporting: isLarge,
    roleBasedAccess: isLarge,
    insuranceBilling: isLarge,
    splitBilling: isLarge,
    waitlist: isLarge,
    multiLocation: isLarge,
    customRoles: isLarge,
    appointmentTypes: true,
    calendarView: true,
    voiceAI: true,
    notifications: true,
    smsEmailReminders: true,
    basicReporting: true,
    patientPortal: true,
    documentUpload: true,
    clinicalNotes: true,
  };
}

function getDefaultFeatures(_large) {
  return {
    multiProvider: false,
    roomManagement: false,
    departments: false,
    advancedReporting: false,
    roleBasedAccess: false,
    insuranceBilling: false,
    splitBilling: false,
    waitlist: false,
    multiLocation: false,
    customRoles: false,
    appointmentTypes: true,
    calendarView: true,
    voiceAI: true,
    notifications: true,
    smsEmailReminders: true,
    basicReporting: true,
    patientPortal: true,
    documentUpload: true,
    clinicalNotes: true,
  };
}

export function middleware(req, res, next) {
  if (req.user && req.user.organization) {
    req.features = getFeaturesForOrg(req.user.organization);
  } else {
    req.features = getDefaultFeatures(false);
  }
  next();
}
