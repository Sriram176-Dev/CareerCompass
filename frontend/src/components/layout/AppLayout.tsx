import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "@/components/layout/NavLink";
import NotificationCenter from "@/components/layout/NotificationCenter";
import { Map, Timer, CheckSquare, Sparkles, BookOpen, FileText, User, LogOut, Compass, GraduationCap, Brain, ArrowLeftRight, StickyNote } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const mainNav = [
  { title: "Roadmap", url: "/roadmap", icon: Map, color: "text-primary" },
  { title: "Pomodoro", url: "/pomodoro", icon: Timer, color: "text-destructive" },
  { title: "Tasks", url: "/tasks", icon: CheckSquare, color: "text-success" },
  { title: "Flashcards", url: "/study", icon: BookOpen, color: "text-warning" },
  { title: "Documents", url: "/documents", icon: FileText, color: "text-accent" },
  { title: "Exams", url: "/exams", icon: GraduationCap, color: "text-primary" },
  { title: "Features", url: "/features", icon: Sparkles, color: "text-primary" },
  { title: "Daily Quiz", url: "/daily-quiz", icon: Brain, color: "text-warning" },
  { title: "Compare", url: "/compare", icon: ArrowLeftRight, color: "text-accent" },
  { title: "Study Notes", url: "/study-notes", icon: StickyNote, color: "text-success" },
  { title: "Profile", url: "/profile", icon: User, color: "text-muted-foreground" },
];

function AppSidebarContent() {
  const { profile } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const navigate = useNavigate();

  const { signOut } = useAuth();
  const handleLogout = () => {
    signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="bg-sidebar">
        {/* Brand */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Compass className="h-4 w-4" />
          </div>
          {!collapsed && <span className="text-sm font-bold text-foreground">AI Career Compass</span>}
        </div>

        {/* User info */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground shadow-md">
                {profile?.name?.[0] || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{profile?.name || "Student"}</p>
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    Lvl {profile?.level || 1}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{profile?.xp || 0} XP</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-all"
                      activeClassName="bg-primary/10 text-primary font-medium shadow-sm"
                    >
                      <item.icon className={`h-4 w-4 shrink-0 ${item.color}`} />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Logout */}
        <div className="mt-auto px-4 py-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background text-foreground transition-colors duration-400">
        <AppSidebarContent />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 sticky top-0 z-40">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="flex items-center gap-2">
              <NotificationCenter />
            </div>
          </header>
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
