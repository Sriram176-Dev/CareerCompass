import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { CAREERS } from "@/data/careers";
import { ArrowLeftRight, TrendingUp, Briefcase, GraduationCap, IndianRupee, Star, ChevronDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CareerComparison() {
  const [career1Id, setCareer1Id] = useState<number | null>(null);
  const [career2Id, setCareer2Id] = useState<number | null>(null);
  const [search1, setSearch1] = useState("");
  const [search2, setSearch2] = useState("");
  const [dropdown1, setDropdown1] = useState(false);
  const [dropdown2, setDropdown2] = useState(false);

  const c1 = CAREERS.find(c => c.id === career1Id);
  const c2 = CAREERS.find(c => c.id === career2Id);

  const filtered1 = useMemo(() =>
    CAREERS.filter(c => c.id !== career2Id && c.title.toLowerCase().includes(search1.toLowerCase())).slice(0, 8),
    [search1, career2Id]
  );
  const filtered2 = useMemo(() =>
    CAREERS.filter(c => c.id !== career1Id && c.title.toLowerCase().includes(search2.toLowerCase())).slice(0, 8),
    [search2, career1Id]
  );

  const demandRank = (d: string) => d === "Very High" ? 4 : d === "High" ? 3 : d === "Medium" ? 2 : 1;

  const CompareRow = ({ label, icon: Icon, val1, val2, highlight }: { label: string; icon: React.ElementType; val1: string; val2: string; highlight?: boolean }) => {
    return (
      <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center py-3 border-b border-border last:border-0">
        <div className="text-sm text-foreground text-right">{val1}</div>
        <div className="flex flex-col items-center gap-1">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
        </div>
        <div className="text-sm text-foreground">{val2}</div>
      </div>
    );
  };

  const CareerSelector = ({ value, search, setSearch, filtered, onSelect, showDropdown, setShowDropdown, placeholder }: { value: string; search: string; setSearch: (s: string) => void; filtered: Array<{ id: string; title: string; icon: string; cat: string }>; onSelect: (id: string) => void; showDropdown: boolean; setShowDropdown: (show: boolean) => void; placeholder: string }) => (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => { setSearch(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className="pl-9 text-sm"
        />
      </div>
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto"
          >
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => { onSelect(c.id); setSearch(c.title); setShowDropdown(false); }}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-muted/60 transition-colors flex items-center gap-2 border-b border-border/50 last:border-0"
              >
                <span>{c.icon}</span>
                <span className="font-medium text-foreground">{c.title}</span>
                <span className="text-[10px] text-muted-foreground ml-auto">{c.cat}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="px-4 py-3 text-xs text-muted-foreground text-center">No careers found</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <PageTransition>
      <div className="w-full max-w-4xl mx-auto px-6 py-8 space-y-6" onClick={() => { setDropdown1(false); setDropdown2(false); }}>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <ArrowLeftRight className="h-5 w-5 text-accent" />
            </span>
            Career Comparison
          </h1>
          <p className="text-sm text-muted-foreground">Compare two careers side-by-side</p>
        </div>

        {/* Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto,1fr] gap-4 items-start" onClick={e => e.stopPropagation()}>
          <CareerSelector
            value={career1Id} search={search1} setSearch={setSearch1}
            filtered={filtered1} onSelect={setCareer1Id}
            showDropdown={dropdown1} setShowDropdown={setDropdown1}
            placeholder="Search first career..."
          />
          <div className="hidden md:flex items-center justify-center pt-2">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <CareerSelector
            value={career2Id} search={search2} setSearch={setSearch2}
            filtered={filtered2} onSelect={setCareer2Id}
            showDropdown={dropdown2} setShowDropdown={setDropdown2}
            placeholder="Search second career..."
          />
        </div>

        {/* Comparison */}
        {c1 && c2 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Headers */}
            <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-center">
              <div className="glass-card text-center py-4">
                <div className="text-3xl mb-1">{c1.icon}</div>
                <h3 className="text-sm font-bold text-foreground">{c1.title}</h3>
                <span className="text-[10px] text-muted-foreground">{c1.cat}</span>
              </div>
              <div className="text-lg font-bold text-muted-foreground">VS</div>
              <div className="glass-card text-center py-4">
                <div className="text-3xl mb-1">{c2.icon}</div>
                <h3 className="text-sm font-bold text-foreground">{c2.title}</h3>
                <span className="text-[10px] text-muted-foreground">{c2.cat}</span>
              </div>
            </div>

            {/* Comparison card */}
            <div className="glass-card">
              <CompareRow label="Salary" icon={IndianRupee} val1={c1.salaryRange} val2={c2.salaryRange} />
              <CompareRow label="Demand" icon={TrendingUp} val1={c1.jobDemand} val2={c2.jobDemand} />
              <CompareRow label="Growth" icon={Star} val1={c1.growth} val2={c2.growth} />
              <CompareRow label="Work Style" icon={Briefcase} val1={c1.workStyle} val2={c2.workStyle} />
              <CompareRow label="Education" icon={GraduationCap} val1={c1.education} val2={c2.education} />
            </div>

            {/* Skills comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Skills for {c1.title}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {c1.skills.map(s => (
                    <span key={s} className={`px-2 py-1 rounded-full text-[10px] font-medium ${c2.skills.includes(s) ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {s} {c2.skills.includes(s) && "✓"}
                    </span>
                  ))}
                </div>
              </div>
              <div className="glass-card">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Skills for {c2.title}</h4>
                <div className="flex flex-wrap gap-1.5">
                  {c2.skills.map(s => (
                    <span key={s} className={`px-2 py-1 rounded-full text-[10px] font-medium ${c1.skills.includes(s) ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                      {s} {c1.skills.includes(s) && "✓"}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Top companies & colleges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Top Companies</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-primary mb-1">{c1.title}</p>
                    {c1.topCompanies.slice(0, 4).map(co => (
                      <p key={co} className="text-xs text-foreground">{co}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-accent mb-1">{c2.title}</p>
                    {c2.topCompanies.slice(0, 4).map(co => (
                      <p key={co} className="text-xs text-foreground">{co}</p>
                    ))}
                  </div>
                </div>
              </div>
              <div className="glass-card">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Top Colleges</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-primary mb-1">{c1.title}</p>
                    {c1.topColleges.slice(0, 4).map(co => (
                      <p key={co} className="text-xs text-foreground">{co}</p>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-accent mb-1">{c2.title}</p>
                    {c2.topColleges.slice(0, 4).map(co => (
                      <p key={co} className="text-xs text-foreground">{co}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Exams */}
            <div className="glass-card">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Entrance Exams</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-primary mb-2">{c1.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c1.examPath.map(e => (
                      <span key={e} className={`px-2 py-1 rounded-full text-[10px] font-medium ${c2.examPath.includes(e) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-accent mb-2">{c2.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c2.examPath.map(e => (
                      <span key={e} className={`px-2 py-1 rounded-full text-[10px] font-medium ${c1.examPath.includes(e) ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        {e}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="glass-card text-center py-12">
            <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Select two careers above to compare them</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
