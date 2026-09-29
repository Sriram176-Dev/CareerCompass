import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { ANIMATION_CONFIG } from "@/lib/animations";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const resetToken = searchParams.get("token") || "";

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) { toast.error("Passwords don't match"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (!resetToken) { toast.error("Invalid or missing reset token"); return; }

    setLoading(true);
    try {
      await authApi.resetPassword(resetToken, password);
      toast.success("Password updated successfully! 🎉");
      navigate("/auth");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to reset password";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: ANIMATION_CONFIG.easeOut }}
          className="w-full max-w-md rounded-xl border border-border bg-card p-8"
        >
          <h1 className="mb-2 text-center text-2xl font-bold text-foreground">Reset Password</h1>
          <p className="mb-6 text-center text-sm text-muted-foreground">Enter your new password below.</p>
          <form onSubmit={handleReset} className="space-y-4">
            <input type="password" placeholder="New Password" required minLength={6}
              value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <input type="password" placeholder="Confirm New Password" required minLength={6}
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30" />
            <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="btn-primary w-full disabled:opacity-50">
              {loading ? "Updating..." : "Set New Password"}
            </motion.button>
          </form>
          <button onClick={() => navigate("/auth")}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Login
          </button>
        </motion.div>
      </div>
    </PageTransition>
  );
}
