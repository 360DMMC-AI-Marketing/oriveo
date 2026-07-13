const RATE_LIMITS = {
  "ai-chat": { rpm: 500, windowMs: 60000 },
  transcribe: { rpm: 100, windowMs: 60000 },
  tts: { rpm: 200, windowMs: 60000 },
  "score-call": { rpm: 50, windowMs: 60000 },
};

const callCounters = {};
const pending = {};

function checkRateLimit(queueName) {
  const limits = RATE_LIMITS[queueName];
  if (!limits) return true;
  const now = Date.now();
  const windowKey = Math.floor(now / limits.windowMs);
  const key = `${queueName}:${windowKey}`;
  callCounters[key] = (callCounters[key] || 0) + 1;
  setTimeout(() => { callCounters[key] = Math.max(0, (callCounters[key] || 0) - 1); }, limits.windowMs);
  const current = callCounters[key] || 0;
  if (current > limits.rpm * 1.1) {
    console.warn(`[Queue] Rate limit approached for ${queueName}: ${current}/${limits.rpm}`);
  }
  return current <= limits.rpm * 1.2;
}

export async function withRetry(queueName, fn, opts = {}) {
  const { retries = 3, backoff = 1000, timeout = 30000 } = opts;

  for (let attempt = 0; attempt <= retries; attempt++) {
    while (!checkRateLimit(queueName)) {
      await new Promise(r => setTimeout(r, 200));
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeout)),
      ]);
      return result;
    } catch (err) {
      if (attempt >= retries) throw err;
      const delay = backoff * Math.pow(2, attempt);
      console.warn(`[Queue] ${queueName} failed (${attempt + 1}/${retries}), retry in ${delay}ms: ${err.message}`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
