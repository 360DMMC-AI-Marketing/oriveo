import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: "$99",
    description: "For growing clinics",
    features: [
      "5 team members",
      "500 patients",
      "1,000 calls/mo",
      "27 languages",
      "AI outbound calls",
      "Inbound triage",
      "Basic analytics",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "$299",
    description: "For busy practices",
    popular: true,
    features: [
      "25 team members",
      "5,000 patients",
      "10,000 calls/mo",
      "Everything in Starter",
      "EHR integration",
      "Patient portal",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For health systems",
    features: [
      "Unlimited everything",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
      "On-premise option",
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-sm font-medium tracking-wide text-teal-600 uppercase mb-3">
            Pricing
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            No hidden fees. No surprises. Start free, upgrade when you're ready.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl border p-8 ${
                plan.popular
                  ? "border-teal-600 shadow-lg"
                  : "border-gray-200"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-4 py-1 text-xs font-semibold text-white whitespace-nowrap">
                  <Sparkles className="h-3 w-3" />
                  Most Popular
                </span>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  {plan.name}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold text-gray-900">
                  {plan.price}
                </span>
                {plan.price !== "Custom" && (
                  <span className="text-gray-500 text-sm ml-1">/mo</span>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() =>
                  plan.name === "Enterprise"
                    ? navigate("/contact")
                    : navigate("/signup")
                }
                className={`w-full cursor-pointer ${
                  plan.popular
                    ? "bg-teal-600 hover:bg-teal-700 text-white"
                    : "bg-white border border-gray-300 text-gray-900 hover:bg-gray-50"
                }`}
              >
                {plan.price === "Custom" ? "Contact Sales" : "Get Started"}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-24 text-center">
          <p className="text-sm text-gray-400 mb-2">
            Trusted by healthcare organizations across 27 countries
          </p>
          <p className="text-sm text-gray-400">
            HIPAA compliant · SOC 2 certified · 99.9% uptime SLA
          </p>
        </div>
      </div>
    </section>
  );
}
