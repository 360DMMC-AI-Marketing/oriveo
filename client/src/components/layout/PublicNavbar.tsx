import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Logo from "@/components/ui/Logo";
import { Menu, X } from "lucide-react";

const navLinks = [
  { label: "Features", to: "/features" },
  { label: "Pricing", to: "/pricing" },
  { label: "Contact", to: "/contact" },
];

export default function PublicNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "border-b border-gray-200/60 bg-white/70 backdrop-blur-xl shadow-sm" : "bg-white/0"}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 lg:px-8 py-4">
        <Link to="/" className="flex items-center gap-3">
          <Logo size="md" variant="dark" />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors ${active ? "text-primary" : "text-gray-600 hover:text-gray-900"}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate("/login")} className="text-sm font-medium">Sign in</Button>
          <Button onClick={() => navigate("/contact")} className="bg-primary hover:bg-primary-dark text-sm px-5 shadow-lg shadow-primary/20">Request a Demo</Button>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-4 space-y-3">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to} className={`block text-sm font-medium py-2 ${location.pathname === link.to ? "text-primary" : "text-gray-600"}`}>
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
            <Button variant="ghost" onClick={() => navigate("/login")} className="justify-start text-sm">Sign in</Button>
            <Button onClick={() => navigate("/contact")} className="bg-primary hover:bg-primary-dark text-sm">Request a Demo</Button>
          </div>
        </div>
      )}
    </header>
  );
}
