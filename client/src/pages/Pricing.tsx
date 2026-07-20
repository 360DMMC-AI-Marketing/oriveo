import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, ArrowLeft } from "lucide-react";

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
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white font-bold text-lg shadow-lg shadow-primary/20">O</div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">Oriveo</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="/features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="/pricing" className="text-sm font-medium text-primary">Pricing</a>
            <a href="/contact" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")} className="text-sm">Sign in</Button>
            <Button onClick={() => navigate("/contact")} className="shadow-lg shadow-primary/20 text-sm px-5">Request a Demo</Button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-28 pb-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Simple, transparent pricing</h1>
          <p className="text-gray-500 text-lg">Enterprise pricing tailored to your organization.</p>
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
                <Button className={`w-full mb-6 ${p.popular ? "" : "variant-outline"}`}>{p.name === "Enterprise" ? "Contact Sales" : "Get Started"}</Button>
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

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white font-bold text-xs">O</div>
            <span className="text-sm font-bold text-gray-900">Oriveo</span>
            <span className="text-xs text-gray-400">Healthcare Platform</span>
          </div>
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Oriveo, Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <a href="/contact" className="hover:text-gray-600 transition-colors">Privacy Policy</a>
            <a href="/contact" className="hover:text-gray-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
