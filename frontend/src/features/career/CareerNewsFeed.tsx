import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Newspaper } from "lucide-react";
import { aiApi } from "@/services/api";
import toast from "react-hot-toast";

interface Article {
  headline: string;
  source: string;
  category: string;
  sentiment: "positive" | "neutral" | "negative";
  summary: string;
  date: string;
}

export default function CareerNewsFeed({ career }: { career: string | { title?: string } }) {
  const [news, setNews] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const data = await aiApi.careerTools("career-news", { career: career?.title || career });
      // Map trends to article format
      const articles = (data.trends || []).map((t: { title?: string; headline?: string; source?: string; category?: string; impact?: string; description?: string; summary?: string }) => ({
        headline: t.title || t.headline || "Industry Update",
        source: t.source || "Industry Intelligence",
        category: t.category || "Trend",
        sentiment: (t.impact === "high" ? "positive" : "neutral") as "positive" | "neutral" | "negative",
        summary: t.description || t.summary || "",
        date: new Date().toLocaleDateString("en-IN"),
      }));
      setNews(articles);
    } catch {
      toast.error("Failed to fetch news");
    } finally {
      setLoading(false);
    }
  };

  const sentimentColor: Record<string, string> = {
    positive: "bg-success",
    neutral: "bg-muted-foreground",
    negative: "bg-destructive",
  };

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-primary" /> {career.title} News
        </h3>
        <button onClick={fetchNews} disabled={loading}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Loading..." : news.length ? "Refresh" : "Load News"}
        </button>
      </div>

      {news.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-6">Click "Load News" to see AI-generated career news</p>
      )}

      <AnimatePresence>
        {news.map((article, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07 }}
            className={`py-3 ${i < news.length - 1 ? "border-b border-border" : ""}`}>
            <div className="flex gap-3 items-start">
              <div className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${sentimentColor[article.sentiment] || "bg-muted-foreground"}`} />
              <div>
                <p className="text-sm font-semibold text-foreground leading-snug">{article.headline}</p>
                <p className="text-xs text-muted-foreground mt-1">{article.summary}</p>
                <div className="flex gap-3 mt-1.5">
                  <span className="text-[10px] text-muted-foreground/60">{article.source}</span>
                  <span className="text-[10px] text-muted-foreground/60">•</span>
                  <span className="text-[10px] text-muted-foreground/60">{article.date}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{article.category}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
