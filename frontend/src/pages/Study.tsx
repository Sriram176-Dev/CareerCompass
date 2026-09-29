import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { BookOpen, Upload, RotateCcw, ChevronLeft, ChevronRight, FileText, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBadges } from "@/hooks/useBadges";
import { aiApi, profileApi } from "@/lib/api";
import { SkeletonFlashcard } from "@/components/SkeletonLoaders";
import EmptyState from "@/components/EmptyState";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import toast from "react-hot-toast";

interface Flashcard {
  front: string;
  back: string;
  difficulty: string;
  hint: string;
}

interface Deck {
  id: string;
  topic: string;
  cards: Flashcard[];
  progress: { easy: number; medium: number; hard: number };
  created_at: string;
}

async function extractPDFText(file: File): Promise<string> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = "";
  const pageCount = Math.min(pdf.numPages, 50); // Cap at 50 pages
  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: { str: string }) => item.str).join(" ");
    fullText += `\n[Page ${i}]\n${pageText}`;
  }
  return fullText;
}

export default function Study() {
  const { profile, addXp } = useAuth();
  const { checkBadges } = useBadges();
  const [mode, setMode] = useState<"topic" | "pdf">("topic");
  const [topic, setTopic] = useState("");
  const [cardCount, setCardCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [studying, setStudying] = useState<Deck | null>(null);
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);

  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) loadDecks();
  }, [profile]);

  const loadDecks = async () => {
    const data = await profileApi.get().catch(() => null);
    const decksRaw = data?.flashcard_decks || [];
    setDecks(
      [...decksRaw].reverse().map((d: { id: string; title: string; cards?: unknown[]; progress?: Record<string, number> }) => ({
        ...d,
        cards: (d.cards || []) as unknown as Flashcard[],
        progress: (d.progress || { easy: 0, medium: 0, hard: 0 }) as unknown as {
          easy: number;
          medium: number;
          hard: number;
        },
      }))
    );
  };

  const generateCards = async () => {
    if (!topic.trim()) {
      toast.error("Enter a topic");
      return;
    }
    setLoading(true);
    try {
      const data = await aiApi.generateFlashcards({ topic, count: cardCount, difficulty: "medium" });
      const cards = data?.flashcards || data?.cards || [];
      if (cards.length === 0) throw new Error("No cards generated");

      const newDeck = {
        id: crypto.randomUUID(),
        topic: data?.topic || topic,
        cards,
        source_type: "text",
        progress: { easy: 0, medium: 0, hard: 0 },
        created_at: new Date().toISOString(),
      };
      // Atomic $push — no stale read-modify-write race condition
      const result = await profileApi.pushFlashcardDeck(newDeck);
      if (result?.flashcard_decks) {
        const decksList = [...result.flashcard_decks].reverse().map((d: { id: string; title: string; cards?: unknown[]; progress?: Record<string, number> }) => ({
          ...d,
          cards: (d.cards || []) as unknown as Flashcard[],
          progress: (d.progress || { easy: 0, medium: 0, hard: 0 }) as unknown as { easy: number; medium: number; hard: number },
        }));
        setDecks(decksList);
      }

      await addXp(10, "Flashcards generated!");
      setTimeout(() => checkBadges(), 500);
      toast.success(`${cards.length} flashcards generated! 📚`);
      setTopic("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate flashcards");
    } finally {
      setLoading(false);
    }
  };

  const handlePdfSelect = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast.error("Please select a PDF file");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error("File too large (max 20MB)");
      return;
    }
    setPdfFile(file);
    setExtracting(true);
    setPdfText("");
    try {
      const text = await extractPDFText(file);
      if (text.trim().length < 50) {
        toast.error("Could not extract enough text from this PDF. It may be scanned/image-based.");
        setPdfFile(null);
        return;
      }
      setPdfText(text);
      // Count pages
      const pageMatches = text.match(/\[Page \d+\]/g);
      setPdfPageCount(pageMatches?.length || 0);
      toast.success(`Extracted text from ${pageMatches?.length || 0} pages ✅`);
    } catch (err) {
      console.error("PDF extraction error:", err);
      toast.error("Failed to extract text from PDF");
      setPdfFile(null);
    } finally {
      setExtracting(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handlePdfSelect(file);
    },
    [handlePdfSelect]
  );

  const generateFromPdf = async () => {
    if (!pdfText.trim()) {
      toast.error("No PDF text extracted");
      return;
    }
    setLoading(true);
    try {
      const data = await aiApi.generateFlashcards({
        topic: pdfFile?.name || "PDF Document",
        content: pdfText.substring(0, 12000),
        count: cardCount,
        difficulty: "medium",
      });
      const cards = data?.flashcards || data?.cards || [];
      if (cards.length === 0) throw new Error("No cards generated");

      const newDeck = {
        id: crypto.randomUUID(),
        topic: data?.topic || pdfFile?.name || "PDF Document",
        cards,
        source_type: "pdf",
        progress: { easy: 0, medium: 0, hard: 0 },
        created_at: new Date().toISOString(),
      };
      const result = await profileApi.pushFlashcardDeck(newDeck);
      if (result?.flashcard_decks) {
        const decksList = [...result.flashcard_decks].reverse().map((d: { id: string; title: string; cards?: unknown[]; progress?: Record<string, number> }) => ({
          ...d,
          cards: (d.cards || []) as unknown as Flashcard[],
          progress: (d.progress || { easy: 0, medium: 0, hard: 0 }) as unknown as { easy: number; medium: number; hard: number },
        }));
        setDecks(decksList);
      }

      await addXp(15, "PDF flashcards generated!");
      setTimeout(() => checkBadges(), 500);
      toast.success(`${cards.length} flashcards from PDF! 📄`);
      setPdfFile(null);
      setPdfText("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate flashcards from PDF");
    } finally {
      setLoading(false);
    }
  };

  const rateDifficulty = async (difficulty: "easy" | "medium" | "hard") => {
    if (!studying) return;
    const newProgress = {
      ...studying.progress,
      [difficulty]: (studying.progress[difficulty] || 0) + 1,
    };
    // Atomic PATCH on single deck — no stale read-modify-write
    await profileApi.updateFlashcardDeckProgress(studying.id, newProgress).catch(() => null);
    setStudying((prev) => (prev ? { ...prev, progress: newProgress } : null));

    if (currentCard < studying.cards.length - 1) {
      setFlipped(false);
      setCurrentCard((c) => c + 1);
    } else {
      await addXp(5, "Deck studied!");
      setTimeout(() => checkBadges(), 500);
      toast.success("Deck complete! 🎉");
      setStudying(null);
      setCurrentCard(0);
      setFlipped(false);
      loadDecks();
    }
  };

  // Keyboard shortcuts for study mode
  useKeyboardShortcuts({
    isStudyMode: !!studying,
    flipCard: () => setFlipped(f => !f),
    nextCard: () => {
      if (studying && currentCard < studying.cards.length - 1) {
        setCurrentCard(c => c + 1);
        setFlipped(false);
      }
    },
    prevCard: () => {
      if (currentCard > 0) {
        setCurrentCard(c => c - 1);
        setFlipped(false);
      }
    },
    rateCard: (difficulty) => {
      if (studying && flipped) rateDifficulty(difficulty);
    },
  });

  // Study mode
  if (studying) {
    const card = studying.cards[currentCard];
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="w-full max-w-lg">
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => {
                setStudying(null);
                setCurrentCard(0);
                setFlipped(false);
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to decks
            </button>
            <span className="text-sm text-muted-foreground">
              {currentCard + 1} / {studying.cards.length}
            </span>
          </div>
          <div className="h-1 rounded-full bg-muted mb-6">
            <div
              className="h-1 rounded-full bg-primary transition-all"
              style={{ width: `${((currentCard + 1) / studying.cards.length) * 100}%` }}
            />
          </div>

          <motion.div onClick={() => setFlipped(!flipped)} className="cursor-pointer" style={{ perspective: 1000 }}>
            <motion.div
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.4 }}
              style={{ transformStyle: "preserve-3d" }}
              className="relative h-64 rounded-xl border border-border bg-card"
            >
              <div
                className="absolute inset-0 flex flex-col items-center justify-center p-8"
                style={{ backfaceVisibility: "hidden" }}
              >
                <p className="text-center text-lg font-semibold text-foreground">{card?.front}</p>
                {card?.hint && <p className="mt-4 text-xs text-muted-foreground">💡 Hint: {card.hint}</p>}
                <p className="mt-4 text-xs text-primary">Tap to reveal answer</p>
              </div>
              <div
                className="absolute inset-0 flex flex-col items-center justify-center p-8"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <p className="text-center text-sm text-foreground">{card?.back}</p>
              </div>
            </motion.div>
          </motion.div>

          {flipped && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 flex gap-3">
              <button onClick={() => rateDifficulty("easy")} className="flex-1 rounded-lg bg-success/20 py-3 text-sm font-medium text-success">Easy</button>
              <button onClick={() => rateDifficulty("medium")} className="flex-1 rounded-lg bg-warning/20 py-3 text-sm font-medium text-warning">Medium</button>
              <button onClick={() => rateDifficulty("hard")} className="flex-1 rounded-lg bg-destructive/20 py-3 text-sm font-medium text-destructive">Hard</button>
            </motion.div>
          )}

          <div className="mt-4 flex justify-between">
            <button
              onClick={() => { if (currentCard > 0) { setCurrentCard((c) => c - 1); setFlipped(false); } }}
              disabled={currentCard === 0}
              className="text-muted-foreground disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={() => setFlipped(false)}>
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
            </button>
            <button
              onClick={() => { if (currentCard < studying.cards.length - 1) { setCurrentCard((c) => c + 1); setFlipped(false); } }}
              disabled={currentCard >= studying.cards.length - 1}
              className="text-muted-foreground disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Keyboard hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="mt-4 text-center text-xs text-muted-foreground/50"
          >
            Space to flip • ← → to navigate • 1/2/3 for difficulty
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-5xl mx-auto px-6 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-foreground">Flashcard Generator</h1>
          <p className="mt-1 text-muted-foreground">AI-powered flashcards for exam preparation</p>

          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setMode("topic")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                mode === "topic" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
              }`}
            >
              Enter Topic
            </button>
            <button
              onClick={() => setMode("pdf")}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-200 ${
                mode === "pdf" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"
              }`}
            >
              📄 Upload PDF
            </button>
          </div>

          {mode === "topic" ? (
            <div className="mt-6 space-y-4">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Data Structures, Organic Chemistry, Indian Polity..."
                className="w-full rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-all duration-200"
              />
              <div className="flex gap-2">
                {[5, 10, 15, 20].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCardCount(n)}
                    className={`rounded-lg px-4 py-2 text-sm transition-all duration-200 ${
                      cardCount === n
                        ? "bg-primary text-primary-foreground"
                        : "border border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    {n} cards
                  </button>
                ))}
              </div>
              <button
                onClick={generateCards}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-4 w-4" /> Generate Flashcards
                  </>
                )}
              </button>

              {loading && (
                <div className="mt-4">
                  <SkeletonFlashcard />
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfSelect(file);
                }}
              />

              {!pdfFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-12 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5"
                >
                  {extracting ? (
                    <>
                      <Loader2 className="h-10 w-10 text-primary mb-3 animate-spin" />
                      <p className="text-sm text-foreground font-medium">Extracting text from PDF...</p>
                      <p className="mt-1 text-xs text-muted-foreground">This may take a moment for large files</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-sm text-foreground font-medium">Drop a PDF here or click to browse</p>
                      <p className="mt-1 text-xs text-muted-foreground">Max 20MB • Up to 50 pages extracted</p>
                    </>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{pdfFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(pdfFile.size / 1024 / 1024).toFixed(1)}MB • {pdfPageCount} pages extracted
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setPdfFile(null);
                        setPdfText("");
                        setPdfPageCount(0);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Text preview */}
                  <div className="mt-3 rounded-lg bg-muted p-3 max-h-32 overflow-y-auto scrollbar-hide">
                    <p className="text-xs text-muted-foreground font-mono whitespace-pre-wrap">
                      {pdfText.substring(0, 500)}
                      {pdfText.length > 500 && "..."}
                    </p>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground">
                    ✅ {pdfText.length.toLocaleString()} characters extracted — ready to generate flashcards
                  </p>

                  <div className="mt-4 flex gap-2">
                    {[5, 10, 15, 20].map((n) => (
                      <button
                        key={n}
                        onClick={() => setCardCount(n)}
                        className={`rounded-lg px-4 py-2 text-sm transition-all duration-200 ${
                          cardCount === n
                            ? "bg-primary text-primary-foreground"
                            : "border border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {n} cards
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={generateFromPdf}
                    disabled={loading}
                    className="btn-primary w-full mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Generating from PDF...
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-4 w-4" /> Generate Flashcards from PDF
                      </>
                    )}
                  </button>

                  {loading && (
                    <div className="mt-4">
                      <SkeletonFlashcard />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {decks.length > 0 ? (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">Your Decks</h2>
              <div className="space-y-3">
                {decks.map((deck) => {
                  const total = deck.progress.easy + deck.progress.medium + deck.progress.hard;
                  const mastery = total ? Math.round((deck.progress.easy / Math.max(total, 1)) * 100) : 0;
                  return (
                    <div key={deck.id} className="glass-card flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{deck.topic}</p>
                        <p className="text-xs text-muted-foreground">{deck.cards.length} cards • {mastery}% mastery</p>
                      </div>
                      <button
                        onClick={() => {
                          setStudying(deck);
                          setCurrentCard(0);
                          setFlipped(false);
                        }}
                        className="btn-primary text-xs px-4 py-2"
                      >
                        Study
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-8">
              <EmptyState type="noFlashcards" onAction={() => setMode("topic")} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
    </PageTransition>
  );
}
