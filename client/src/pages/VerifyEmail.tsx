import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, CheckCircle, Mail, Lock, AlertCircle } from "lucide-react";
import Logo from "@/components/ui/Logo";
import api from "@/lib/api";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "no-token">(
    token ? "verifying" : "no-token"
  );
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (token) {
      api.post("/auth/verify-email", { token })
        .then(() => setStatus("success"))
        .catch(() => setStatus("error"));
    }
  }, [token]);

  const handleResend = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem("oriveo_user") || "{}");
      if (user.email) {
        await api.post("/auth/resend-verification", { email: user.email });
      }
      setResent(true);
    } catch {
      // ignore
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
            Verify your<br />email address
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
            We need to verify your email to complete your account setup. Check your inbox for the verification link.
          </p>
          <div className="space-y-3">
            {[
              "One click to verify your email",
              "Verification link expires in 24 hours",
              "Required for full account access",
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

      {/* Right panel — content */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden flex items-center gap-3 p-6 border-b border-gray-100">
          <Logo size="md" variant="dark" />
        </div>

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-sm space-y-8">
            <div>
              <div className="hidden lg:flex items-center gap-3 cursor-pointer mb-8" onClick={() => navigate("/")}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-medium text-gray-500">Back to home</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                {status === "success" ? "Email verified" : status === "error" ? "Verification failed" : "Check your email"}
              </h1>
              <p className="text-sm text-gray-500 mt-1.5">
                {status === "success" && "Your email has been verified. You now have full access to your account."}
                {status === "error" && "This verification link is invalid or has expired."}
                {status === "verifying" && "Verifying your email..."}
                {status === "no-token" && "We sent a verification link to your email address."}
              </p>
            </div>

            {status === "verifying" && (
              <div className="flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <Button className="w-full h-11 rounded-xl" onClick={() => navigate("/dashboard")}>
                  <span className="flex items-center gap-2">
                    Go to Dashboard <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mx-auto">
                  <AlertCircle className="h-8 w-8 text-danger" />
                </div>
                <Button variant="outline" className="w-full h-11 rounded-xl" onClick={() => { setStatus("no-token"); setResent(false); }}>
                  Request a new link
                </Button>
              </div>
            )}

            {status === "no-token" && (
              <div className="space-y-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
                {resent ? (
                  <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-600 text-center">
                    Verification email sent. Check your inbox.
                  </div>
                ) : (
                  <Button
                    className="w-full h-11 rounded-xl"
                    onClick={handleResend}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Sending...
                      </span>
                    ) : "Resend verification email"}
                  </Button>
                )}
                <Button variant="ghost" className="w-full" onClick={() => navigate("/")}>
                  Back to home
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
