import Availability from "../models/Availability.js";
import ProviderSchedule from "../models/ProviderSchedule.js";
import Appointment from "../models/Appointment.js";
import Organization from "../models/Organization.js";

function generateSlots(startTime, endTime, slotDuration, buffer, bookedMinutes) {
  const slots = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  for (let m = startMinutes; m + slotDuration <= endMinutes; m += slotDuration + buffer) {
    if (!bookedMinutes.has(m)) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      const endM2 = m + slotDuration;
      const endH2 = Math.floor(endM2 / 60);
      const endMin2 = endM2 % 60;
      slots.push({
        time: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`,
        endTime: `${String(endH2).padStart(2, "0")}:${String(endMin2).padStart(2, "0")}`,
        label: `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")} - ${String(endH2).padStart(2, "0")}:${String(endMin2).padStart(2, "0")}`,
      });
    }
  }
  return slots;
}

export async function getAvailableSlots(orgId, date, providerId) {
  const dt = new Date(date + "T00:00:00");
  const dayOfWeek = dt.getDay();

  const org = await Organization.findById(orgId).select("defaultSlotDuration defaultBufferBetween");

  let scheduleSource;

  if (providerId) {
    const override = await ProviderSchedule.findOne({
      provider: providerId,
      organization: orgId,
      dayOfWeek,
      isActive: true,
    });

    if (override) {
      scheduleSource = [{
        startTime: override.startTime,
        endTime: override.endTime,
        slotDuration: override.slotDuration || org?.defaultSlotDuration || 30,
        bufferBetween: override.bufferBetween || org?.defaultBufferBetween || 0,
      }];
    }
  }

  if (!scheduleSource) {
    scheduleSource = await Availability.find({
      organization: orgId,
      dayOfWeek,
      isActive: true,
    }).sort({ startTime: 1 });
  }

  if (!scheduleSource || scheduleSource.length === 0) {
    return [];
  }

  const dayStart = new Date(dt);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dt);
  dayEnd.setHours(23, 59, 59, 999);

  const match = {
    organization: orgId,
    date: { $gte: dayStart, $lte: dayEnd },
    status: { $nin: ["cancelled", "no-show"] },
  };
  if (providerId) {
    match.provider = providerId;
  }

  const existingAppointments = await Appointment.find(match);

  const bookedMinutes = new Set();
  for (const apt of existingAppointments) {
    const d = new Date(apt.date);
    const duration = apt.duration || 30;
    const startMin = d.getHours() * 60 + d.getMinutes();
    for (let i = 0; i < duration; i += 15) {
      bookedMinutes.add(startMin + i);
    }
  }

  const allSlots = [];
  for (const source of scheduleSource) {
    const slots = generateSlots(
      source.startTime,
      source.endTime,
      source.slotDuration || 30,
      source.bufferBetween || 0,
      bookedMinutes
    );
    allSlots.push(...slots);
  }

  return allSlots;
}

export async function validateSlot(orgId, date, time, duration, providerId) {
  const dt = new Date(date + "T00:00:00");
  const [hours, minutes] = time.split(":").map(Number);
  const appointmentStart = dt.getHours() * 60 + dt.getMinutes();
  dt.setHours(hours, minutes, 0, 0);
  const requestedStart = hours * 60 + minutes;
  const requestedEnd = requestedStart + (duration || 30);

  const slots = await getAvailableSlots(orgId, date, providerId);
  const slotStartMinutes = new Set();
  for (const s of slots) {
    const [sh, sm] = s.time.split(":").map(Number);
    slotStartMinutes.add(sh * 60 + sm);
  }

  let found = false;
  for (let m = requestedStart; m < requestedEnd; m += 15) {
    if (slotStartMinutes.has(m)) {
      found = true;
      break;
    }
  }

  if (!found) {
    const alternatives = slots.slice(0, 5).map((s) => s.time);
    return { valid: false, message: "Slot not available", alternatives };
  }

  const dayStart = new Date(dt);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dt);
  dayEnd.setHours(23, 59, 59, 999);

  const match = {
    organization: orgId,
    date: { $gte: dayStart, $lte: dayEnd },
    status: { $nin: ["cancelled", "no-show"] },
  };
  if (providerId) {
    match.provider = providerId;
  }

  const existing = await Appointment.findOne(match);

  if (existing) {
    return { valid: false, message: "Time slot conflict", alternatives: slots.slice(0, 5).map((s) => s.time) };
  }

  return { valid: true };
}

export async function getProviderList(orgId) {
  const { default: User } = await import("../models/User.js");
  return User.find({
    organization: orgId,
    role: { $in: ["admin", "doctor"] },
    isActive: true,
  }).select("name specialty role");
}
