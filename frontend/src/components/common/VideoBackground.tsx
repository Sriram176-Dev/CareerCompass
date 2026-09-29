import { useState, useEffect } from "react";

interface VideoBackgroundProps {
  videoUrl: string;
  overlayOpacity?: number; // 0-1, default 0.5
  fallbackColor?: string; // default "#000"
}

export function VideoBackground({
  videoUrl,
  overlayOpacity = 0.5,
  fallbackColor = "#000",
}: VideoBackgroundProps) {
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const handleVideoError = () => {
    setVideoError(true);
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden" style={{ backgroundColor: fallbackColor }}>
      {!videoError && !prefersReducedMotion && (
        <video
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 pointer-events-none ${
            isVideoLoaded ? "opacity-100" : "opacity-0"
          }`}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedData={() => setIsVideoLoaded(true)}
          onError={handleVideoError}
          src={videoUrl}
        />
      )}
      
      {/* Dynamic Overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{ 
          backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
          backdropFilter: isVideoLoaded ? "none" : "blur(4px)" 
        }}
      />
    </div>
  );
}

export default VideoBackground;
