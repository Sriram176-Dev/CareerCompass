import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { ANIMATION_CONFIG } from "@/lib/animations";
import { Compass, Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import authFemale from "@/assets/auth-illustration.png";
import authMale from "@/assets/auth-illustration-male.png";

interface Profile {
  selected_career_id?: string;
  onboarding_complete?: boolean;
}

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get("tab") !== "signup");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", userType: "school_student" });


  const navigate = useNavigate();


  const { profile: currentProfile, loading: authLoading, signIn, signUp } = useAuth();

  const redirectUser = useCallback((p: Profile) => {
    if (p?.selected_career_id) navigate("/roadmap", { replace: true });
    else if (p?.onboarding_complete) navigate("/quiz", { replace: true });
    else navigate("/onboarding", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (currentProfile) redirectUser(currentProfile);
  }, [currentProfile, redirectUser]);

  const userTypes = [
    { value: "school_student", label: "🎒 School Student", desc: "Class 8-12" },
    { value: "college_student", label: "🎓 College Student", desc: "UG / PG" },
    { value: "self_learning", label: "📚 Self-Learner", desc: "Independent" },
    { value: "working", label: "💼 Professional", desc: "Career switch" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        await signIn(form.email, form.password);
        // redirect handled by useEffect watching currentProfile
      } else {
        if (form.password !== form.confirmPassword) {
          toast.error("Passwords don't match");
          setLoading(false);
          return;
        }
        if (form.password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setLoading(false);
          return;
        }
        await signUp(form.email, form.password, form.name, form.userType);
        await signIn(form.email, form.password);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Show spinner while auth state loads to prevent form flash for logged-in users
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const inputClass =
    "w-full rounded-xl border border-border bg-background pl-11 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

  return (
    <PageTransition>
      <div className="flex min-h-[100dvh] bg-background">
        {/* ── Left: Form ── */}
        <div className="relative flex w-full flex-col items-center px-4 py-6 sm:px-8 md:w-[52%] md:px-10 lg:px-12 xl:px-20 overflow-y-auto">
          {/* Top bar */}
          <div className="flex w-full max-w-[400px] items-center justify-between mb-8 pt-1">
            <motion.button
              whileHover={{ x: -3 }}
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Home
            </motion.button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: ANIMATION_CONFIG.easeOut }}
            className="w-full max-w-[400px] pb-8"
          >
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 }}
              className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"
            >
              <Compass className="h-6 w-6" />
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center text-2xl font-bold text-foreground sm:text-3xl"
            >
              {isLogin ? "Login" : "Sign Up"}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="mt-2 text-center text-sm text-muted-foreground"
            >
              {isLogin
                ? "Welcome back! Enter your credentials"
                : "Create your account to get started"}
            </motion.p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-7 space-y-3.5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={isLogin ? "login" : "signup"}
                  initial={{ opacity: 0, x: isLogin ? -16 : 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: isLogin ? 16 : -16 }}
                  transition={{ duration: 0.22, ease: ANIMATION_CONFIG.ease }}
                  className="space-y-3.5"
                >
                  {!isLogin && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input 
                        type="text" 
                        placeholder="Full Name" 
                        id="register-name"
                        aria-label="Full Name"
                        required 
                        value={form.name}
                        onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} 
                        className={inputClass} 
                      />
                    </motion.div>
                  )}

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }} className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="email" 
                      placeholder="Email address" 
                      id={isLogin ? "login-email" : "register-email"}
                      aria-label="Email address"
                      required 
                      value={form.email}
                      onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} 
                      className={inputClass} 
                    />
                  </motion.div>

                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Password" 
                      id={isLogin ? "login-password" : "register-password"}
                      aria-label="Password (min 8 characters)"
                      required 
                      minLength={8}
                      value={form.password} 
                      onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                      className={`${inputClass} !pr-10`} 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </motion.div>

                  {!isLogin && (
                    <>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="relative">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          placeholder="Confirm Password" 
                          id="register-confirm-password"
                          aria-label="Confirm Password"
                          required 
                          minLength={8}
                          value={form.confirmPassword} 
                          onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                          className={`${inputClass} !pr-10`} 
                        />
                        <button 
                          type="button" 
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </motion.div>


                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}>
                        <p className="mb-2 text-xs font-medium text-muted-foreground">I am a...</p>
                        <div className="grid grid-cols-2 gap-2">
                          {userTypes.map((t) => (
                            <button type="button" key={t.value}
                              onClick={() => setForm(f => ({ ...f, userType: t.value }))}
                              className={`rounded-xl border p-2.5 text-left transition-all duration-200 ${
                                form.userType === t.value
                                  ? "border-primary bg-primary/10 ring-1 ring-primary/20"
                                  : "border-border hover:border-border-hover"
                              }`}
                            >
                              <span className="block text-xs font-semibold text-foreground">{t.label}</span>
                              <span className="block text-[10px] text-muted-foreground">{t.desc}</span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {isLogin && (
                <div className="flex flex-col gap-2">
                  <div className="flex justify-end">
                    <button type="button" onClick={() => navigate("/forgot-password")}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors">
                      Forgot Password?
                    </button>
                  </div>
                </div>
              )}

              {/* Submit */}
              <motion.button
                type="submit" disabled={loading}
                whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 transition-all disabled:opacity-50 hover:brightness-110"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <motion.span className="inline-block h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                      animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }} />
                    Please wait...
                  </span>
                ) : (
                  <>
                    {isLogin ? "Login" : "Create Account"}
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-muted-foreground font-medium">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Divider note */}
            <p className="text-center text-xs text-muted-foreground">
              Secured with JWT authentication
            </p>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-primary hover:underline">
                {isLogin ? "Sign Up" : "Login"}
              </button>
            </p>
          </motion.div>
        </div>

        {/* ── Right: Illustration panel ── */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: ANIMATION_CONFIG.easeOut }}
          className="hidden md:flex md:w-[48%] relative overflow-hidden"
          style={{ 
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.9) 0%, hsl(var(--accent) / 0.9) 100%)" 
          }}
        >
          {/* Decorative orbits */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 800 800">
            <ellipse cx="400" cy="400" rx="280" ry="180" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="10 6"
              className="text-white" transform="rotate(-15 400 400)">
              <animateTransform attributeName="transform" type="rotate" from="-15 400 400" to="345 400 400" dur="40s" repeatCount="indefinite" />
            </ellipse>
            <ellipse cx="400" cy="400" rx="350" ry="220" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 8"
              className="text-white" transform="rotate(10 400 400)">
              <animateTransform attributeName="transform" type="rotate" from="10 400 400" to="-350 400 400" dur="55s" repeatCount="indefinite" />
            </ellipse>
          </svg>

          {/* Floating small books decoration */}
          <motion.div
            className="absolute top-[12%] right-[15%] text-4xl"
            animate={{ y: [0, -12, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            📚
          </motion.div>
          <motion.div
            className="absolute bottom-[18%] left-[10%] text-3xl"
            animate={{ y: [0, -8, 0], rotate: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          >
            🎓
          </motion.div>
          <motion.div
            className="absolute top-[65%] right-[8%] text-2xl"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
          >
            💡
          </motion.div>

          <div className="relative z-10 flex flex-col items-center justify-center w-full px-8 xl:px-14">
            {/* Characters */}
            <div className="relative flex items-end justify-center gap-0 mb-8">
              <motion.img
                src={authFemale}
                alt="Female student reading books"
                className="h-52 w-52 object-contain drop-shadow-2xl xl:h-64 xl:w-64"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.img
                src={authMale}
                alt="Male student with laptop"
                className="h-48 w-48 object-contain drop-shadow-2xl xl:h-60 xl:w-60 -ml-6"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
              />
            </div>

            {/* Text */}
            <motion.h2
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl font-bold text-white text-center xl:text-3xl"
            >
              Discover Your Dream Career
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-3 max-w-sm text-center text-sm text-white/75 leading-relaxed"
            >
              AI-powered career guidance tailored for Indian students. Explore 50+ paths, get roadmaps, and ace your prep.
            </motion.p>

            {/* Feature pills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-6 flex flex-wrap justify-center gap-2"
            >
              {["AI Analysis", "50+ Careers", "Smart Roadmaps", "Interview Prep"].map((tag, i) => (
                <motion.span
                  key={tag}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  className="rounded-full bg-white/20 backdrop-blur-sm border border-white/30 px-3.5 py-1.5 text-xs font-medium text-white shadow-soft"
                >
                  {tag}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </motion.div>


      </div>
    </PageTransition>
  );
}
