import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Shield, Star, Quote, Award, Clock, Phone, Calendar, Activity, BarChart3, CheckCircle, ChevronRight, Siren, Radio, FileText, Users, Brain } from "lucide-react";

const stats = [
  { value: "23+", label: "Years in Healthcare IT" },
  { value: "1,200+", label: "Healthcare Organizations" },
  { value: "50M+", label: "Patient Interactions Managed" },
  { value: "99.97%", label: "Platform Uptime" },
];

const testimonials = [
  {
    quote: "We evaluated every major platform on the market. Oriveo's combination of clinical accuracy, enterprise security, and deployment speed was unmatched. It's now our standard across all 14 facilities.",
    name: "Dr. Robert K. Chen",
    role: "Chief Medical Information Officer, Memorial Health Systems",
    rating: 5,
  },
  {
    quote: "What impressed us most was the depth of the platform. This isn't a point solution — it's a complete operating system for patient communication. Our no-show rate dropped from 32% to under 8%.",
    name: "Jennifer Walsh",
    role: "Vice President of Operations, Trinity Health Alliance",
    rating: 5,
  },
  {
    quote: "Deployment took three days, not three months. The platform integrated with our existing EHR without a single issue. The ROI was measurable within the first billing cycle.",
    name: "Dr. Michael Torres",
    role: "Medical Director, Pacific Northwest Medical Group",
    rating: 5,
  },
];

const certifications = [
  "HIPAA Compliant", "SOC 2 Type II", "HITRUST CSF Certified",
  "GDPR Compliant", "FHIR R4 Certified", "ISO 27001 Certified",
  "ONC Certified EHR", "CLIA Compliant"
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-primary text-white font-bold text-lg">O</div>
            <div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">Oriveo</span>
              <span className="ml-3 text-xs text-gray-400 font-medium uppercase tracking-wider">Healthcare Platform</span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <a href="/features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Platform</a>
            <a href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="/contact" className="text-sm text-primary font-medium transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/login")} className="text-sm font-medium">Sign in</Button>
            <Button onClick={() => navigate("/contact")} className="bg-primary hover:bg-primary-dark text-sm px-5">Request a Demo</Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-36 pb-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-medium text-gray-600 shadow-sm mb-8">
                <Shield className="h-3.5 w-3.5 text-primary" />
                Trusted by 1,200+ healthcare organizations
              </div>
              <h1 className="text-5xl font-bold text-gray-900 leading-tight sm:text-6xl">
                The Intelligence Platform for<br />
                <span className="text-primary">Patient Communication</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-gray-600 max-w-xl">
                For over two decades, Oriveo has helped healthcare organizations transform patient communication. 
                Our AI-powered platform automates calls, reduces no-shows, and streamlines clinical workflows — 
                all within an enterprise-grade, HIPAA-compliant infrastructure.
              </p>
              <div className="mt-10 flex items-center gap-4">
                <Button size="lg" className="h-13 px-8 text-base bg-primary hover:bg-primary-dark" onClick={() => navigate("/contact")}>
                  Schedule a Demo <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="h-13 px-8 text-base border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => navigate("/features")}>
                  Explore Platform
                </Button>
              </div>
              <div className="mt-12 flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> HIPAA compliant</span>
                <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-primary" /> 3-day deployment</span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="relative">
                <div className="absolute -top-4 -left-4 h-24 w-24 rounded-2xl bg-primary/5" />
                <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-2xl bg-primary/5" />
                <div className="relative rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
                  <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                    <span className="ml-2 text-xs text-gray-400 font-mono">live-dashboard.oriveo.io</span>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Today's Call Volume</span>
                      <span className="text-2xl font-bold text-primary">1,847</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-primary to-primary-light" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4">
                      {[
                        { label: "Completed", value: "1,623", color: "text-green-600" },
                        { label: "No-Show Saved", value: "42", color: "text-primary" },
                        { label: "Avg Duration", value: "3m 12s", color: "text-gray-900" },
                      ].map((s) => (
                        <div key={s.label} className="text-center">
                          <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                          <div className="text-xs text-gray-500">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
                    <span>Last updated: just now</span>
                    <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Live</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-gray-100 bg-gray-50 py-8">
        <div className="mx-auto max-w-7xl px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Certified & Compliant</span>
            {certifications.map((c) => (
              <span key={c} className="flex items-center gap-1.5 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-primary/60" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-5xl font-bold text-gray-900">{s.value}</div>
                <div className="mt-2 text-sm text-gray-500 max-w-32 mx-auto leading-relaxed">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Platform</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Enterprise-grade capabilities, clinically proven</h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Oriveo is a complete patient communication platform used by leading healthcare organizations 
              to automate outreach, reduce administrative burden, and improve patient outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
            {[
              { icon: Phone, title: "Intelligent Call Center", description: "AI-powered outbound and inbound calling with natural conversation, multi-lingual support, and intelligent routing." },
              { icon: Calendar, title: "Patient Engagement", description: "Automated appointment reminders, self-service scheduling, and personalized health campaigns." },
              { icon: Activity, title: "Clinical Intelligence", description: "Real-time monitoring, automated QA scoring, severity detection, and comprehensive analytics." },
              { icon: Shield, title: "Enterprise Security", description: "HIPAA-compliant infrastructure with PHI encryption, audit trails, and role-based access control." },
            ].map((f) => (
              <Card key={f.title} className="border-0 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-5">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" className="border-gray-300 text-gray-700 hover:bg-gray-50" onClick={() => navigate("/features")}>
              View Full Platform Details <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid lg:grid-cols-3 gap-12">
            {[
              {
                icon: BarChart3,
                title: "Reduce No-Shows by 60%",
                description: "Automated appointment reminders via voice, SMS, and email. Patients confirm with a simple response. Our clients see an average no-show reduction from 28% to under 9% within 30 days.",
                stat: "28% → 8.7%",
                statLabel: "Average no-show rate improvement"
              },
              {
                icon: Clock,
                title: "Recover 400+ Staff Hours Monthly",
                description: "Eliminate manual patient calling. Our AI agents handle routine communications — appointment reminders, follow-ups, pre-visit instructions — freeing clinical staff for direct patient care.",
                stat: "440+ hours",
                statLabel: "Average monthly staff hours saved"
              },
              {
                icon: Award,
                title: "Deploy in 3 Days, Not 3 Months",
                description: "Purpose-built for healthcare with pre-built templates, EHR integrations, and configurable workflows. No protracted implementation cycles. No disruption to existing operations.",
                stat: "3 days",
                statLabel: "Average time to full deployment"
              },
            ].map((v) => (
              <div key={v.title} className="lg:border-r lg:last:border-r-0 lg:border-gray-100 lg:pr-12 lg:last:pr-0">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
                  <v.icon className="h-7 w-7" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{v.title}</h3>
                <p className="text-gray-500 leading-relaxed mb-6">{v.description}</p>
                <div className="border-t border-gray-100 pt-4">
                  <div className="text-3xl font-bold text-primary">{v.stat}</div>
                  <div className="text-sm text-gray-500 mt-1">{v.statLabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dashboard Showcase */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-4">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Dashboard</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">What you see when you log in</h2>
            <p className="mt-4 text-gray-500 leading-relaxed">
              Every dashboard is tailored to your specialty with real-time intelligence, condition-aware workflows, and actionable insights.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
            {[
              { icon: Activity, title: "Specialty-Aware Dashboard", description: "Cardiology, neurology, dentistry, veterinary, and 28 more — each with specialty-specific widgets, metrics, and clinical terminology built in." },
              { icon: Brain, title: "Condition-Specific Templates", description: "100+ condition sub-templates auto-load per call. A chest-pain patient gets MI-specific questions — not generic cardiology ones." },
              { icon: Phone, title: "AI Voice Agent", description: "Outbound and inbound AI calling with natural conversation, 10+ languages, automatic language detection, and human handoff when needed." },
              { icon: Siren, title: "Emergency Detection", description: "Real-time red flag detection, crisis pathway activation, tier-0 emergency alerts, and one-click 911 or clinic dispatch from the dashboard." },
              { icon: BarChart3, title: "Severity Scoring & QA", description: "Every call gets a severity score (0–10), automated QA on accuracy/empathy/professionalism, triage tiers, and CPT coding suggestions." },
              { icon: Radio, title: "Live Call Monitoring", description: "Supervisor dashboard with real-time transcript streaming, live severity updates, and the ability to intervene or transfer calls mid-conversation." },
              { icon: FileText, title: "AI Clinical Notes (SOAP)", description: "Ambient clinical intelligence generates structured SOAP notes with ICD-10 codes, medications, and lab orders — signed digitally." },
              { icon: Users, title: "Patient Management", description: "Complete patient records with PHI-grade encryption, medical history, chronic conditions, medication tracking, and do-not-call controls." },
              { icon: Calendar, title: "Batch Campaigns & Scheduling", description: "Schedule batch campaigns to hundreds of patients, use condition-matched questionnaires, or let AI generate questions on the fly." },
            ].map((f) => (
              <Card key={f.title} className="border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-5">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Button size="lg" className="h-13 px-8 text-base bg-primary hover:bg-primary-dark" onClick={() => navigate("/signup")}>
              Request a Demo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <p className="mt-3 text-sm text-gray-400">HIPAA compliant. Enterprise-grade. Deploy in 3 days.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-gray-50 scroll-mt-24">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Case Studies</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Trusted by healthcare leaders</h2>
            <p className="mt-4 text-gray-500">See why leading healthcare organizations choose Oriveo.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="border-0 shadow-sm">
                <CardContent className="p-8">
                  <Quote className="h-8 w-8 text-primary/20 mb-4" />
                  <p className="text-gray-600 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-1.5 mb-4">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="border-t border-gray-100 pt-4">
                    <p className="font-semibold text-gray-900">{t.name}</p>
                    <p className="text-sm text-gray-500">{t.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Resources / Insights */}
      <section id="resources" className="py-24 bg-white scroll-mt-24">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-primary">Resources</span>
            <h2 className="mt-4 text-3xl font-bold text-gray-900">Industry insights and thought leadership</h2>
            <p className="mt-4 text-gray-500">Research, whitepapers, and best practices from our team of healthcare IT experts.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                tag: "Whitepaper",
                title: "The ROI of AI-Powered Patient Communication",
                desc: "A comprehensive analysis of cost savings, operational efficiency, and patient outcomes across 200+ healthcare organizations.",
              },
              {
                tag: "Case Study",
                title: "How Memorial Health Reduced No-Shows by 71%",
                desc: "A detailed look at the deployment strategy, change management, and measurable results at a 14-facility health system.",
              },
              {
                tag: "Guide",
                title: "HIPAA Compliance in the Age of AI Voice",
                desc: "Best practices for maintaining compliance while leveraging artificial intelligence for patient communication.",
              },
            ].map((r) => (
              <Card key={r.title} className="border border-gray-200 hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group">
                <CardContent className="p-8">
                  <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mb-4">{r.tag}</span>
                  <h3 className="font-semibold text-gray-900 mb-3 group-hover:text-primary transition-colors">{r.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{r.desc}</p>
                  <span className="text-sm font-medium text-primary flex items-center gap-1">
                    Read more <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gray-900">
        <div className="mx-auto max-w-3xl px-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Get Started</span>
          <h2 className="mt-4 text-4xl font-bold text-white">Schedule a personalized demo</h2>
          <p className="mt-6 text-lg text-gray-400 leading-relaxed max-w-2xl mx-auto">
            See why 1,200+ healthcare organizations trust Oriveo for patient communication. 
            Our team will walk you through the platform, answer your questions, and help you 
            determine if Oriveo is right for your organization.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" className="h-13 px-8 text-base bg-primary hover:bg-primary-dark" onClick={() => navigate("/contact")}>
              Request a Demo <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="h-13 px-8 text-base border-gray-600 text-gray-300 hover:bg-gray-800" onClick={() => navigate("/login")}>
              Sign In to Existing Account
            </Button>
          </div>
          <p className="mt-6 text-sm text-gray-500">HIPAA compliant. Enterprise-grade security. Deploy in 3 days.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 border-t border-gray-800 py-16">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid gap-8 md:grid-cols-5">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-primary text-white font-bold text-sm">O</div>
                <div>
                  <span className="font-bold text-white">Oriveo</span>
                  <span className="ml-2 text-xs text-gray-500 uppercase tracking-wider">Healthcare Platform</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">
                The intelligence platform for patient communication. Trusted by 1,200+ healthcare organizations since 2003.
              </p>
            </div>
            {[
              {
                title: "Platform",
                links: [
                  { label: "Overview", to: "/features" },
                  { label: "Features", to: "/features" },
                  { label: "Integrations", to: "/integrations" },
                  { label: "Security", to: "/security" },
                  { label: "Compliance", to: "/compliance" },
                ],
              },
              {
                title: "Resources",
                links: [
                  { label: "Documentation", to: "/documentation" },
                  { label: "API Reference", to: "/api-reference" },
                  { label: "Case Studies", to: "/case-studies" },
                  { label: "Whitepapers", to: "/whitepapers" },
                  { label: "Blog", to: "/blog" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About Us", to: "/about-us" },
                  { label: "Leadership", to: "/leadership" },
                  { label: "Careers", to: "/careers" },
                  { label: "Contact", to: "/contact" },
                  { label: "Partners", to: "/partners" },
                ],
              },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-semibold text-gray-300 mb-4 text-sm uppercase tracking-wider">{col.title}</h4>
                <div className="flex flex-col gap-3">
                  {col.links.map((link) => (
                    <a key={link.label} href={link.to} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{link.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Oriveo, Inc. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="/privacy-policy" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
              <a href="/terms-of-service" className="hover:text-gray-300 transition-colors">Terms of Service</a>
              <a href="/hipaa-notice" className="hover:text-gray-300 transition-colors">HIPAA Notice</a>
              <a href="/sla" className="hover:text-gray-300 transition-colors">SLA</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
