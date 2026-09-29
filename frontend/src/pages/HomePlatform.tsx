import { Link } from "react-router-dom";
import { motion, useInView, AnimatePresence } from "framer-motion";

import { ArrowRight, BookOpen, Brain, Compass, Map, MessageSquare, FileText, Trophy, Zap, Target, ChevronDown, Menu, X } from "lucide-react";

import PageTransition from "@/components/PageTransition";
import TypewriterText from "@/components/TypewriterText";
import { staggerContainer, staggerItem, ANIMATION_CONFIG } from "@/lib/animations";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { LayeredButton } from "@/components/LayeredButton";
import { VideoBackground } from "@/components/VideoBackground";


const features = [
  { icon: Brain, title: "AI Career Analysis", desc: "4-method quiz system powered by Google Gemini AI" },
  { icon: Target, title: "300+ Indian Careers", desc: "From NEET to JEE, UPSC to CA — every path covered" },
  { icon: Map, title: "Personalized Roadmaps", desc: "Step-by-step milestones with real Indian resources" },
  { icon: BookOpen, title: "Smart Flashcards", desc: "AI-generated study cards from any topic or PDF" },
  { icon: FileText, title: "Document Summarizer", desc: "Upload PDFs and get AI-powered summaries" },
  { icon: MessageSquare, title: "AI Career Mentor", desc: "Chat with an AI counselor about your career path" },
  { icon: Trophy, title: "Gamified Progress", desc: "Earn XP, level up, and unlock achievement badges" },
  { icon: Zap, title: "Resume Builder", desc: "AI generates your resume from completed tasks" },
  { icon: Target, title: "Indian Context", desc: "₹ Salaries, Indian colleges, entrance exams, companies" },
];

const steps = [
  { num: "01", title: "Discover Your Interests", desc: "Select interest cards, answer scenarios, rank priorities, and tell AI about your dreams." },
  { num: "02", title: "Get AI-Matched Careers", desc: "Our AI analyzes your profile across 300+ Indian careers and finds your best matches." },
  { num: "03", title: "Follow Your Roadmap", desc: "Get a personalized step-by-step roadmap with tasks, resources, and milestones." },
];

const categories = [
  "Technology", "Healthcare", "Government", "Finance", "Engineering", "Creative", "Legal", "Media"
];

const subtitleTexts = [
  "From NEET to JEE, UPSC to CA — AI builds your roadmap",
  "300+ Indian careers analyzed by Gemini AI",
  "Personalized for your city, board, and interests",
];

// Scroll-triggered section wrapper
function ScrollSection({ children, className, id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: ANIMATION_CONFIG.easeOut }}
      className={className}
      style={{ scrollMarginTop: "5rem" }}
    >
      {children}
    </motion.div>
  );
}

// Navbar with scroll-aware glassmorphism
function Navbar() {
  const [scrollY, setScrollY] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuth();


  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const borderOpacity = Math.min(scrollY / 80, 0.15);
  
  const navLinks = [
    { label: "Steps", href: "#process" },
    { label: "Features", href: "#features" },
    { label: "Categories", href: "#categories" },
  ];
  
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: ANIMATION_CONFIG.easeOut }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md transition-all duration-300"
      style={{ borderBottom: `1px solid hsl(var(--border) / ${scrollY > 20 ? 1 : 0})` }}
    >

      <div className="flex items-center justify-between px-6 py-[20px] md:px-[120px]">
        {/* Logo wordmark */}
        <motion.div whileHover={{ scale: 1.03 }}>
          <Link to="/" className="flex items-center" aria-label="Go to homepage">
            <div 
              className="text-foreground font-semibold text-lg flex items-center gap-2"
              style={{ height: '25px' }}
            >
              <Compass className="h-5 w-5 text-primary" />
              <span>Career Compass</span>
            </div>
          </Link>
        </motion.div>
        
        {/* Navigation links - hidden on mobile */}
        <div className="hidden md:flex items-center gap-[30px]">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="flex items-center gap-1.5 text-foreground/70 text-[14px] font-medium hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        
        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            {user ? (
              <LayeredButton variant="secondary" href="/roadmap">
                Dashboard
              </LayeredButton>
            ) : (
              <LayeredButton variant="secondary" href="/auth">
                Get Started
              </LayeredButton>
            )}
          </div>

          
          {/* Mobile menu toggle */}
          <button 
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-foreground md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-border bg-background md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-4 p-6">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="text-lg font-medium text-foreground/80 hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 border-t border-border">
                {user ? (
                  <LayeredButton variant="secondary" href="/roadmap" className="w-full">
                    Dashboard
                  </LayeredButton>
                ) : (
                  <LayeredButton variant="secondary" href="/auth" className="w-full">
                    Get Started
                  </LayeredButton>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>

  );
}

export default function Landing() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero */}
        <section className="relative min-h-screen flex items-center overflow-hidden">
          <VideoBackground 
            videoUrl="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4"
            overlayOpacity={0}
          />
          
          {/* Theme-aware Hero Overlay */}
          <div className="absolute inset-0 bg-background/40 dark:bg-black/60 backdrop-blur-[2px] z-10 transition-colors duration-500" />

          <div className="container relative mx-auto px-6 pt-[200px] md:pt-[280px] pb-[102px] text-center z-20 flex flex-col items-center">
            {/* Heading and Subtitle group with specific spacing */}
            <div className="flex flex-col items-center mt-[40px]">
              {/* Gradient Heading */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
                className="gradient-text mx-auto text-[36px] md:text-[56px] font-bold leading-[1.2] tracking-tight"
                style={{ maxWidth: '800px' }}
              >
                Career Guidance at the Speed of AI
              </motion.h1>

              {/* Typewriter subtitle - 24px below heading */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mx-auto text-foreground/80 dark:text-white/70 mt-[24px]"
                style={{ maxWidth: '680px', fontSize: '16px', fontWeight: 500 }}
              >
                <TypewriterText texts={subtitleTexts} speed={40} pauseTime={2500} />
              </motion.div>
            </div>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center mt-[40px]"
            >
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                <LayeredButton variant="primary" href="/auth">
                  <span className="flex items-center gap-2">
                    Start Career Discovery <ArrowRight className="h-4 w-4" />
                  </span>
                </LayeredButton>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                <LayeredButton variant="primary" href="#categories">
                  Explore All Careers
                </LayeredButton>
              </motion.div>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-6 text-sm text-text-secondary mt-[40px]"
            >
              {["300+ Indian careers", "Real entrance exam paths", "₹ Indian salary data", "Free to use"].map((t, i) => (
                <motion.span
                  key={t}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.2 + i * 0.1 }}
                  className="flex items-center gap-1.5"
                >
                  <span className="text-success">✓</span> {t}
                </motion.span>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <ScrollSection id="process" className="container mx-auto px-6 py-20">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">How It Works</h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid gap-6 md:grid-cols-3"
          >
            {steps.map((s) => (
              <motion.div
                key={s.num}
                variants={staggerItem}
                whileHover={{ y: -4, borderColor: "hsl(var(--primary) / 0.35)" }}
                transition={{ duration: ANIMATION_CONFIG.fast }}
                className="glass-card"
              >
                <span className="bearing-accent font-display text-3xl font-bold text-primary">{s.num}</span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-text-secondary">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </ScrollSection>

        {/* Features */}
        <ScrollSection id="features" className="container mx-auto px-6 py-20">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">What You Get</h2>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((f) => (
              <motion.div
                key={f.title}
                variants={staggerItem}
                whileHover={{ y: -3, scale: 1.02 }}
                transition={{ duration: ANIMATION_CONFIG.fast }}
                className="glass-card flex gap-4"
              >
                <f.icon className="h-6 w-6 shrink-0 text-primary" />
                <div>
                  <h3 className="font-semibold text-foreground">{f.title}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </ScrollSection>

        {/* Categories */}
        <ScrollSection id="categories" className="container mx-auto px-6 py-20">
          <h2 className="mb-8 text-center text-3xl font-bold text-foreground">Career Categories</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((cat, i) => (
              <motion.span
                key={cat}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                whileHover={{
                  scale: 1.08,
                  borderColor: "hsl(var(--primary))",
                  color: "hsl(var(--primary))",
                }}
                whileTap={{ scale: 0.95 }}
                className="rounded-pill border border-border px-5 py-2 text-sm text-text-secondary cursor-default"
              >
                {cat}
              </motion.span>
            ))}
          </div>
        </ScrollSection>

        {/* Footer */}
        <footer className="border-t border-border py-8">
          <div className="container mx-auto px-6 text-center text-sm text-text-muted">
            © 2026 AI Career Compass. Built for Indian students.
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
