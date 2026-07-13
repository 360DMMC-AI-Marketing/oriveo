import Appointment from "../models/Appointment.js";
import { logger } from "./logger.js";

let intervalHandle = null;

export async function checkNoShows() {
  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    const result = await Appointment.updateMany(
      {
        status: { $in: ["scheduled", "confirmed"] },
        date: { $lt: cutoff },
      },
      { $set: { status: "no-show" } }
    );
    if (result.modifiedCount > 0) {
      logger.info("autoNoShow", `Marked ${result.modifiedCount} appointments as no-show`);
    }
  } catch (err) {
    logger.error("autoNoShow", err.message);
  }
}

export function startNoShowChecker() {
  checkNoShows();
  intervalHandle = setInterval(checkNoShows, 15 * 60 * 1000);
}

export function stopNoShowChecker() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
