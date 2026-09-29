import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  delay: number;
  angle: number;
  distance: number;
}

export function SparkleEffect({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;
    const count = 8;
    const newParticles: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      size: 3 + Math.random() * 4,
      delay: Math.random() * 0.1,
      angle: (360 / count) * i + Math.random() * 30,
      distance: 16 + Math.random() * 20,
    }));
    setParticles(newParticles);
    const t = setTimeout(() => setParticles([]), 700);
    return () => clearTimeout(t);
  }, [trigger]);

  return (
    <AnimatePresence>
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <motion.span
            key={p.id}
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            animate={{ opacity: 0, scale: 0, x: tx, y: ty }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: p.delay, ease: [0, 0, 0.2, 1] }}
            className="pointer-events-none absolute rounded-full bg-primary"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              boxShadow: "0 0 4px hsl(var(--primary) / 0.6)",
            }}
          />
        );
      })}
    </AnimatePresence>
  );
}

export default SparkleEffect;
