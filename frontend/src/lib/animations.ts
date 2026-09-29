// ============================================
// GLOBAL ANIMATION CONSTANTS
// ============================================

export const ANIMATION_CONFIG = {
  // Timing (seconds)
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,

  // Easing
  ease: [0.4, 0, 0.2, 1] as const,
  easeOut: [0, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  spring: { type: 'spring' as const, stiffness: 300, damping: 30 },
  springBouncy: { type: 'spring' as const, stiffness: 400, damping: 20 },
  springGentle: { type: 'spring' as const, stiffness: 200, damping: 40 },

  // Stagger
  staggerFast: 0.04,
  staggerNormal: 0.07,
  staggerSlow: 0.1,
};

// ============================================
// PAGE TRANSITION VARIANTS
// ============================================
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 16,
    filter: 'blur(4px)',
  },
  animate: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.35,
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
      staggerChildren: 0.07,
      when: 'beforeChildren' as const,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    filter: 'blur(2px)',
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
  },
};

// ============================================
// REUSABLE VARIANTS
// ============================================

export const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * ANIMATION_CONFIG.staggerNormal, duration: 0.5, ease: ANIMATION_CONFIG.easeOut },
  }),
};

export const staggerContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: ANIMATION_CONFIG.staggerNormal },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: ANIMATION_CONFIG.normal, ease: ANIMATION_CONFIG.easeOut },
  },
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: ANIMATION_CONFIG.normal, ease: ANIMATION_CONFIG.easeOut },
  },
};

export const slideInDirection = (direction: 1 | -1) => ({
  enter: { x: direction * 60, opacity: 0, scale: 0.98 },
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
  exit: { x: direction * -60, opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
});

// Card interaction helpers
export const cardHover = {
  scale: 1.03,
  y: -2,
  transition: { duration: ANIMATION_CONFIG.fast, ease: ANIMATION_CONFIG.ease },
};

export const cardTap = { scale: 0.97 };
