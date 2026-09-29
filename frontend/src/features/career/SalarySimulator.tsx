import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { aiApi } from "@/services/api";
import toast from "react-hot-toast";

interface Message {
  role: "user" | "hr";
  message: string;
}

export default function SalarySimulator({ career }: { career: string | { title?: string; topCompanies?: string[] } }) {
  const [stage, setStage] = useState<"start" | "negotiating">("start");
  const [conversation, setConversation] = useState<Message[]>([]);
  const [userResponse, setUserResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const startSimulation = async () => {
    setLoading(true);
    try {
      const data = await aiApi.careerTools("salary-insights", { career: career?.title || career, experience: "0-2 years", city: "Bangalore" });
      const startMsg = `Hello! I'm from HR at ${(career?.topCompanies || ["our company"])[0]}. We'd like to offer you a package of ₹${data?.salaryRanges?.fresher?.median || 6} LPA. What are your thoughts?`;
      setConversation([{ role: "hr", message: startMsg }]);
      setStage("negotiating");
    } catch {
      toast.error("Failed to start simulation");
    } finally {
      setLoading(false);
    }
  };

  const respondToHR = async () => {
    if (!userResponse.trim()) return;
    const newConv = [...conversation, { role: "user" as const, message: userResponse }];
    setConversation(newConv);
    setUserResponse("");
    setLoading(true);
    try {
      const data = await aiApi.careerTools("salary-insights", { career: career?.title || career, experience: "fresher", city: "Bangalore" });
      const hrReply = `That's a valid point. Given your skills, we could consider ₹${(data?.salaryRanges?.fresher?.max || 8)} LPA with a performance review after 6 months. Does that work for you?`;
      setConversation(prev => [...prev, { role: "hr", message: hrReply }]);
    } catch {
      toast.error("HR is unavailable right now");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <h3 className="font-semibold text-foreground mb-1">💰 Salary Negotiation Practice</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Practice negotiating your salary with a simulated HR at {(career?.topCompanies || ["a top company"])[0]}
      </p>

      {stage === "start" ? (
        <button onClick={startSimulation} disabled={loading} className="btn-primary text-sm disabled:opacity-50">
          {loading ? "Starting..." : "Start Mock Negotiation"}
        </button>
      ) : (
        <>
          <div className="max-h-[300px] overflow-y-auto space-y-3 mb-4 scrollbar-hide">
            <AnimatePresence>
              {conversation.map((msg, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}>
                    {msg.message}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-xl px-4 py-2.5 text-sm text-muted-foreground">
                  <span className="animate-pulse">HR is typing...</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={userResponse}
              onChange={e => setUserResponse(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !loading && respondToHR()}
              placeholder="Type your response to HR..."
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button onClick={respondToHR} disabled={loading || !userResponse.trim()} className="btn-primary text-sm px-4 disabled:opacity-50">
              Send
            </button>
          </div>
        </>
      )}
    </div>
  );
}
