import { useRef, useState } from "react";
import { motion } from "framer-motion";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";

interface TopCareer {
  id: string;
  title: string;
  icon: string;
  cat: string;
  matchScore: number;
}

interface ShareResultsCardProps {
  topCareer: TopCareer;
  matchPercentage: number;
  userName: string;
}

export default function ShareResultsCard({ topCareer, matchPercentage, userName }: ShareResultsCardProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const generateShareCard = async () => {
    if (!canvasRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(canvasRef.current, {
        backgroundColor: "#0a0a0a",
        scale: 2,
      });
      const imageUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `my-career-match-${topCareer.title.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = imageUrl;
      link.click();
      toast.success("Share card downloaded! 📤");
    } catch {
      toast.error("Failed to generate share card");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {/* Hidden card that gets captured */}
      <div
        ref={canvasRef}
        style={{
          width: 600,
          height: 320,
          background: "linear-gradient(135deg, #12141A 0%, #1D2130 100%)",
          border: "1px solid #2A2F42",
          borderRadius: 20,
          padding: 40,
          position: "absolute",
          left: -9999,
          top: -9999,
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        }}
      >
        <div style={{ fontSize: 13, color: "#9498AC", marginBottom: 24 }}>
          AI Career Compass • Made for India 🇮🇳
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ fontSize: 64 }}>{topCareer.icon}</div>
          <div>
            <p style={{ color: "#9498AC", fontSize: 14 }}>{userName}'s #1 Career Match</p>
            <h2 style={{ color: "#F3F4F7", fontSize: 28, fontWeight: 700, margin: "4px 0", fontFamily: "'Space Grotesk', sans-serif" }}>
              {topCareer.title}
            </h2>
            <div
              style={{
                color: "#F2A23B",
                fontSize: 22,
                fontWeight: 700,
                marginTop: 4,
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              {matchPercentage}% Match
            </div>
          </div>
        </div>
        <div style={{ marginTop: 24, color: "#9498AC", fontSize: 13 }}>
          Salary: {topCareer.salaryRange} • {topCareer.topColleges?.[0] || topCareer.cat}
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
          {topCareer.skills?.slice(0, 4).map((s: string) => (
            <span
              key={s}
              style={{
                background: "rgba(242,162,59,0.12)",
                border: "1px solid rgba(242,162,59,0.25)",
                borderRadius: 20,
                padding: "2px 10px",
                fontSize: 11,
                color: "#F2A23B",
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Share button */}
      <motion.button
        onClick={generateShareCard}
        disabled={exporting}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="btn-outline flex items-center gap-2 text-sm disabled:opacity-50"
      >
        📤 {exporting ? "Generating..." : "Share My Result"}
      </motion.button>
    </>
  );
}
