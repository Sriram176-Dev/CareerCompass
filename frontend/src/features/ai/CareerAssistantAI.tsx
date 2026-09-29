import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Send, Bot, User, Sparkles, History, Plus, Trash2, ChevronDown, Download, Mic, MicOff, Bookmark, BookmarkCheck, Copy, Check } from "lucide-react";
import jsPDF from "jspdf";
import { useAuth } from "@/hooks/useAuth";
import { aiApi, profileApi } from "@/services/api";
import toast from "react-hot-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
  suggestions?: string[];
}

const parseSuggestions = (text: string): { content: string; suggestions: string[] } => {
  const lines = text.split("\n");
  const suggestions: string[] = [];
  const contentLines: string[] = [];
  for (const line of lines) {
    if (line.trim().startsWith(">>>")) {
      const q = line.trim().slice(3).trim();
      if (q) suggestions.push(q);
    } else {
      contentLines.push(line);
    }
  }
  return { content: contentLines.join("\n").trimEnd(), suggestions };
};

interface ChatSession {
  id: string;
  messages: Message[];
  created_at: string;
  preview: string;
}

export default function AIChatbot() {
  const { profile, addXp, updateProfile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkedMessages, setBookmarkedMessages] = useState<Message[]>([]);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition || (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN";
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
          .map((r: SpeechRecognitionResult) => r[0].transcript)
          .join("");
        setInput(transcript);
        // Haptic feedback on each result
        if (navigator.vibrate) navigator.vibrate(30);
        // Play subtle tick sound
        try {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = 800;
          gain.gain.value = 0.05;
          osc.start();
          osc.stop(ctx.currentTime + 0.03);
        } catch {
          // Audio context not supported or error occurred
        }
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => { setIsListening(false); toast.error("Voice input failed"); };
      recognitionRef.current = recognition;
    }
    return () => recognitionRef.current?.abort();
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) { toast.error("Voice input not supported in this browser"); return; }
    if (isListening) { recognitionRef.current.stop(); } else { recognitionRef.current.start(); setIsListening(true); }
  };

  const welcomeMessage: Message = useMemo(() => ({
    role: "assistant",
    content: `## 👋 Hey${profile?.name ? ` ${profile.name}` : ""}! I'm **Compass AI**

Your personal career counselor for the Indian market. I can help you with:

- 🎯 **Career guidance** tailored to your goals
- 📚 **Exam preparation** strategies (JEE, NEET, UPSC, etc.)
- 💰 **Salary insights** for Indian job market
- 🏫 **College recommendations** across India
- 🗺️ **Career roadmaps** with actionable steps

${profile?.selected_career ? `I see you're interested in **${(profile.selected_career as { title?: string })?.title}** — let's explore that path together!` : "Tell me about your career interests and I'll guide you!"}

*Ask me anything to get started!*`,
    timestamp: new Date().toISOString(),
  }), [profile?.name, profile?.selected_career]);

  const loadChatHistory = useCallback(async () => {
    if (!profile) return;
    const sessions = profile.chat_sessions || [];
    setChatSessions(sessions.map((s: { id: string; messages?: Message[]; created_at?: string; preview?: string }) => ({
      id: s.id,
      messages: (s.messages || []) as Message[],
      created_at: s.created_at || "",
      preview: s.preview || (s.messages || []).find((m: Message) => m.role === "user")?.content?.slice(0, 60) || "New conversation",
    })));
  }, [profile]);

  // Load bookmarks from profile context
  useEffect(() => {
    if (profile?.bookmarked_messages) {
      setBookmarkedMessages(profile.bookmarked_messages);
    }
  }, [profile?.bookmarked_messages]);

  const isBookmarked = (msg: Message) =>
    bookmarkedMessages.some((b) => b.content === msg.content && b.timestamp === msg.timestamp);

  const toggleBookmark = (msg: Message) => {
    const exists = bookmarkedMessages.some((b) => b.content === msg.content && b.timestamp === msg.timestamp);
    const updated = exists
      ? bookmarkedMessages.filter((b) => !(b.content === msg.content && b.timestamp === msg.timestamp))
      : [...bookmarkedMessages, msg];
    
    setBookmarkedMessages(updated);
    updateProfile({ bookmarked_messages: updated });
    toast.success(exists ? "Bookmark removed" : "Message bookmarked! 📌");
  };

  const removeBookmark = (msg: Message) => {
    const updated = bookmarkedMessages.filter((b) => !(b.content === msg.content && b.timestamp === msg.timestamp));
    setBookmarkedMessages(updated);
    updateProfile({ bookmarked_messages: updated });
    toast.success("Bookmark removed");
  };

  useEffect(() => {
    setMessages([welcomeMessage]);
    if (profile) loadChatHistory();
  }, [profile, loadChatHistory, welcomeMessage]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const quickPrompts = [
    { icon: "🎯", text: "Best career for me?" },
    { icon: "📝", text: "Exam preparation tips" },
    { icon: "💰", text: "Salary after 5 years?" },
    { icon: "🏫", text: "Top colleges to target" },
    { icon: "🚀", text: "Skills in demand 2026" },
    { icon: "📊", text: "Career growth outlook" },
  ];

  const sendMessage = async (content: string) => {
    if (!content.trim() || isStreaming) return;
    const userMsg: Message = { role: "user", content: content.trim(), timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);

    // Auto-resize textarea back
    if (inputRef.current) inputRef.current.style.height = "44px";

    // Counselor Memory: give the AI real continuity — roadmap pace, streak,
    // recent weak spots, and a one-line recall of the last other conversation
    // — instead of treating every chat like the first one.
    const totalRoadmapTasks = ((profile?.roadmap_data as { milestones?: Array<{ tasks?: Array<unknown> }> })?.milestones || [])
      .reduce((sum: number, m: { tasks?: Array<unknown> }) => sum + (m.tasks?.length || 0), 0);
    const completedCount = (profile?.completed_tasks as string[] || []).length;
    const roadmapProgressPct = totalRoadmapTasks > 0 ? Math.round((completedCount / totalRoadmapTasks) * 100) : null;

    const recentAttempts = ((profile?.quiz_attempts as Array<{ category: string; score: number; total: number }>) || []).slice(-8);
    const categoryStats: Record<string, { correct: number; total: number }> = {};
    recentAttempts.forEach((a) => {
      const c = categoryStats[a.category] || { correct: 0, total: 0 };
      c.correct += a.score; c.total += a.total;
      categoryStats[a.category] = c;
    });
    const weakCategories = Object.entries(categoryStats)
      .filter(([, s]) => s.total > 0 && s.correct / s.total < 0.6)
      .map(([cat]) => cat);

    const otherSessions = (profile?.chat_sessions as Array<{ id: string; preview?: string }> || []).filter((s) => s.id !== currentSessionId);
    const lastSessionPreview = otherSessions.length ? otherSessions[otherSessions.length - 1]?.preview : undefined;

    try {
      const resp = await aiApi.chatStream(
        newMessages
          .filter((m) => m.content !== welcomeMessage.content)
          .map((m) => ({ role: m.role, content: m.content })),
        profile ? {
          name: profile.name,
          career: (profile.selected_career as { title?: string })?.title,
          level: profile.level,
          xp: profile.xp,
          completedTasks: (profile.completed_tasks as string[] || []).length,
          cityTier: profile.city_tier,
          userType: profile.user_type,
          streak: profile.streak,
          roadmapProgressPct,
          weakCategories,
          lastSessionPreview,
        } : undefined
      );

      if (!resp.ok) {
        if (resp.status === 429) { toast.error("AI is busy, try again shortly"); setIsStreaming(false); return; }
        if (resp.status === 402) { toast.error("Usage limit reached"); setIsStreaming(false); return; }
        throw new Error("Chat failed");
      }

      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.text ?? parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && prev.length === newMessages.length + 1) {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantContent } : m));
                }
                return [...prev, { role: "assistant", content: assistantContent, timestamp: new Date().toISOString() }];
              });
            }
          } catch {
            // Error reading stream chunk
          }
        }
      }

      await addXp(2, "AI Chat");

      // Parse suggestions from the final response
      const { content: cleanContent, suggestions } = parseSuggestions(assistantContent);
      const finalAssistantMsg: Message = { role: "assistant", content: cleanContent, timestamp: new Date().toISOString(), suggestions };
      
      // Update last message with parsed content
      setMessages(prev => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        if (updated[lastIdx]?.role === "assistant") {
          updated[lastIdx] = finalAssistantMsg;
        }
        return updated;
      });

      // Save session
      if (profile) {
        const sessionId = currentSessionId || crypto.randomUUID();
        const allMsgs = [...newMessages, finalAssistantMsg];
        const firstUserMsg = allMsgs.find((m) => m.role === "user");
        const session = {
          id: sessionId,
          messages: allMsgs,
          created_at: new Date().toISOString(),
          preview: firstUserMsg?.content?.slice(0, 60) || "New conversation",
        };
        await profileApi.saveChatSession(session).catch(() => null);
        setCurrentSessionId(sessionId);
        // Update local state directly — avoids re-fetching entire profile
        setChatSessions(prev => {
          const idx = prev.findIndex(s => s.id === sessionId);
          if (idx >= 0) {
            const updated = [...prev];
            updated[idx] = session;
            return updated;
          }
          return [session, ...prev].slice(0, 20);
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that. Please try again! 🔄", timestamp: new Date().toISOString() },
      ]);
    } finally {
      setIsStreaming(false);
    }
  };

  const loadSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setShowHistory(false);
  };

  const startNewChat = () => {
    setMessages([welcomeMessage]);
    setCurrentSessionId(null);
    setShowHistory(false);
  };

  const deleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    await profileApi.deleteChatSession(sessionId).catch(() => null);
    setChatSessions((prev) => prev.filter((s) => s.id !== sessionId));
    if (currentSessionId === sessionId) startNewChat();
    toast.success("Chat deleted");
  };

  const exportToPDF = () => {
    if (messages.length <= 1) { toast.error("No conversation to export"); return; }
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const maxWidth = pageWidth - margin * 2;
    let y = 20;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Compass AI - Chat Export", margin, y);
    y += 8;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120);
    doc.text(`Exported on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, margin, y);
    y += 10;
    doc.setDrawColor(200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    for (const msg of messages) {
      if (msg.content === messages[0]?.content && msg.role === "assistant") continue;
      doc.setTextColor(msg.role === "user" ? 37 : 100);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      const label = msg.role === "user" ? (profile?.name || "You") : "Compass AI";
      doc.text(label, margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30);
      const cleanText = msg.content.replace(/[#*_`~]/g, "").replace(/\n{3,}/g, "\n\n");
      const lines = doc.splitTextToSize(cleanText, maxWidth);
      for (const line of lines) {
        if (y > 275) { doc.addPage(); y = 20; }
        doc.text(line, margin, y);
        y += 5;
      }
      y += 6;
    }

    doc.save(`compass-ai-chat-${Date.now()}.pdf`);
    toast.success("Chat exported as PDF! 📄");
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "44px";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="flex h-full flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Compass AI</h2>
            <p className="text-[11px] text-muted-foreground">
              {isStreaming ? (
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                  Typing...
                </span>
              ) : "Career counselor • Always ready"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={exportToPDF}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Export as PDF"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => { setShowBookmarks(!showBookmarks); setShowHistory(false); }}
            className={`relative rounded-lg p-2 transition-colors hover:bg-muted hover:text-foreground ${showBookmarks ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
            title="Bookmarked messages"
          >
            <Bookmark className="h-4 w-4" />
            {bookmarkedMessages.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground font-bold">
                {bookmarkedMessages.length}
              </span>
            )}
          </button>
          <button
            onClick={() => { setShowHistory(!showHistory); setShowBookmarks(false); }}
            className={`rounded-lg p-2 transition-colors hover:bg-muted hover:text-foreground ${showHistory ? "text-primary bg-primary/10" : "text-muted-foreground"}`}
            title="Chat history"
          >
            <History className="h-4 w-4" />
          </button>
          <button
            onClick={startNewChat}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="New chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* History Sidebar */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute right-0 top-[53px] bottom-0 z-20 w-72 border-l border-border bg-background shadow-xl overflow-y-auto"
          >
            <div className="p-3 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Chat History</h3>
            </div>
            {chatSessions.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground text-center">No previous chats</p>
            ) : (
              <div className="p-2 space-y-1">
                {chatSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => loadSession(session)}
                    className={`group flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted ${
                      currentSessionId === session.id ? "bg-primary/10 text-primary" : "text-foreground"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{session.preview}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {new Date(session.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      className="ml-2 opacity-0 group-hover:opacity-100 rounded p-1 text-destructive hover:bg-destructive/10 transition-all"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bookmarks Panel */}
      <AnimatePresence>
        {showBookmarks && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute right-0 top-[53px] bottom-0 z-20 w-72 border-l border-border bg-background shadow-xl overflow-y-auto"
          >
            <div className="p-3 border-b border-border">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">📌 Bookmarked Messages</h3>
            </div>
            {bookmarkedMessages.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground text-center">No bookmarked messages yet.<br />Click the bookmark icon on any message to save it.</p>
            ) : (
              <div className="p-2 space-y-2">
                {bookmarkedMessages.map((msg, i) => (
                  <div key={i} className="group rounded-lg border border-border p-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${msg.role === "user" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>
                        {msg.role === "user" ? "You" : "AI"}
                      </span>
                      <button
                        onClick={() => removeBookmark(msg)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-0.5 text-destructive hover:bg-destructive/10 transition-all"
                        title="Remove bookmark"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="mt-1.5 text-muted-foreground line-clamp-4 leading-relaxed">{msg.content.replace(/[#*_`~]/g, "").slice(0, 200)}</p>
                    {msg.timestamp && (
                      <p className="mt-1 text-[10px] text-muted-foreground/60">
                        {new Date(msg.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
      >
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-accent/10 text-accent"
              }`}
            >
              {msg.role === "user" ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            </div>
            <div className="group/msg relative max-w-[85%]">
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-md"
                    : "bg-card border border-border text-foreground rounded-tl-md"
                }`}
              >
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-headings:my-2 prose-h2:text-base prose-h3:text-sm prose-code:text-xs prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-strong:text-foreground">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
              {/* Action buttons */}
              {i > 0 && !isStreaming && (
                <div className={`absolute -top-2 ${msg.role === "user" ? "-left-2" : "-right-2"} flex gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-all`}>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(msg.content);
                      setCopiedIdx(i);
                      setTimeout(() => setCopiedIdx(null), 1500);
                      toast.success("Copied to clipboard!");
                    }}
                    className="rounded-full p-1 shadow-sm border bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                    title="Copy message"
                  >
                    {copiedIdx === i ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => toggleBookmark(msg)}
                    className={`rounded-full p-1 shadow-sm border transition-all ${
                      isBookmarked(msg)
                        ? "bg-primary/20 border-primary/30 text-primary"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                    }`}
                    title={isBookmarked(msg) ? "Remove bookmark" : "Bookmark this message"}
                  >
                    {isBookmarked(msg) ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                  </button>
                </div>
              )}
            </div>
            {/* Follow-up suggestions */}
            {msg.role === "assistant" && msg.suggestions && msg.suggestions.length > 0 && i === messages.length - 1 && !isStreaming && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]"
              >
                {msg.suggestions.map((s, si) => (
                  <button
                    key={si}
                    onClick={() => sendMessage(s)}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-[11px] text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground hover:bg-primary/5"
                  >
                    {s}
                  </button>
                ))}
              </motion.div>
            )}
          </motion.div>
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
                <span className="h-2 w-2 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-32 left-1/2 -translate-x-1/2 rounded-full bg-card border border-border shadow-lg p-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Quick Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((p) => (
              <button
                key={p.text}
                onClick={() => sendMessage(p.text)}
                className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-xs text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground hover:bg-primary/5"
              >
                <span>{p.icon}</span>
                <span>{p.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-1.5 transition-colors focus-within:border-primary/50">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your career path..."
            rows={1}
            className="flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            style={{ height: "44px", maxHeight: "120px" }}
          />
          <button
            onClick={toggleVoice}
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${
              isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => sendMessage(input)}
            disabled={isStreaming || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground">
          Compass AI gives career advice for the Indian market • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
