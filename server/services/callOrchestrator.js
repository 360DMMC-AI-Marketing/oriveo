import Call from "../models/Call.js";
import CallEvent from "../models/CallEvent.js";

const activeCalls = new Map();

export function registerCall(callId, data) {
  activeCalls.set(callId, {
    callSid: data.callSid,
    streamSid: data.streamSid,
    startedAt: Date.now(),
    ...data,
  });
}

export function getCall(callId) {
  return activeCalls.get(callId);
}

export function updateCall(callId, updates) {
  const existing = activeCalls.get(callId);
  if (existing) {
    Object.assign(existing, updates);
  }
}

export function removeCall(callId) {
  activeCalls.delete(callId);
}

export function getAllActiveCalls() {
  return Array.from(activeCalls.entries());
}

export async function persistCallEvent(callId, type, data) {
  try {
    await CallEvent.create({ callId, type, data });
  } catch (err) {
    console.error(`[persistEvent] ${callId}:`, err.message);
  }
}

export async function persistTranscriptEntry(callId, role, content, metadata = {}) {
  try {
    await Call.findByIdAndUpdate(callId, {
      $push: {
        transcript: {
          question: role === "user" ? content : "",
          answer: role === "assistant" ? content : "",
          timestamp: Date.now(),
        },
      },
    });
  } catch (err) {
    console.error(`[persistTranscript] ${callId}:`, err.message);
  }
}

export async function markCallCompleted(callId) {
  try {
    await Call.findByIdAndUpdate(callId, {
      status: "completed",
      endedAt: new Date(),
    });
  } catch (err) {
    console.error(`[markCompleted] ${callId}:`, err.message);
  }
}

export async function recoverOrphanedCalls() {
  try {
    const orphans = await Call.find({
      status: "in-progress",
      startedAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) },
    });
    for (const call of orphans) {
      call.status = "failed";
      call.endedAt = new Date();
      call.notes = "Call abandoned — server restarted";
      await call.save();
      console.error(`[recovery] Marked orphan call ${call._id} as failed`);
    }
    return orphans.length;
  } catch (err) {
    console.error("[recovery] Error:", err.message);
    return 0;
  }
}
