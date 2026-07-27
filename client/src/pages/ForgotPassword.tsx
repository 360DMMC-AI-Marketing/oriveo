import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Shield, CheckCircle, Mail, Lock } from "lucide-react";
import Logo from "@/components/ui/Logo";
import api from "@/lib/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branded */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-black flex-col justify-between p-12">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-emerald-500/5 blur-3xl" />
        </div>
        <div className="relative">
          <Logo size="lg" variant="light" />
        </div>
        <div className="relative space-y-8">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Reset your password<br />in seconds
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
            We'll send you a secure link to create a new password. The link expires in 1 hour.
          </p>
          <div className="space-y-3">
            {[
              "Encrypted reset link sent to your email",
              "No one else can access your account",
              "All existing sessions will be signed out",
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                <span className="text-sm text-gray-300">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-xs text-gray-600">
          <Lock className="h-3 w-3" />
          <span>256-bit TLS encryption in transit</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center gap-3 p-6 border-b border-gray-100">
          <Logo size="md" variant="dark" />
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-8">
            <div>
              <div className="hidden lg:flex items-center gap-3 cursor-pointer mb-8" onClick={() => navigate("/login")}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-500">Back to sign in</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Forgot password?</h1>
              <p className="text-sm text-gray-500 mt-1.5">Enter your email and we'll send you a reset link</p>
            </div>

            {error && (
              <div className="rounded-xl bg-danger-light border border-red-200 px-4 py-3 text-sm text-danger font-medium">
                {error}
              </div>
            )}

            {sent ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
                  <p className="text-sm text-gray-500">
                    We sent a password reset link to <strong>{email}</strong>
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600 text-center">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button onClick={() => { setSent(false); setError(""); }} className="font-semibold text-primary hover:text-primary-dark">
                    try again
                  </button>
                </div>
                <Button variant="outline" className="w-full h-11 rounded-xl" onClick={() => navigate("/login")}>
                  Back to sign in
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@clinic.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary"
                  />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl text-sm font-semibold" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Sending link...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Send reset link <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            )}

            <p className="text-center text-sm text-gray-500">
              Remember your password?{" "}
              <a href="/login" className="font-semibold text-primary hover:text-primary-dark transition-colors">
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
