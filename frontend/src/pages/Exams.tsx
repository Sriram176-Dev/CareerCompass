import { useState, useMemo, useEffect } from "react";
import PageTransition from "@/components/PageTransition";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, ExternalLink, FileText, GraduationCap, Video, Globe, Smartphone, Bookmark, BookmarkCheck, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EXAMS_DATA, EXAM_CATEGORIES, EXAM_LEVELS, STREAMS, type ExamResource } from "@/data/exams";
import { profileApi } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Exams() {
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [savedExams, setSavedExams] = useState<string[]>([]);
  const { user } = useAuth();

  // Load saved exams from profile
  useEffect(() => {
    if (!user) { setSavedExams([]); return; }
    profileApi.get().then((p) => setSavedExams(p?.saved_exam_names || [])).catch(() => {});
  }, [user]);

  const toggleBookmark = async (examName: string) => {
    if (!user) {
      toast.error("Please log in to bookmark exams");
      return;
    }

    const isBookmarked = savedExams.includes(examName);
    const updated = isBookmarked
      ? savedExams.filter((n) => n !== examName)
      : [...savedExams, examName];
    setSavedExams(updated);
    await profileApi.update({ saved_exam_names: updated }).catch(() => {});
    toast.success(isBookmarked ? "Exam removed from bookmarks" : "Exam bookmarked!");
  };

  const states = useMemo(() => {
    const stateSet = new Set(EXAMS_DATA.filter(e => e.state).map(e => e.state));
    return Array.from(stateSet).sort();
  }, []);

  const filteredExams = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return EXAMS_DATA.filter(exam => {
      if (showBookmarked && !savedExams.includes(exam.name)) return false;
      if (selectedLevel !== "all" && exam.level !== selectedLevel) return false;
      if (selectedCategory !== "all" && exam.category !== selectedCategory) return false;
      if (selectedState !== "all" && exam.state !== selectedState) return false;
      if (query) {
        const searchable = `${exam.name} ${exam.description} ${exam.eligibility} ${exam.tags.join(" ")} ${exam.stream || ""} ${exam.state || ""}`.toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      return true;
    });
  }, [selectedLevel, selectedCategory, selectedState, showBookmarked, savedExams, searchQuery]);

  const getResourceIcon = (type: string) => {
    switch (type) {
      case "video": return <Video className="h-3 w-3" />;
      case "pdf": return <FileText className="h-3 w-3" />;
      case "app": return <Smartphone className="h-3 w-3" />;
      default: return <Globe className="h-3 w-3" />;
    }
  };

  const ExamCard = ({ exam }: { exam: ExamResource }) => {
    const isBookmarked = savedExams.includes(exam.name);

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle className="text-lg">{exam.name}</CardTitle>
              <CardDescription className="mt-1">{exam.description}</CardDescription>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => toggleBookmark(exam.name)}
                title={isBookmarked ? "Remove bookmark" : "Bookmark this exam"}
              >
                {isBookmarked ? (
                  <BookmarkCheck className="h-4 w-4 text-primary fill-primary" />
                ) : (
                  <Bookmark className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
              <Badge variant="outline" className="shrink-0">
                {EXAM_CATEGORIES[exam.category]}
              </Badge>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className="text-xs">
              <GraduationCap className="h-3 w-3 mr-1" />
              {EXAM_LEVELS[exam.level]}
            </Badge>
            {exam.stream && (
              <Badge variant="secondary" className="text-xs">
                {STREAMS[exam.stream]}
              </Badge>
            )}
            {exam.state && (
              <Badge variant="secondary" className="text-xs">
                📍 {exam.state}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium text-muted-foreground">Eligibility:</span>
              <p className="text-foreground mt-1">{exam.eligibility}</p>
            </div>
            {exam.examDate && (
              <div>
                <span className="font-medium text-muted-foreground">Exam Date:</span>
                <p className="text-foreground mt-1">{exam.examDate}</p>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Free Resources</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {exam.freeResources.map((resource, idx) => (
                <a
                  key={idx}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-colors group"
                >
                  <div className="shrink-0 text-muted-foreground group-hover:text-primary">
                    {getResourceIcon(resource.type)}
                  </div>
                  <span className="text-xs flex-1 truncate">{resource.title}</span>
                  <ExternalLink className="h-3 w-3 text-muted-foreground group-hover:text-primary shrink-0" />
                </a>
              ))}
            </div>
          </div>

          {exam.officialWebsite && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              asChild
            >
              <a href={exam.officialWebsite} target="_blank" rel="noopener noreferrer">
                Official Website <ExternalLink className="h-3 w-3 ml-2" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <PageTransition>
      <div className="w-full max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Competitive Exams & Resources
            </h1>
            <p className="text-muted-foreground">
              Comprehensive guide to entrance exams with free preparation resources
            </p>
          </div>
          {user && (
            <Button
              variant={showBookmarked ? "default" : "outline"}
              onClick={() => setShowBookmarked(!showBookmarked)}
              className="gap-2"
            >
              <BookmarkCheck className="h-4 w-4" />
              {showBookmarked ? "Show All" : `Bookmarked (${savedExams.length})`}
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exams by name, tag, or keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedLevel} onValueChange={setSelectedLevel} className="mb-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All Levels</TabsTrigger>
                <TabsTrigger value="10th">Class 10</TabsTrigger>
                <TabsTrigger value="intermediate">12th/Inter</TabsTrigger>
                <TabsTrigger value="btech">B.Tech</TabsTrigger>
                <TabsTrigger value="general">Graduate</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="all">All Categories</option>
                  {Object.entries(EXAM_CATEGORIES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  State (for state exams)
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="all">All States</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredExams.length} exam{filteredExams.length !== 1 ? 's' : ''}
          {showBookmarked && " (bookmarked only)"}
        </div>

        {/* Exams grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam, idx) => (
            <ExamCard key={idx} exam={exam} />
          ))}
        </div>

        {filteredExams.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">
              {showBookmarked
                ? "No bookmarked exams yet. Click the bookmark icon on any exam to save it!"
                : "No exams found matching your filters. Try adjusting your selection."}
            </p>
          </Card>
        )}

        {/* Quick Tips */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">💡 Quick Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>• Most engineering exams require MPC (Math, Physics, Chemistry) stream</p>
            <p>• Medical exams require BiPC (Biology, Physics, Chemistry) stream</p>
            <p>• Start with NCERT books - they form the foundation for most exams</p>
            <p>• Practice previous year papers extensively</p>
            <p>• For state exams, check your state's eligibility criteria carefully</p>
            <p>• Many resources are completely free - explore before paid coaching</p>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
}
