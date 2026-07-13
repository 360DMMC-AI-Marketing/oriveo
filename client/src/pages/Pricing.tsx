import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Starter", price: "$99", period: "/mo", desc: "For growing clinics", popular: false,
    features: ["5 team members", "500 patients", "1,000 calls/month", "27 languages", "AI outbound calls", "Inbound triage", "Basic analytics", "Email support"],
  },
  {
    name: "Pro", price: "$299", period: "/mo", desc: "For busy practices", popular: true,
    features: ["25 team members", "5,000 patients", "10,000 calls/month", "27 languages", "Everything in Starter", "EHR integration", "Patient portal", "Priority support"],
  },
  {
    name: "Enterprise", price: "Custom", period: "", desc: "For health systems", popular: false,
    features: ["Unlimited team members", "Unlimited patients", "Unlimited calls", "All languages", "Custom integrations", "Dedicated support", "SLA guarantee", "On-premise option"],
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-4 pt-20 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Simple, transparent pricing</h1>
          <p className="text-gray-500 text-lg">Start with a free trial. No credit card required.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map(p => (
            <div key={p.name} className={`relative rounded-2xl border p-6 bg-white ${p.popular ? "ring-2 ring-primary shadow-lg shadow-primary/10 scale-105" : "shadow-sm"}`}>
              {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1"><Sparkles className="h-3 w-3" /> Most Popular</div>}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className="text-gray-500 text-sm mb-4">{p.desc}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold">{p.price}</span>
                <span className="text-gray-400 text-sm">{p.period}</span>
              </div>
              <Link to="/signup">
                <Button className={`w-full mb-6 ${p.popular ? "" : "variant-outline"}`}>{p.name === "Enterprise" ? "Contact Sales" : "Start Free Trial"}</Button>
              </Link>
              <ul className="space-y-2.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
