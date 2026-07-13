import { Router } from "express";
import crypto from "crypto";
import Config from "../models/Config.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

const webhooks = [];
const webhookLogs = [];

router.use(protect);

router.get("/webhooks", (req, res) => {
  const userWebhooks = webhooks.filter(
    (w) => w.createdBy === req.user._id || req.user.role === "admin"
  );
  res.json({ webhooks: userWebhooks });
});

router.post("/webhooks", authorize("admin"), async (req, res) => {
  try {
    const { name, url, events, secret } = req.body;
    if (!name || !url || !events || !Array.isArray(events)) {
      return res.status(400).json({ message: "Name, url, and events array required" });
    }

    const webhook = {
      id: `wh-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`,
      name,
      url,
      events,
      secret: secret || crypto.randomBytes(32).toString("hex"),
      active: true,
      createdAt: new Date().toISOString(),
      createdBy: req.user._id,
    };

    webhooks.push(webhook);
    res.status(201).json({ webhook });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/webhooks/:id", authorize("admin"), (req, res) => {
  const webhook = webhooks.find((w) => w.id === req.params.id);
  if (!webhook) return res.status(404).json({ message: "Webhook not found" });

  const { name, url, events, active } = req.body;
  if (name) webhook.name = name;
  if (url) webhook.url = url;
  if (events) webhook.events = events;
  if (active !== undefined) webhook.active = active;

  res.json({ webhook });
});

router.delete("/webhooks/:id", authorize("admin"), (req, res) => {
  const index = webhooks.findIndex((w) => w.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: "Webhook not found" });
  webhooks.splice(index, 1);
  res.json({ message: "Webhook deleted" });
});

router.get("/webhooks/logs", (req, res) => {
  const userWebhookIds = webhooks
    .filter((w) => w.createdBy === req.user._id || req.user.role === "admin")
    .map((w) => w.id);
  const logs = webhookLogs
    .filter((l) => userWebhookIds.includes(l.webhookId))
    .slice(-100);
  res.json({ logs });
});

async function checkKey(providerId, envVar) {
  if (process.env[envVar]) return process.env[envVar];
  try {
    const cfg = await Config.findOne({ provider: providerId });
    return cfg?.keys?.get(envVar) || "";
  } catch { return ""; }
}

const PROVIDER_DEFS = [
  { id: "openai",      name: "OpenAI",           desc: "LLM for conversation & analysis",        env: "OPENAI_API_KEY" },
  { id: "deepgram",    name: "Deepgram",         desc: "Speech-to-text transcription",           env: "DEEPGRAM_API_KEY" },
  { id: "elevenlabs",  name: "ElevenLabs",       desc: "Text-to-speech voice synthesis",         env: "ELEVENLABS_API_KEY" },
  { id: "twilio",      name: "Twilio",           desc: "Phone calls, SMS, telephony",            env: "TWILIO_ACCOUNT_SID" },
  { id: "aws",         name: "AWS S3",           desc: "Cloud storage for recordings",           env: "AWS_ACCESS_KEY_ID" },
  { id: "acs",         name: "Azure Comm Svcs",  desc: "Email sending via Azure",                env: "ACS_CONNECTION_STRING" },
  { id: "sentry",      name: "Sentry",           desc: "Error monitoring & crash reporting",     env: "SENTRY_DSN" },
  { id: "athena",      name: "athenahealth",     desc: "EHR integration (athenahealth)",         env: "ATHENA_BASE_URL" },
  { id: "slack",       name: "Slack",            desc: "Alerts and notifications",               env: "SLACK_WEBHOOK_URL" },
  { id: "fhir",        name: "FHIR (EHR)",       desc: "Electronic Health Record integration",   env: "FHIR_BASE_URL" },
];

router.get("/providers", async (req, res) => {
  const results = await Promise.all(
    PROVIDER_DEFS.map((p) => checkKey(p.id, p.env).then((v) => ({ id: p.id, connected: !!v })))
  );
  const connected = {};
  for (const r of results) connected[r.id] = r.connected;

  res.json({
    providers: PROVIDER_DEFS.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.desc,
      connected: connected[p.id],
      docs: `https://${p.id === "aws" ? "aws.amazon.com/s3" : p.id + (p.id === "openai" ? ".com/docs" : ".com/docs")}`,
    })),
  });
});

router.get("/config/:provider", async (req, res) => {
  try {
    const doc = await Config.findOne({ provider: req.params.provider });
    res.json({ keys: doc ? Object.fromEntries(doc.keys) : {} });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const PROVIDER_FIELDS = {
  openai:     [ "OPENAI_API_KEY" ],
  deepgram:   [ "DEEPGRAM_API_KEY" ],
  elevenlabs: [ "ELEVENLABS_API_KEY" ],
  twilio:     [ "TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER" ],
  aws:        [ "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION", "AWS_S3_BUCKET" ],
  acs:        [ "ACS_CONNECTION_STRING", "ACS_SENDER_EMAIL" ],
  athena:     [ "ATHENA_BASE_URL", "ATHENA_API_KEY", "ATHENA_API_SECRET", "ATHENA_PRACTICE_ID" ],
  sentry:     [ "SENTRY_DSN", "SENTRY_TRACES_SAMPLE_RATE" ],
  slack:      [ "SLACK_WEBHOOK_URL" ],
  fhir:       [ "FHIR_BASE_URL", "FHIR_API_KEY", "FHIR_SYSTEM" ],
  sms:        [ "TWILIO_PHONE_NUMBER" ],
  security:   [ "JWT_EXPIRES_IN", "PHI_ENCRYPTION_KEY" ],
  general:    [],
};

router.post("/configure", authorize("admin"), async (req, res) => {
  try {
    const { provider, keys } = req.body;
    if (!provider || !keys) {
      return res.status(400).json({ message: "provider and keys required" });
    }
    // Set in process.env immediately for this session
    for (const [k, v] of Object.entries(keys)) {
      if (v) process.env[k] = v;
    }
    const doc = await Config.findOneAndUpdate(
      { provider },
      { keys: new Map(Object.entries(keys)) },
      { upsert: true, new: true }
    );
    autoScrapeUrl(provider, keys);
    res.json({ provider: doc.provider, keys: Object.fromEntries(doc.keys) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// On startup, load DB configs into process.env
Config.find().then((configs) => {
  for (const c of configs) {
    for (const [k, v] of c.keys) {
      if (v && !process.env[k]) process.env[k] = v;
    }
  }
}).catch(() => {});

export async function triggerWebhook(event, payload) {
  const relevantHooks = webhooks.filter(
    (w) => w.active && w.events.includes(event)
  );

  for (const webhook of relevantHooks) {
    try {
      const body = JSON.stringify({ event, timestamp: new Date().toISOString(), data: payload });
      const signature = crypto
        .createHmac("sha256", webhook.secret)
        .update(body)
        .digest("hex");

      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Oriveo-Event": event,
          "X-Oriveo-Signature": signature,
          "X-Oriveo-Timestamp": Date.now().toString(),
        },
        body,
      });

      webhookLogs.push({
        webhookId: webhook.id,
        event,
        status: response.ok ? "success" : "failed",
        statusCode: response.status,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      webhookLogs.push({
        webhookId: webhook.id,
        event,
        status: "failed",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  if (webhookLogs.length > 1000) {
    webhookLogs.splice(0, webhookLogs.length - 1000);
  }
}

import { scrapeClinicWebsite, clearScrapedData } from "../services/websiteScraper.js";

async function autoScrapeUrl(provider, keys) {
  if (provider !== "general") return;
  const url = keys?.PRACTICE_WEBSITE_URL;
  if (!url) return;
  try {
    await scrapeClinicWebsite(url);
    console.log(`[scraper] Auto-scraped practice website: ${url}`);
  } catch (err) {
    console.error(`[scraper] Auto-scrape failed for ${url}: ${err.message}`);
  }
}

router.post("/scrape-website", authorize("admin"), async (req, res) => {
  try {
    const url = req.body.url || process.env.PRACTICE_WEBSITE_URL;
    if (!url) {
      return res.status(400).json({ message: "No website URL configured. Set PRACTICE_WEBSITE_URL in General Settings first." });
    }
    const result = await scrapeClinicWebsite(url);

    if (result.detectedName || result.detectedPhone) {
      const generalDoc = await Config.findOne({ provider: "general" });
      const existingKeys = generalDoc ? Object.fromEntries(generalDoc.keys) : {};
      const updateKeys = { ...existingKeys };

      if (result.detectedName && !updateKeys.PRACTICE_NAME) {
        updateKeys.PRACTICE_NAME = result.detectedName;
        process.env.PRACTICE_NAME = result.detectedName;
      }
      if (result.detectedPhone && !updateKeys.HUMAN_TRANSFER_NUMBER) {
        updateKeys.HUMAN_TRANSFER_NUMBER = result.detectedPhone;
        process.env.HUMAN_TRANSFER_NUMBER = result.detectedPhone;
      }

      await Config.findOneAndUpdate(
        { provider: "general" },
        { keys: new Map(Object.entries(updateKeys)) },
        { upsert: true }
      );

      result.autoPopulated = {
        PRACTICE_NAME: updateKeys.PRACTICE_NAME || null,
        HUMAN_TRANSFER_NUMBER: updateKeys.HUMAN_TRANSFER_NUMBER || null,
      };
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/scrape-website", authorize("admin"), (req, res) => {
  clearScrapedData();
  res.json({ message: "Scraped data cleared" });
});

router.post("/test/:provider", authorize("admin"), async (req, res) => {
  const { provider } = req.params;
  const testers = {
    openai: async () => {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      await client.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: "hi" }], max_tokens: 1 });
    },
    deepgram: async () => {
      const { createClient } = await import("@deepgram/sdk");
      const client = createClient(process.env.DEEPGRAM_API_KEY);
      const { result } = await client.transcription.listProjects();
      if (!result?.projects) throw new Error("No projects found");
    },
    elevenlabs: async () => {
      const response = await fetch("https://api.elevenlabs.io/v1/voices", {
        headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    },
    twilio: async () => {
      const twilio = (await import("twilio")).default;
      const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    },
  };

  const tester = testers[provider];
  if (!tester) return res.status(400).json({ ok: false, message: "Unknown provider" });

  try {
    await tester();
    res.json({ ok: true, message: `${provider} key is valid and working` });
  } catch (err) {
    res.json({ ok: false, message: err.message || "Key verification failed" });
  }
});

export default router;
