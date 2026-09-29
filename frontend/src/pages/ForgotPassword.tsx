import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { ANIMATION_CONFIG } from "@/lib/animations";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const navigate = useNavigate();

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      // The backend either sends the email or logs it to the terminal if DEV.
      if (res.message && res.message.includes("console")) {
        toast.success("Check the server console for the reset link! (DEV MODE)");
      } else {
        toast.success("Reset link sent to your inbox!");
      }
      setIsSent(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to send reset email";
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
          className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-2xl"
        >
          {!isSent ? (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Mail className="h-6 w-6" />
              </div>
              <h1 className="mb-2 text-center text-2xl font-bold text-foreground">Forgot Password?</h1>
              <p className="mb-6 text-center text-sm text-muted-foreground">
                Enter your email address to receive a secure password reset link.
              </p>
              <form onSubmit={handleForgotSubmit} className="space-y-5">
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter your registered email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading ? "Sending link..." : "Send Reset Link"}
                </motion.button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                <Mail className="h-6 w-6" />
              </div>
              <h1 className="mb-2 text-2xl font-bold text-foreground">Check your inbox</h1>
              <p className="text-sm text-muted-foreground">
                We've sent a secure password reset link to <strong>{email}</strong>. Please check your spam folder if it doesn't appear.
              </p>
            </div>
          )}

          <button
            onClick={() => navigate("/auth")}
            className="mt-6 flex w-full items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </button>
        </motion.div>
      </div>
    </PageTransition>
  );
}
