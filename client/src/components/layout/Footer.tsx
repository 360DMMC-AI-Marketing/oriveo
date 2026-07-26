import { Link } from "react-router-dom";
import Logo from "@/components/ui/Logo";

const footerColumns = [
  {
    title: "Platform",
    links: [
      { label: "Overview", to: "/features" },
      { label: "Features", to: "/features" },
      { label: "Pricing", to: "/pricing" },
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
      { label: "Blog", to: "/blog" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", to: "/about-us" },
      { label: "Careers", to: "/careers" },
      { label: "Contact", to: "/contact" },
      { label: "Partners", to: "/partners" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800 py-16">
      <div className="mx-auto max-w-7xl px-8">
        <div className="grid gap-8 md:grid-cols-5">
          <div className="md:col-span-2">
            <Logo size="sm" variant="light" />
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mt-3">
              The intelligence platform for patient communication. Trusted by 1,200+ healthcare organizations since 2003.
            </p>
          </div>
          {footerColumns.map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-gray-300 mb-4 text-sm uppercase tracking-wider">{col.title}</h4>
              <div className="flex flex-col gap-3">
                {col.links.map((link) => (
                  <Link key={link.label} to={link.to} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">{link.label}</Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} Oriveo, Inc. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link to="/privacy-policy" className="hover:text-gray-300 transition-colors">Privacy Policy</Link>
            <Link to="/terms-of-service" className="hover:text-gray-300 transition-colors">Terms of Service</Link>
            <Link to="/hipaa-notice" className="hover:text-gray-300 transition-colors">HIPAA Notice</Link>
            <Link to="/sla" className="hover:text-gray-300 transition-colors">SLA</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
