import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Shield, CheckCircle, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import Logo from "@/components/ui/Logo";
import api from "@/lib/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-xl bg-white p-8 shadow-lg text-center">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid reset link</h1>
          <p className="text-gray-500 mb-4">This password reset link is invalid or missing a token.</p>
          <Button onClick={() => navigate("/forgot-password")} className="rounded-xl">
            Request a new link
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid or expired reset link");
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
            Create a new<br />strong password
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-lg">
            Make sure your new password is at least 6 characters long. We recommend using a mix of letters, numbers, and symbols.
          </p>
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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Set new password</h1>
              <p className="text-sm text-gray-500 mt-1.5">Choose a strong password for your account</p>
            </div>

            {error && (
              <div className="rounded-xl bg-danger-light border border-red-200 px-4 py-3 text-sm text-danger font-medium">
                {error}
              </div>
            )}

            {success ? (
              <div className="space-y-6">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold text-gray-900">Password reset successfully</h2>
                  <p className="text-sm text-gray-500">You can now sign in with your new password</p>
                </div>
                <Button className="w-full h-11 rounded-xl" onClick={() => navigate("/login")}>
                  <span className="flex items-center gap-2">
                    Sign in <ArrowRight className="h-4 w-4" />
                  </span>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">New password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary pr-11"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm" className="text-sm font-medium text-gray-700">Confirm password</Label>
                  <Input
                    id="confirm"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11 rounded-xl border-gray-200 focus:border-primary focus:ring-primary"
                  />
                </div>
                <Button type="submit" className="w-full h-11 rounded-xl text-sm font-semibold" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Resetting...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Reset password <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
