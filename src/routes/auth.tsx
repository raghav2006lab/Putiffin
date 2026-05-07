import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { adminLogin, userLogin, userSignup, forgotPassword, resetPassword } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, CheckCircle, Eye, EyeOff } from "lucide-react";
import { sendOtp, verifyOtp } from "@/lib/api";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { refreshRole } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // OTP State
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [view, setView] = useState<"auth" | "forgot">("auth");
  const [resetFinished, setResetFinished] = useState(false);

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return toast.error("Enter a valid 10-digit mobile number");
    }
    setSendingOtp(true);
    try {
      await sendOtp(phone);
      setOtpSent(true);
      toast.success("OTP sent to " + phone);
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) return toast.error("Enter the OTP");
    setVerifyingOtp(true);
    try {
      await verifyOtp(phone, otp);
      setPhoneVerified(true);
      toast.success("Phone verified! ✅");
    } catch (err: any) {
      toast.error(err.message || "Invalid OTP");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const onAdminLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = fd.get("password") as string;
    if (!password) return toast.error("Enter admin password");

    setLoading(true);
    try {
      await adminLogin(password);
      refreshRole();
      toast.success("Welcome, Admin! 🎉");
      navigate({ to: "/admin" });
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onUserLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;

    setLoading(true);
    try {
      await userLogin({ email, password });
      refreshRole();
      toast.success("Welcome back! 👋");
      navigate({ to: "/menu" });
    } catch (err: any) {
      toast.error(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const onUserSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const full_name = fd.get("full_name") as string;
    const email = fd.get("email") as string;
    const password = fd.get("password") as string;
    const phoneInput = fd.get("phone") as string;

    if (!phoneInput || !/^[0-9]{10}$/.test(phoneInput)) {
      return toast.error("Please enter a valid 10-digit phone number");
    }

    setLoading(true);
    try {
      await userSignup({ full_name, email, password, phone: phoneInput, phone_verified: false });
      refreshRole();
      toast.success("Account created! 🎉");
      navigate({ to: "/menu" });
    } catch (err: any) {
      toast.error(err.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const newPassword = fd.get("new_password") as string;

    if (!phoneVerified) return toast.error("Please verify your phone number first");
    if (newPassword.length < 6) return toast.error("Password must be at least 6 characters");

    setLoading(true);
    try {
      await resetPassword(phone, newPassword);
      toast.success("Password reset successfully! 🎉");
      setResetFinished(true);
      setTimeout(() => {
        setView("auth");
        setResetFinished(false);
        setPhoneVerified(false);
        setOtpSent(false);
        setPhone("");
        setOtp("");
      }, 2000);
    } catch (err: any) {
      toast.error(err.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="mx-auto flex max-w-md flex-col px-4 py-12">
        <div className="mb-6 text-center">
          <div className="text-5xl">🍱</div>
          <h1 className="mt-2 font-display text-3xl font-bold">Welcome to PU Tiffin</h1>
          <p className="text-sm text-muted-foreground">Order fresh home-cooked meals</p>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-6 shadow-[var(--shadow-warm)]">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5">
              <form onSubmit={onUserLogin} className="space-y-4">
                <div>
                  <Label htmlFor="li-email">Email</Label>
                  <Input id="li-email" name="email" type="email" required placeholder="name@example.com" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="li-password">Password</Label>
                    <button type="button" onClick={() => setView("forgot")} className="text-[10px] font-semibold text-primary hover:underline">Forgot password?</button>
                  </div>
                  <div className="relative">
                    <Input id="li-password" name="password" type={showPassword ? "text" : "password"} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
                  {loading ? "Logging in..." : "Login"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-5">
              <form onSubmit={onUserSignup} className="space-y-4">
                <div>
                  <Label htmlFor="su-name">Full Name</Label>
                  <Input id="su-name" name="full_name" required placeholder="John Doe" />
                </div>
                <div>
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" name="email" type="email" required placeholder="name@example.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="su-phone">Phone Number</Label>
                  <Input
                    id="su-phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="10-digit mobile number"
                    maxLength={10}
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    * This number will be used for delivery contact.
                  </p>
                </div>

                <div>
                  <Label htmlFor="su-password">Password</Label>
                  <div className="relative">
                    <Input id="su-password" name="password" type={showPassword ? "text" : "password"} required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground">
                  {loading ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin" className="mt-5">
              <form onSubmit={onAdminLogin} className="space-y-4">
                <div>
                  <Label htmlFor="adm-password">Admin Password</Label>
                  <div className="relative">
                    <Input id="adm-password" name="password" type={showPassword ? "text" : "password"} required placeholder="Enter admin password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full variant-outline border-2">
                  {loading ? "..." : "Login as Admin"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Forgot Password View Overlay */}
          {view === "forgot" && (
            <div className="absolute inset-0 z-10 bg-card p-6 flex flex-col rounded-2xl">
              <button onClick={() => setView("auth")} className="text-left text-sm text-primary font-semibold mb-4 hover:underline">← Back to Login</button>
              <h2 className="text-xl font-bold mb-1">Reset Password</h2>
              <p className="text-xs text-muted-foreground mb-6">Enter your phone number to receive an OTP</p>
              
              <form onSubmit={onResetPassword} className="space-y-4 flex-1">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <div className="flex gap-2">
                    <Input
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneVerified(false);
                        setOtpSent(false);
                      }}
                      type="tel"
                      required
                      placeholder="10-digit mobile"
                      maxLength={10}
                      disabled={phoneVerified || loading}
                      className={phoneVerified ? "border-green-500 bg-green-50" : ""}
                    />
                    {!phoneVerified && (
                      <Button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={sendingOtp || phone.length !== 10}
                        variant="secondary"
                        size="sm"
                      >
                        {sendingOtp ? "..." : otpSent ? "Resend" : "Send OTP"}
                      </Button>
                    )}
                  </div>
                  {phoneVerified && <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Verified</p>}
                  
                  {otpSent && !phoneVerified && (
                    <div className="space-y-2 mt-2">
                      <div className="flex gap-2">
                        <Input
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="OTP"
                          maxLength={6}
                          className="w-24"
                        />
                        <Button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp} size="sm">
                          {verifyingOtp ? "..." : "Verify"}
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground animate-pulse">
                        * You will receive the OTP via a <b>voice call</b> shortly.
                      </p>
                    </div>
                  )}
                </div>

                {phoneVerified && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <Label htmlFor="reset-new-password">New Password</Label>
                    <div className="relative">
                      <Input id="reset-new-password" name="new_password" type={showPassword ? "text" : "password"} required minLength={6} placeholder="Enter new password" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}

                <Button type="submit" disabled={loading || !phoneVerified} className="w-full mt-auto">
                  {loading ? "Resetting..." : "Update Password"}
                </Button>
              </form>
            </div>
          )}
        </div>

        <Link to="/" className="mt-6 text-center text-sm text-muted-foreground hover:text-foreground">
          ← Back home
        </Link>
      </div>
    </div>
  );
}
