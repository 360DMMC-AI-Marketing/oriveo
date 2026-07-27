import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Clock } from "lucide-react";

export default function Contact() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    organization: "",
    message: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      toast.success("Message sent! We'll be in touch shortly.");
      setLoading(false);
      setForm({ name: "", email: "", phone: "", organization: "", message: "" });
    }, 1000);
  };

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-20">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">Get in Touch</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Request a demo, ask questions, or let us know how we can help.
          </p>
        </div>

        {/* Two Column */}
        <div className="grid md:grid-cols-5 gap-16">
          {/* Form */}
          <form onSubmit={handleSubmit} className="md:col-span-3 space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input id="name" name="name" required value={form.name} onChange={handleChange} placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} placeholder="jane@company.com" />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input id="organization" name="organization" value={form.organization} onChange={handleChange} placeholder="Acme Healthcare" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message *</Label>
              <Textarea id="message" name="message" required rows={5} value={form.message} onChange={handleChange} placeholder="Tell us about your needs…" className="resize-none" />
            </div>

            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Sending…" : "Send Message"}
            </Button>
          </form>

          {/* Contact Info */}
          <div className="md:col-span-2 space-y-10">
            <div>
              <h3 className="font-semibold mb-4">Contact Information</h3>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>hello@oriveo.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>+1 (800) 555-0123</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>123 Innovation Drive<br />San Francisco, CA 94105</span>
                </li>
                <li className="flex items-start gap-3">
                  <Clock className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>Mon – Fri, 8am – 6pm PT</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li><a href="/pricing" className="hover:text-foreground transition-colors">View Pricing</a></li>
                <li><a href="/docs" className="hover:text-foreground transition-colors">Documentation</a></li>
                <li><a href="/security" className="hover:text-foreground transition-colors">Security & Compliance</a></li>
                <li><a href="/about" className="hover:text-foreground transition-colors">About Us</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
