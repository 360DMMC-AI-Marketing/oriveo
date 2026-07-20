import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Contact() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in name, email, and message.");
      return;
    }
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success("Message sent! Our team will get back to you within 24 hours.");
    setForm({ name: "", email: "", phone: "", company: "", message: "" });
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-8 py-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
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
      <section className="pt-36 pb-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-3xl px-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">Get in Touch</span>
          <h1 className="mt-6 text-5xl font-bold text-gray-900">Contact Our Team</h1>
          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
            Request a demo, ask questions, or let us know how we can help your organization.
          </p>
        </div>
      </section>

      {/* Contact Form */}
      <section className="pb-24">
        <div className="mx-auto max-w-2xl px-8">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center border-b bg-gray-50/50">
              <CardTitle className="text-xl">Send us a message</CardTitle>
              <p className="text-sm text-gray-500 mt-1">We typically respond within 24 hours.</p>
            </CardHeader>
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Dr. Jane Smith" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="jane@clinic.com" required />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+1 (555) 123-4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Organization</Label>
                    <Input id="company" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Memorial Health Systems" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea id="message" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your needs — demo request, integration questions, partnership inquiry, etc." required />
                </div>
                <Button type="submit" className="w-full h-12 text-base" disabled={sending}>
                  {sending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </CardContent>
          </Card>
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
                  { label: "Integrations", to: "/contact" },
                  { label: "Security", to: "/contact" },
                  { label: "Compliance", to: "/contact" },
                ],
              },
              {
                title: "Resources",
                links: [
                  { label: "Documentation", to: "/contact" },
                  { label: "API Reference", to: "/contact" },
                  { label: "Case Studies", to: "/contact" },
                  { label: "Whitepapers", to: "/contact" },
                  { label: "Blog", to: "/contact" },
                ],
              },
              {
                title: "Company",
                links: [
                  { label: "About Us", to: "/contact" },
                  { label: "Leadership", to: "/contact" },
                  { label: "Careers", to: "/contact" },
                  { label: "Contact", to: "/contact" },
                  { label: "Partners", to: "/contact" },
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
              <a href="/contact" className="hover:text-gray-300 transition-colors">Privacy Policy</a>
              <a href="/contact" className="hover:text-gray-300 transition-colors">Terms of Service</a>
              <a href="/contact" className="hover:text-gray-300 transition-colors">HIPAA Notice</a>
              <a href="/contact" className="hover:text-gray-300 transition-colors">SLA</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
