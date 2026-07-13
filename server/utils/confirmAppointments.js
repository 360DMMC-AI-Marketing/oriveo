import Appointment from "../models/Appointment.js";
import { logger } from "./logger.js";

export default async function confirmAppointments(patientId, callId) {
  try {
    await Appointment.updateMany(
      { patient: patientId, status: "scheduled" },
      { $set: { status: "confirmed", call: callId } },
    );
  } catch (err) {
    logger.error("confirmAppointments", `Failed for patient ${patientId}: ${err.message}`);
  }
}
