import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Shield, Copy, Check, Loader2, QrCode, KeyRound, AlertTriangle, Download } from "lucide-react";
import api from "@/lib/api";

export default function TwoFactorSetup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"setup" | "verify" | "backup" | "done">("setup");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [allCodesCopied, setAllCodesCopied] = useState(false);

  const setupMutation = useMutation({
    mutationFn: () => api.post("/auth/2fa/setup"),
    onSuccess: (res: any) => {
      setQrCode(res.data.qrCode);
      setSecret(res.data.secret);
      setBackupCodes(res.data.backupCodes);
      setStep("verify");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Failed to set up 2FA"),
  });

  const enableMutation = useMutation({
    mutationFn: (token: string) => api.post("/auth/2fa/enable", { token }),
    onSuccess: () => {
      setStep("backup");
      toast.success("Two-factor authentication enabled");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Invalid code"),
  });

  useEffect(() => {
    setupMutation.mutate();
  }, []);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    enableMutation.mutate(verifyCode);
  };

  const copyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setAllCodesCopied(true);
    setTimeout(() => setAllCodesCopied(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Two-Factor Authentication</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {step === "verify" && "Scan the QR code with your authenticator app, then enter the verification code"}
          {step === "backup" && "Save these backup codes in a safe place. Each code can only be used once."}
          {step === "done" && "Two-factor authentication is now enabled on your account"}
        </p>
      </div>

      {step === "verify" && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <QrCode className="h-4 w-4" /> Scan QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {qrCode && (
                <div className="flex justify-center">
                  <img src={qrCode} alt="2FA QR Code" className="rounded-xl border border-gray-200" />
                </div>
              )}
              <div className="space-y-1">
                <Label className="text-xs text-gray-500">Manual entry key</Label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono break-all">
                    {secret}
                  </code>
                  <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(secret); toast.success("Copied"); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <KeyRound className="h-4 w-4" /> Verify Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerify} className="space-y-4">
                <p className="text-xs text-gray-500">Enter the 6-digit code from your authenticator app to confirm setup</p>
                <Input
                  type="text"
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  className="h-11 text-center text-lg tracking-[0.5em] font-mono rounded-xl"
                  required
                />
                <Button type="submit" className="w-full h-11 rounded-xl" disabled={enableMutation.isPending || verifyCode.length !== 6}>
                  {enableMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                    </span>
                  ) : "Verify & Enable"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      {step === "backup" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Backup Codes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-gray-500">
              Store these codes somewhere safe. If you lose access to your authenticator app, you can use one of these codes to sign in.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <div key={i} className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  <code className="text-sm font-mono">{code}</code>
                  <button onClick={() => copyCode(code, i)} className="text-gray-400 hover:text-gray-600">
                    {copiedIndex === i ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyAllCodes} className="rounded-lg">
                {allCodesCopied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                {allCodesCopied ? "Copied" : "Copy All"}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setStep("done"); }} className="rounded-lg">
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "done" && (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">You're all set</h2>
              <p className="text-sm text-gray-500 mt-1">Two-factor authentication is enabled. You'll need your authenticator app when signing in.</p>
            </div>
            <Button onClick={() => navigate("/my-profile")} className="rounded-xl">
              Back to Profile
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
