import { Router, raw as rawBody } from "express";
import { protect } from "../middleware/auth.js";
import Subscription from "../models/Subscription.js";
import Organization from "../models/Organization.js";

const router = Router();

let stripe = null;
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    const Stripe = require("stripe");
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripe;
}

const PRICE_IDS = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  enterprise: null,
};

router.post("/create-checkout-session", async (req, res) => {
  try {
    const client = getStripe();
    if (!client) return res.status(400).json({ message: "Stripe not configured" });
    const { priceId, organizationId, successUrl, cancelUrl } = req.body;
    if (!priceId || !organizationId) {
      return res.status(400).json({ message: "Price ID and organization ID required" });
    }
    const session = await client.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { organizationId },
      success_url: successUrl || `${process.env.CORS_ORIGIN || "http://localhost:5173"}/clinic/billing?success=true`,
      cancel_url: cancelUrl || `${process.env.CORS_ORIGIN || "http://localhost:5173"}/pricing`,
    });
    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/create-portal-session", protect, async (req, res) => {
  try {
    const client = getStripe();
    if (!client) return res.status(400).json({ message: "Stripe not configured" });
    const org = await Organization.findById(req.user.organization).lean();
    if (!org?.stripeCustomerId) return res.status(400).json({ message: "No Stripe customer found" });
    const session = await client.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${process.env.CORS_ORIGIN || "http://localhost:5173"}/clinic/billing`,
    });
    res.json({ url: session.url });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/webhook", rawBody({ type: "application/json" }), async (req, res) => {
  try {
    const client = getStripe();
    if (!client) return res.status(400).send("Stripe not configured");
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = client.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch {
      return res.status(400).send("Invalid signature");
    }
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const orgId = session.metadata?.organizationId;
        if (orgId) {
          await Organization.findByIdAndUpdate(orgId, { stripeCustomerId: session.customer });
          await Subscription.findOneAndUpdate(
            { organization: orgId },
            {
              status: "active",
              plan: session.metadata?.plan || "starter",
              stripeSubscriptionId: session.subscription,
              startDate: new Date(),
            },
            { upsert: true }
          );
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const org = await Organization.findOne({ stripeCustomerId: sub.customer });
        if (org) {
          const status = sub.status === "active" ? "active" : sub.status === "past_due" ? "suspended" : "cancelled";
          await Subscription.findOneAndUpdate({ organization: org._id }, { status });
        }
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
